const fs = require('fs');
const path = require('path');
const pool = require('../db');

const migrationsDirectory = path.resolve(__dirname, '..', 'migrations');
const migrationFilePattern = /^\d{14}_[a-z0-9]+(?:[_-][a-z0-9]+)*\.sql$/;

function getMigrationFiles() {
  if (!fs.existsSync(migrationsDirectory)) {
    return [];
  }

  return fs.readdirSync(migrationsDirectory)
    .filter((fileName) => migrationFilePattern.test(fileName))
    .sort();
}

async function runMigrations() {
  const migrationFiles = getMigrationFiles();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        migration_name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const appliedResult = await client.query(
      'SELECT migration_name FROM schema_migrations',
    );
    const appliedMigrations = new Set(
      appliedResult.rows.map((row) => row.migration_name),
    );
    const pendingFiles = migrationFiles.filter(
      (fileName) => !appliedMigrations.has(fileName),
    );

    for (const fileName of pendingFiles) {
      const migrationPath = path.join(migrationsDirectory, fileName);
      const sql = fs.readFileSync(migrationPath, 'utf8').trim();

      if (sql) {
        await client.query(sql);
      }

      await client.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
        [fileName],
      );
      console.log(`Applied ${fileName}`);
    }

    await client.query('COMMIT');
    console.log(
      pendingFiles.length
        ? `Applied ${pendingFiles.length} migration(s).`
        : 'No pending migrations.',
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.error('Migration runner failed:', error.message);
  process.exitCode = 1;
});
