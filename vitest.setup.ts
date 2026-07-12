// Provide the environment variables that `src/env.ts` validates at import time.
// Unit tests mock the database and S3, so these only need to satisfy the schema
// (real values come from `.env` at runtime). Set here so tests pass locally and
// in CI without a `.env` file present.
process.env.DB_USER ??= "test";
process.env.DB_PASSWORD ??= "test";
process.env.DB_HOST ??= "localhost";
process.env.DB_PORT ??= "5432";
process.env.DB_NAME ??= "test";
process.env.COGNITO_USER_POOL_ID ??= "test-pool";
process.env.COGNITO_CLIENT_ID ??= "test-client";
