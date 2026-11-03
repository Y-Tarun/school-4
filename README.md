# Tarun School

The current system design and implementation boundaries are documented in
[docs/architecture.md](docs/architecture.md).

## Initial admin account

After PostgreSQL is available and migrations have run, create or update the
development administrator from the `backend` directory:

```powershell
$env:ADMIN_EMAIL = "admin@school.local"
$env:ADMIN_PASSWORD = "change-this-password"
npm run createAdmin
```

The authentication foundation uses short-lived access tokens with refresh
tokens. Passwords are stored as scrypt hashes, and the admin reset endpoint
revokes the target user's active sessions.

## Development with Docker

Copy the example environment file before starting the stack:

```powershell
Copy-Item .env.example .env
```

Start the frontend, backend, and PostgreSQL services:

```powershell
docker compose up --build
```

Open the frontend at <http://localhost:3000>. The Vite development server
proxies `/api` requests to the backend container. The backend listens on
`backend:4000` inside the Compose network and is intentionally not exposed
directly on the host. PostgreSQL is available to the application as
`db:5432` and is exposed on host port `8000` for database tools.

## Connecting with DBeaver

After the stack is running, create a PostgreSQL connection in DBeaver with:

```text
Host: localhost
Port: 8000
Database: dbnamefrom.env
Username: usernamefrom.env
Password: passwordfrom.env
```

Use the values from your local `.env` file if they differ. The database
container uses PostgreSQL port `5432` internally; `8000` is only the host
port used by DBeaver.

The backend waits for PostgreSQL to become healthy, runs all pending SQL
migrations, and then starts its file-watching server. Migration filenames are
recorded in the `schema_migrations` table, so restarting the stack does not
reapply completed migrations.

Stop the services while retaining database data:

```powershell
docker compose down
```

Remove the database volume as well when a clean database is needed:

```powershell
docker compose down -v
```

## Running without Docker

Use the existing `frontend` and `backend` package scripts. When running the
backend locally, set `DB_HOST=localhost` and use the PostgreSQL credentials
from `.env`.
