require('dotenv').config();
const pool = require('../db');
const { hashPassword } = require('../shared/passwords');

async function createAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set.');
  }
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters long.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ((LOWER(email))) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             status = 'active',
             updated_at = NOW()
       RETURNING uuid`,
      [
        ADMIN_EMAIL,
        hashPassword(ADMIN_PASSWORD),
        ADMIN_FIRST_NAME || 'School',
        ADMIN_LAST_NAME || 'Administrator',
      ],
    );
    const roleResult = await client.query(
      "SELECT uuid FROM roles WHERE role_name = 'admin'",
    );
    await client.query(
      `INSERT INTO user_role_maps (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userResult.rows[0].uuid, roleResult.rows[0].uuid],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin()
  .then(() => console.log('Admin account created or updated.'))
  .catch((error) => {
    console.error(`Admin setup failed: ${error.message}`);
    process.exitCode = 1;
  });
