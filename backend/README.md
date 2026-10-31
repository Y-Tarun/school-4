# Backend migrations

Create an empty migration file with:

```sh
npm run newMigration -- add_users
```

This creates a UTC-timestamped file such as
`migrations/20261101000348_add_users.sql`.

Apply pending migrations with:

```sh
npm run migrate
```

Applied migration filenames are recorded in the `schema_migrations` table.
Pending files run in filename order inside one transaction. The runner uses
the `DB_*` PostgreSQL environment variables configured in `.env`.
