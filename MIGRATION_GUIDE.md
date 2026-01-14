# Running SQL Migrations on Windows

Since `psql` is not in your PATH on Windows, here are several ways to run the SQL migration scripts:

## Method 1: Using Node.js Scripts (Recommended - No psql needed)

I've created Node.js scripts that use the `pg` library (already in your dependencies) to run migrations.

### Run All Migrations

```bash
npm run migrate
```

Or directly:
```bash
node scripts/run-migrations.js
```

### Run a Single Script

```bash
npm run migrate:single 017_seed_core_data.sql
```

Or directly:
```bash
node scripts/run-single-script.js 017_seed_core_data.sql
```

**Note:** Make sure you have a `.env.local` file with your database connection string, or set environment variables:
- `DATABASE_URL` or `POSTGRES_URL` or `POSTGRES_URL_NON_POOLING`

Default connection string: `postgresql://postgres:12345678@localhost:5432/wordgame`

## Method 2: Using Docker (Easiest if database is in Docker)

If your database is running in Docker, you can use `docker exec` to run psql:

### Run a Single Script

```bash
docker exec -i word-game-db psql -U postgres -d wordgame < scripts/017_seed_core_data.sql
```

### Run All Scripts

```bash
# Windows CMD
for %f in (scripts\*.sql) do docker exec -i word-game-db psql -U postgres -d wordgame < %f

# PowerShell
Get-ChildItem scripts\*.sql | ForEach-Object { docker exec -i word-game-db psql -U postgres -d wordgame < $_.FullName }
```

## Method 3: Using Docker Compose (Automatic)

If you're using Docker for the database, the migrations run automatically when you first start the database:

```bash
docker-compose up db -d
```

The scripts in the `scripts/` directory are automatically mounted to `/docker-entrypoint-initdb.d/` and run in alphabetical order when the database is first initialized.

**Note:** This only works on the FIRST initialization. If the database volume already exists, you need to reset it:

```bash
docker-compose down -v
docker-compose up db -d
```

## Method 4: Using Full Path to psql (If PostgreSQL is installed)

If PostgreSQL is installed but not in PATH, use the full path:

### Find PostgreSQL Installation

Common locations on Windows:
- `C:\Program Files\PostgreSQL\16\bin\psql.exe`
- `C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe`

### Run Script

```bash
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d wordgame -f scripts\017_seed_core_data.sql
```

Or add PostgreSQL to your PATH:
1. Open System Properties → Environment Variables
2. Edit PATH variable
3. Add: `C:\Program Files\PostgreSQL\16\bin`
4. Restart terminal

## Method 5: Using pgAdmin (GUI Tool)

1. Install pgAdmin (comes with PostgreSQL installer)
2. Connect to your database
3. Open Query Tool
4. Open the SQL file (`scripts/017_seed_core_data.sql`)
5. Execute the script

## Method 6: Using VS Code Extension

1. Install "PostgreSQL" extension in VS Code
2. Connect to your database
3. Open the SQL file
4. Right-click → "Execute Query" or use `Ctrl+Shift+E`

## Troubleshooting

### Connection Error

If you get connection errors, check:
1. Database is running: `docker-compose ps db` (if using Docker)
2. Connection string in `.env.local` is correct
3. Database exists: The script will create tables, but database must exist first

### Script Already Run

The scripts use `IF NOT EXISTS` and `ON CONFLICT DO NOTHING`, so running them multiple times is safe. You'll see warnings for existing objects, which is normal.

### Password Issues

If you get authentication errors:
- Check the password in your connection string
- Default Docker password: `12345678` (as per your docker-compose.yml)
- Update `.env.local` with correct credentials

## Recommended Approach

**For Development:**
- Use **Method 1** (Node.js scripts) - easiest and works everywhere
- Or use **Method 2** (Docker exec) if database is in Docker

**For First-Time Setup:**
- Use **Method 3** (Docker Compose) - migrations run automatically
