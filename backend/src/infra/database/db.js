// src/infra/database/db.js
// sql.js wrapper with file persistence

const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

let db = null;
let SQL = null;

const DB_PATH = process.env.DB_PATH || './data/dotchflow.db';

async function getDatabase() {
  if (db) return db;

  // Lazy-load sql.js
  const initSqlJs = require('sql.js');
  SQL = await initSqlJs();

  const dbDir = path.dirname(DB_PATH);
  await fs.ensureDir(dbDir);

  // Load existing DB from file or create new
  if (await fs.pathExists(DB_PATH)) {
    const fileBuffer = await fs.readFile(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Run migrations
  await migrate(db);

  // Persist every 5 seconds
  setInterval(() => persistDatabase(), 5000);

  return db;
}

function persistDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.outputFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('DB persist error:', err.message);
  }
}

function migrate(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      language TEXT DEFAULT 'en',
      xp_points INTEGER DEFAULT 0,
      dotch_coins INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak_count INTEGER DEFAULT 0,
      last_checkin TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Add language column if it doesn't exist (for existing databases)
  try {
    db.run(`ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en'`);
  } catch (e) {
    // Column already exists, ignore
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '📁',
      monthly_limit REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT DEFAULT '',
      category_id INTEGER,
      date TEXT DEFAULT (date('now')),
      type TEXT CHECK(type IN ('income','expense')) DEFAULT 'expense',
      is_quick_entry INTEGER DEFAULT 0,
      is_recurring INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline TEXT,
      status TEXT DEFAULT 'em_andamento',
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS gamification_store (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      description TEXT,
      cost_in_coins INTEGER NOT NULL,
      required_level INTEGER DEFAULT 1,
      is_premium INTEGER DEFAULT 0,
      icon TEXT DEFAULT '🎁'
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_store_unlocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      store_item_id INTEGER NOT NULL,
      unlocked_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (store_item_id) REFERENCES gamification_store(id)
    );
  `);

  // Metadata table for app settings and tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed store items if empty
  const storeCount = db.exec('SELECT COUNT(*) as c FROM gamification_store')[0];
  if (storeCount && storeCount.values[0][0] === 0) {
    db.run(`INSERT INTO gamification_store (item_name, description, cost_in_coins, required_level, is_premium, icon) VALUES
      ('Tema Dark Premium', 'Tema escuro exclusivo para o app', 100, 1, 0, '🌙'),
      ('Tema Sunset', 'Cores quentes e vibrantes', 150, 3, 0, '🌅'),
      ('Notificações Inteligentes', 'Alertas personalizados de gastos', 200, 5, 0, '🔔'),
      ('Avatar Dourado', 'Avatar exclusivo nível ouro', 300, 7, 1, '👑'),
      ('Modo Multi-Carteira', 'Gerencie múltiplas contas', 500, 10, 1, '💼'),
      ('Relatório Anual PDF', 'Export completo em PDF', 250, 5, 0, '📊');
    `);
  }
}

// Helper: execute a query and return all rows as objects
function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: execute a query and return one row as object
function queryOne(db, sql, params = []) {
  const rows = queryAll(db, sql, params);
  return rows[0] || null;
}

// Helper: execute insert/update/delete, return lastInsertRowId or changes
function execute(db, sql, params = []) {
  db.run(sql, params);
  return {
    lastInsertRowId: db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0],
    changes: db.exec('SELECT changes() as c')[0]?.values[0][0]
  };
}

// Helper: get metadata value
function getMetadata(db, key) {
  const row = queryOne(db, 'SELECT value FROM metadata WHERE key = ?', [key]);
  return row?.value || null;
}

// Helper: set metadata value
function setMetadata(db, key, value) {
  db.run(
    'INSERT OR REPLACE INTO metadata (key, value, updated_at) VALUES (?, ?, datetime("now"))',
    [key, value]
  );
}

module.exports = { getDatabase, persistDatabase, queryAll, queryOne, execute, getMetadata, setMetadata };
