# Utility & Investigation Scripts

Miscellaneous utility scripts for investigation, debugging, and setup.

## Scripts

### Debug Scripts
| Script | Purpose |
|--------|---------|
| `debug-insert.js` | Debug data insertion issues |
| `debug-triggers.js` | Debug database trigger behavior |

### Investigation Scripts
| Script | Purpose |
|--------|---------|
| `investigate-cliente-id.js` | Investigate cliente ID issues |
| `investigate-cp.js` | Investigate CP (código postal) issues |
| `investigate-cp-references.sql` | SQL investigation of CP references |
| `investigate.sql` | General investigation SQL |

### Setup & Configuration
| Script | Purpose |
|--------|---------|
| `setup-production-environment.js` | Configure production environment |
| `disable-trigger-temp.js` | Temporarily disable triggers (⚠️ use carefully) |

### Monitoring & Verification
| Script | Purpose |
|--------|---------|
| `monitor-logs-os.js` | Monitor order service logs |
| `verify-table-structure.js` | Verify table structure integrity |
| `verify-tables.js` | Verify table existence |

## Usage

```bash
# Monitor OS logs
node scripts/utils/monitor-logs-os.js

# Investigate specific issues
node scripts/utils/investigate-cliente-id.js
node scripts/utils/investigate-cp.js

# Verify tables
node scripts/utils/verify-tables.js

# Setup production
node scripts/utils/setup-production-environment.js
```

## ⚠️ Caution

- **`disable-trigger-temp.js`** - Use only when you understand the implications
- **`setup-production-environment.js`** - Verify before running in production
- These scripts are exploratory in nature and may be outdated
- Always backup database before running utilities that modify state
- Test thoroughly in development first

## Environment Variables Required

```
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_KEY=...
```

## Notes

- Many of these scripts were created during debugging/investigation
- They may contain hardcoded values specific to past issues
- Review code carefully before running against live data
- Consider adding to `.gitignore` if they contain sensitive information
