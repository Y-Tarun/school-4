const fs = require('fs');
const path = require('path');

const migrationsDirectory = path.resolve(__dirname, '..', 'migrations');
const migrationName = process.argv[2];
const migrationNamePattern = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/;

function getTimestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');

  return [
    now.getUTCFullYear(),
    pad(now.getUTCMonth() + 1),
    pad(now.getUTCDate()),
    pad(now.getUTCHours()),
    pad(now.getUTCMinutes()),
    pad(now.getUTCSeconds()),
  ].join('');
}

if (!migrationName || !migrationNamePattern.test(migrationName)) {
  console.error('Migration name must contain lowercase letters, numbers, underscores, or hyphens.');
  process.exitCode = 1;
} else {
  fs.mkdirSync(migrationsDirectory, { recursive: true });

  const migrationPath = path.join(
    migrationsDirectory,
    `${getTimestamp()}_${migrationName}.sql`,
  );

  if (fs.existsSync(migrationPath)) {
    console.error(`Migration already exists: ${path.basename(migrationPath)}`);
    process.exitCode = 1;
  } else {
    fs.writeFileSync(migrationPath, '');
    console.log(`Created ${path.relative(process.cwd(), migrationPath)}`);
  }
}
