const { AppError } = require('../shared/errors');
const { hashToken } = require('../shared/passwords');
const pool = require('../db');

async function authenticate(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.'));
    return;
  }

  try {
    const result = await pool.query(
      `SELECT u.uuid, u.email, u.first_name, u.last_name, u.status,
              s.uuid AS session_id,
              ARRAY_REMOVE(ARRAY_AGG(r.role_name), NULL) AS roles
         FROM auth_sessions s
         JOIN users u ON u.uuid = s.user_id
    LEFT JOIN user_role_maps urm ON urm.user_id = u.uuid
    LEFT JOIN roles r ON r.uuid = urm.role_id
        WHERE s.access_token_hash = $1
          AND s.revoked_at IS NULL
          AND s.access_expires_at > NOW()
          AND u.status = 'active'
        GROUP BY u.uuid, s.uuid`,
      [hashToken(token)],
    );

    if (result.rowCount === 0) {
      next(new AppError(401, 'INVALID_ACCESS_TOKEN', 'The access token is invalid or expired.'));
      return;
    }

    const user = result.rows[0];
    await pool.query(
      'UPDATE auth_sessions SET last_used_at = NOW() WHERE uuid = $1',
      [user.session_id],
    );

    req.user = {
      id: user.uuid,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      roles: user.roles || [],
      sessionId: user.session_id,
    };
    req.accessToken = token;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authenticate;
