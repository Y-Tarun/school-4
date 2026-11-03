const pool = require('../../db');
const { AppError } = require('../../shared/errors');
const {
  createToken,
  hashPassword,
  hashToken,
  verifyPassword,
} = require('../../shared/passwords');

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getExpiry(milliseconds) {
  return new Date(Date.now() + milliseconds);
}

async function getUserWithRoles(userId) {
  const result = await pool.query(
    `SELECT u.uuid, u.email, u.first_name, u.last_name, u.status,
            ARRAY_REMOVE(ARRAY_AGG(r.role_name), NULL) AS roles
       FROM users u
  LEFT JOIN user_role_maps urm ON urm.user_id = u.uuid
  LEFT JOIN roles r ON r.uuid = urm.role_id
      WHERE u.uuid = $1
      GROUP BY u.uuid`,
    [userId],
  );
  return result.rows[0] || null;
}

function toUserResponse(user) {
  return {
    id: user.uuid,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    roles: user.roles || [],
  };
}

async function createSession(userId) {
  const accessToken = createToken();
  const refreshToken = createToken();
  const accessExpiresAt = getExpiry(ACCESS_TOKEN_TTL_MS);
  const refreshExpiresAt = getExpiry(REFRESH_TOKEN_TTL_MS);

  await pool.query(
    `INSERT INTO auth_sessions
      (user_id, access_token_hash, refresh_token_hash, access_expires_at, refresh_expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      userId,
      hashToken(accessToken),
      hashToken(refreshToken),
      accessExpiresAt,
      refreshExpiresAt,
    ],
  );

  return {
    accessToken,
    refreshToken,
    accessExpiresAt: accessExpiresAt.toISOString(),
    refreshExpiresAt: refreshExpiresAt.toISOString(),
  };
}

async function login(email, password) {
  const result = await pool.query(
    `SELECT uuid, email, first_name, last_name, password_hash, status
       FROM users
      WHERE LOWER(email) = LOWER($1)`,
    [email],
  );
  const user = result.rows[0];

  if (!user || user.status !== 'active' || !verifyPassword(password, user.password_hash)) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  const userWithRoles = await getUserWithRoles(user.uuid);
  const tokens = await createSession(user.uuid);
  await pool.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id)
     VALUES ($1, 'login', 'user', $1)`,
    [user.uuid],
  );

  return { user: toUserResponse(userWithRoles), ...tokens };
}

async function refresh(refreshToken) {
  const result = await pool.query(
    `SELECT s.uuid AS session_id, u.uuid AS user_id
       FROM auth_sessions s
       JOIN users u ON u.uuid = s.user_id
      WHERE s.refresh_token_hash = $1
        AND s.revoked_at IS NULL
        AND s.refresh_expires_at > NOW()
        AND u.status = 'active'`,
    [hashToken(refreshToken)],
  );

  if (result.rowCount === 0) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'The refresh token is invalid or expired.');
  }

  const accessToken = createToken();
  const nextRefreshToken = createToken();
  const accessExpiresAt = getExpiry(ACCESS_TOKEN_TTL_MS);
  const refreshExpiresAt = getExpiry(REFRESH_TOKEN_TTL_MS);
  const session = result.rows[0];

  await pool.query(
    `UPDATE auth_sessions
        SET access_token_hash = $1,
            refresh_token_hash = $2,
            access_expires_at = $3,
            refresh_expires_at = $4,
            last_used_at = NOW()
      WHERE uuid = $5`,
    [
      hashToken(accessToken),
      hashToken(nextRefreshToken),
      accessExpiresAt,
      refreshExpiresAt,
      session.session_id,
    ],
  );

  return {
    accessToken,
    refreshToken: nextRefreshToken,
    accessExpiresAt: accessExpiresAt.toISOString(),
    refreshExpiresAt: refreshExpiresAt.toISOString(),
  };
}

async function revokeAccessToken(accessToken) {
  await pool.query(
    `UPDATE auth_sessions
        SET revoked_at = NOW()
      WHERE access_token_hash = $1
        AND revoked_at IS NULL`,
    [hashToken(accessToken)],
  );
}

async function resetPassword(actorUserId, targetUserId, password) {
  const target = await getUserWithRoles(targetUserId);
  if (!target) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User was not found.');
  }

  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE uuid = $2',
    [hashPassword(password), targetUserId],
  );
  await pool.query(
    'UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
    [targetUserId],
  );
  await pool.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id)
     VALUES ($1, 'password_reset', 'user', $2)`,
    [actorUserId, targetUserId],
  );
}

module.exports = {
  login,
  refresh,
  revokeAccessToken,
  resetPassword,
  getUserWithRoles,
  toUserResponse,
};
