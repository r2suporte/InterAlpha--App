# 📂 Scripts Directory

This directory contains helper scripts for development, testing, and debugging.

## 📁 Structure

### `/database`
Database setup and migration scripts.
- `setup-database.js` - Initialize database schema
- `apply-migration-direct.js` - Apply migrations directly
- `create-admin-direct.js` - Create admin user directly
- Other database utilities

**Usage:**
```bash
node scripts/database/setup-database.js
node scripts/database/apply-migration-direct.js
```

### `/schema-checks`
SQL and schema validation/debugging scripts.
- `check-*.js` - Check various schema aspects (tables, constraints, RLS policies, etc)
- `check-*.sql` - Direct SQL checks
- `create-tables-*.sql` - Table creation SQL files
- `debug-*.js` - Debug database triggers and functions

**Usage:**
```bash
node scripts/schema-checks/check-tables.js
psql -c "\i scripts/schema-checks/check-functions.sql"
```

### `/tests`
API and integration test scripts.
- `test-apis-*.js` - API endpoint tests
- `test-supabase-*.js` - Supabase connection tests
- `test-create-table.js` - Table creation tests
- `test-os-flow.js` - Full order flow tests

**Usage:**
```bash
node scripts/tests/test-apis-complete.js
node scripts/tests/test-supabase-connection.js
```

### `/utils`
Utility and investigation scripts.
- `debug-*.js` - Debug specific issues
- `investigate-*.js` - Investigation scripts for problem analysis
- `monitor-logs-os.js` - OS log monitoring
- `setup-production-environment.js` - Production setup
- `verify-*.js` - Verification scripts

**Usage:**
```bash
node scripts/utils/monitor-logs-os.js
node scripts/utils/debug-insert.js
```

## ⚙️ Configuration

Some scripts may require environment variables:
```bash
# .env file should include:
DATABASE_URL=...
SUPABASE_URL=...
SUPABASE_KEY=...
```

## 🚫 Git Management

These scripts are tracked in git (not in `.gitignore`) to preserve development history and make them available for team members.

However, be careful not to run dangerous operations in production environments:
- Don't run `fix-*.js` scripts without understanding what they do
- Don't run `disable-trigger-temp.js` without intent
- Verify `setup-production-environment.js` before using in prod

## 📝 Notes

- These scripts are development/debugging aids
- Most are safe to run in development but should be carefully reviewed before production use
- Always backup database before running migration scripts
- Some scripts are exploratory and may need updates

## 🔄 Legacy Structure

The root directory previously contained these scripts. They have been organized here for better project structure and maintainability.

---

**Last updated:** October 2025
