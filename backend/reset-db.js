// reset-db.js — wipes all data (keeps schema) from whatever database
// DATABASE_URL points at. Same script for local Postgres or Neon: it only
// depends on the env var, never on which Postgres it happens to be, so
// there's no separate "local version" / "Neon version" of this command.
//
// Usage:
//   npm run db:reset              (uses DATABASE_URL from .env)
//   DATABASE_URL=<neon-url> npm run db:reset   (target Neon directly)

require('dotenv').config();
const { getDatabase, seedStoreCatalog } = require('./src/infra/database/db');

async function reset() {
  console.log('🧹 Resetting DotchFlow data...');
  const db = await getDatabase(); // also runs migrate(), so tables exist even on a brand-new database

  await db.query(`
    TRUNCATE user_store_unlocks, transactions, goals, categories, users, gamification_store, metadata
    RESTART IDENTITY CASCADE
  `);

  // gamification_store is system catalog data (not user data) - migrate()
  // only seeds it when empty, so re-seed it right away instead of leaving
  // the store empty until the next server restart.
  await seedStoreCatalog(db);

  console.log('✅ All tables truncated and store catalog re-seeded. Schema untouched.');
  process.exit(0);
}

reset().catch(err => {
  console.error('❌ Reset failed:', err.message);
  process.exit(1);
});
