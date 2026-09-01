// jest.setup.js
// Runs before the test suite. auth.js and middleware/auth.js now require
// JWT_SECRET to be set (fail-fast instead of a hardcoded fallback secret) -
// tests need *a* value, it just doesn't need to be real since routes are
// exercised through mocked DB/supertest, not a live deploy.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_for_jest_only';
