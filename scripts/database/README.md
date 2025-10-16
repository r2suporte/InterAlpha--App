# Database Scripts

Scripts for database setup, initialization, and migration.

## Scripts

| Script | Purpose |
|--------|---------|
| `setup-database.js` | Initialize complete database schema |
| `apply-migration-direct.js` | Apply Prisma migrations directly |
| `create-admin-direct.js` | Create admin user in database |
| `create-tables-direct.js` | Create tables directly in database |
| `apply-schema.js` | Apply schema changes |
| `fix-check-constraint.js` | Fix database constraints |
| `fix-cliente-id-final.js` | Fix cliente ID issues |

## Usage

```bash
# Setup database from scratch
node scripts/database/setup-database.js

# Create admin user
node scripts/database/create-admin-direct.js

# Apply migrations
node scripts/database/apply-migration-direct.js
```

## ⚠️ Caution

- **Backup database before running** migration or fix scripts
- These scripts directly modify database structure
- Test in development first
- Verify environment variables are correct

## Environment Variables Required

```
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_KEY=...
```
