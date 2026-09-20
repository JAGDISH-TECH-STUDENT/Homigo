# Homigo

## Integration tests

Integration tests require a disposable MongoDB database. Set `TEST_DATABASE_URL` to a dedicated test database before running them; the test suite drops that database during cleanup.

PowerShell example:

```powershell
$env:TEST_DATABASE_URL = "mongodb://127.0.0.1:27017/homigo_test"
npm run test:integration
```

Do not point `TEST_DATABASE_URL` at production data.