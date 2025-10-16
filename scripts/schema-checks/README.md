# Schema Checks & Verification

Scripts for validating, checking, and debugging database schema, constraints, RLS policies, and triggers.

## Scripts

### Check Scripts (Validation)
| Script | Purpose |
|--------|---------|
| `check-tables.js` | Verify all tables exist |
| `check-constraints.js` | Check database constraints |
| `check-rls-policies.js` | Verify RLS (Row Level Security) policies |
| `check-schema-differences.js` | Compare schema against expected |
| `check-schema-sync.js` | Sync schema between environments |
| `check-table-structure.js` | Verify table structure and columns |
| `check-users.js` | Check user data and permissions |
| `check-triggers.js` | Validate database triggers |

### Debug Scripts (Troubleshooting)
| Script | Purpose |
|--------|---------|
| `debug-active-triggers.js` | List and debug active triggers |
| `debug-all-functions.js` | List and debug all database functions |

### SQL Files (Direct Queries)
| File | Purpose |
|------|---------|
| `check-functions.sql` | Query database functions |
| `check-triggers-dashboard.sql` | Check dashboard-related triggers |
| `check-triggers.sql` | Query all triggers |
| `create-tables-supabase.sql` | Supabase table creation SQL |
| `create-tables.sql` | Standard table creation SQL |

## Usage

```bash
# Check all tables
node scripts/schema-checks/check-tables.js

# Check RLS policies
node scripts/schema-checks/check-rls-policies.js

# Debug triggers
node scripts/schema-checks/debug-active-triggers.js

# Run SQL query
psql -c "\i scripts/schema-checks/check-functions.sql"
```

## ⚠️ Caution

- These scripts are **read-only** for most operations
- Some may modify schema - review before running
- Always backup before running `create-tables-*.sql`

## Environment Variables Required

```
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_KEY=...
```
