# Test Scripts

API endpoint tests and integration tests for debugging and validation.

## Scripts

| Script | Purpose |
|--------|---------|
| `test-apis-complete.js` | Complete API endpoint test suite |
| `test-apis-quick.js` | Quick API smoke tests |
| `test-apis.js` | General API tests |
| `test-cnpj-fallback.js` | Test CNPJ lookup fallback behavior |
| `test-create-table.js` | Test table creation API |
| `test-insert.js` | Test data insertion |
| `test-os-flow.js` | Complete order flow test |
| `test-supabase-connection.js` | Test Supabase connection |
| `test-supabase-simple.js` | Simple Supabase connection test |

## Usage

```bash
# Test Supabase connection
node scripts/tests/test-supabase-connection.js

# Run complete API test suite
node scripts/tests/test-apis-complete.js

# Quick smoke tests
node scripts/tests/test-apis-quick.js

# Test order flow
node scripts/tests/test-os-flow.js
```

## Expected Output

Successful tests should output:
```
✅ Connected to Supabase
✅ API endpoint responding
✅ Test passed
```

## Environment Variables Required

```
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## ⚠️ Notes

- Run these against **development** environment first
- Some tests may insert test data - review before production use
- Tests assume certain database state
- May be outdated as codebase evolves
