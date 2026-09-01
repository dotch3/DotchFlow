// src/infra/database/db.js
// PostgreSQL (Neon-compatible) database layer.
//
// Keeps the same call signature the routes already use
// (getDatabase, queryAll, queryOne, execute, getMetadata, setMetadata)
// so route files only needed `await` added in front of each call —
// no SQL rewriting there. `?` placeholders are translated to
// Postgres's `$1, $2, ...` automatically.

const { Pool, types } = require('pg');

// COUNT(*) and similar aggregates come back as PostgreSQL BIGINT (OID 20),
// which node-postgres returns as a string by default to avoid precision
// loss above 2^53. This app never deals with numbers that large, and the
// routes compare/serialize these as plain numbers, so parse them as ints.
types.setTypeParser(20, (val) => parseInt(val, 10));
require('dotenv').config();
const debug = require('debug')('dotchflow:db');

let pool = null;
let _lastInsertId = null;

function buildPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Add it to your .env (see .env.example).');
  }

  // Neon (and most managed Postgres hosts) require SSL. Allow opting out
  // for a local/self-hosted Postgres via DATABASE_SSL=false.
  const useSSL = process.env.DATABASE_SSL !== 'false';

  return new Pool({
    connectionString,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DATABASE_POOL_MAX) || 5,
  });
}

async function getDatabase() {
  if (pool) return pool;

  debug('📂 Initializing Postgres pool...');
  pool = buildPool();

  // Fail fast with a clear error if the connection string is wrong.
  await pool.query('SELECT 1');

  await migrate(pool);

  debug('✅ Database initialized');
  return pool;
}

// Convert '?' placeholders (SQLite style, used throughout the routes)
// into Postgres's positional '$1, $2, ...' style.
function toPgQuery(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// INSERT statements written by the routes expect execute() to return
// lastInsertRowId. Postgres doesn't have last_insert_rowid()/lastID,
// so we append RETURNING id to plain INSERTs that don't already have one.
function withReturningId(sql) {
  const trimmed = sql.trim();
  const isInsert = /^insert\s+into/i.test(trimmed);
  const hasReturning = /returning/i.test(trimmed);
  if (isInsert && !hasReturning) {
    return trimmed.replace(/;\s*$/, '') + ' RETURNING id';
  }
  return sql;
}

async function queryAll(db, sql, params = []) {
  // Legacy shim: some call sites ask for the id from the previous
  // execute() via a fake sqlite query instead of destructuring
  // lastInsertRowId directly.
  if (sql.trim().toLowerCase() === 'select last_insert_rowid() as id') {
    return _lastInsertId != null ? [{ id: _lastInsertId }] : [];
  }

  const pgSql = toPgQuery(sql);
  debug(`📋 QUERY: ${pgSql.substring(0, 100)}${pgSql.length > 100 ? '...' : ''}`);
  if (params.length > 0) debug(`   Params: ${JSON.stringify(params)}`);
  const result = await db.query(pgSql, params);
  debug(`   → ${result.rows.length} rows returned`);
  return result.rows;
}

async function queryOne(db, sql, params = []) {
  const rows = await queryAll(db, sql, params);
  return rows[0] || null;
}

// Execute insert/update/delete, return { lastInsertRowId, changes }
async function execute(db, sql, params = []) {
  const pgSql = toPgQuery(withReturningId(sql));
  debug(`⚡ EXECUTE: ${pgSql.substring(0, 100)}${pgSql.length > 100 ? '...' : ''}`);
  if (params.length > 0) debug(`   Params: ${JSON.stringify(params)}`);

  const result = await db.query(pgSql, params);

  const lastInsertRowId = result.rows[0]?.id ?? null;
  if (lastInsertRowId != null) _lastInsertId = lastInsertRowId;

  const out = { lastInsertRowId, changes: result.rowCount };
  debug(`   → lastId: ${out.lastInsertRowId}, changes: ${out.changes}`);
  return out;
}

// Helper: get metadata value
async function getMetadata(db, key) {
  const row = await queryOne(db, 'SELECT value FROM metadata WHERE key = ?', [key]);
  return row?.value || null;
}

// Helper: set metadata value (upsert)
async function setMetadata(db, key, value) {
  await db.query(
    `INSERT INTO metadata (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value]
  );
}

async function migrate(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      language TEXT DEFAULT 'en',
      xp_points INTEGER DEFAULT 0,
      dotch_coins INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak_count INTEGER DEFAULT 0,
      last_checkin TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Safe no-op if the column already exists.
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en'`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      icon TEXT DEFAULT '📁',
      monthly_limit REAL DEFAULT 0
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      description TEXT DEFAULT '',
      category_id INTEGER REFERENCES categories(id),
      date TEXT DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'),
      type TEXT CHECK (type IN ('income','expense')) DEFAULT 'expense',
      is_quick_entry INTEGER DEFAULT 0,
      is_recurring INTEGER DEFAULT 0
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline TEXT,
      status TEXT DEFAULT 'in_progress'
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS gamification_store (
      id SERIAL PRIMARY KEY,
      item_name TEXT NOT NULL,
      description TEXT,
      cost_in_coins INTEGER NOT NULL,
      required_level INTEGER DEFAULT 1,
      is_premium INTEGER DEFAULT 0,
      icon TEXT DEFAULT '🎁',
      translation_key TEXT
    );
  `);

  // Safe no-op if the column already exists (pre-i18n databases).
  await db.query(`ALTER TABLE gamification_store ADD COLUMN IF NOT EXISTS translation_key TEXT`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_store_unlocks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      store_item_id INTEGER NOT NULL REFERENCES gamification_store(id),
      unlocked_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const storeCount = await db.query('SELECT COUNT(*) AS c FROM gamification_store');
  if (parseInt(storeCount.rows[0].c) === 0) {
    await seedStoreCatalog(db);
  }
}

// System catalog data (not user data) - shared by migrate() (first boot)
// and reset-db.js (after a TRUNCATE), so there's exactly one place that
// defines what's for sale. item_name/description are the canonical
// (English) fallback - store.js translates them per-request using
// translation_key against src/i18n/locales/*.json's "store_items" section.
async function seedStoreCatalog(db) {
  await db.query(`INSERT INTO gamification_store (item_name, description, cost_in_coins, required_level, is_premium, icon, translation_key) VALUES
    ('Dark Theme Premium', 'Exclusive dark theme for the app', 100, 1, 0, '🌙', 'dark_theme'),
    ('Sunset Theme', 'Warm and vibrant colors', 150, 3, 0, '🌅', 'sunset_theme'),
    ('Smart Notifications', 'Personalized spending alerts', 200, 5, 0, '🔔', 'smart_notifications'),
    ('Golden Avatar', 'Exclusive gold-tier avatar', 300, 7, 1, '👑', 'golden_avatar'),
    ('Multi-Wallet Mode', 'Manage multiple accounts', 500, 10, 1, '💼', 'multi_wallet'),
    ('Annual PDF Report', 'Full export as PDF', 250, 5, 0, '📊', 'annual_report')
  `);
}

module.exports = { getDatabase, queryAll, queryOne, execute, getMetadata, setMetadata, seedStoreCatalog };
