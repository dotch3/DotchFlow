// seed.js - Script para criar usuário de teste com dados de exemplo
// Usage: 
//   npm run seed     - Run seed (requires existing database)
//   npm run dev-seed - Delete DB + create fresh + seed (one command)

const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs-extra');
const path = require('path');

const DB_PATH = './data/dotchflow.db';
const TEST_USER = {
  email: 'test@dotchflow.com',
  password: 'myPassword123'
};

// Schema definition (same as db.js)
const SCHEMA = `
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
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    monthly_limit REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    category_id INTEGER,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    is_quick_entry INTEGER DEFAULT 0,
    is_recurring INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    deadline TEXT,
    status TEXT DEFAULT 'em_andamento',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS gamification_store (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    cost INTEGER DEFAULT 0,
    required_level INTEGER DEFAULT 1,
    category TEXT
  );
  CREATE TABLE IF NOT EXISTS user_store_unlocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    store_item_id INTEGER NOT NULL,
    unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (store_item_id) REFERENCES gamification_store(id),
    UNIQUE(user_id, store_item_id)
  );
`;

const STORE_ITEMS = [
  { item_name: 'Dark Theme Premium', description: 'Elegant dark theme', icon: '🌙', cost: 100, required_level: 1, category: 'theme' },
  { item_name: 'Sunset Theme', description: 'Sunset colored theme', icon: '🌅', cost: 150, required_level: 3, category: 'theme' },
  { item_name: 'Smart Notifications', description: 'Custom alerts', icon: '🔔', cost: 200, required_level: 5, category: 'feature' },
  { item_name: 'Golden Avatar', description: 'Stand out with style', icon: '👑', cost: 300, required_level: 7, category: 'avatar' },
  { item_name: 'Multi-Wallet Mode', description: 'Manage multiple wallets', icon: '💼', cost: 500, required_level: 10, category: 'feature' },
  { item_name: 'Annual PDF Report', description: 'Export your data', icon: '📊', cost: 250, required_level: 5, category: 'feature' },
];

async function ensureDatabase(SQL) {
  // Ensure data directory exists
  await fs.ensureDir('./data');
  
  let db;
  if (await fs.pathExists(DB_PATH)) {
    const fileBuffer = await fs.readFile(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('📂 Existing database loaded');
  } else {
    db = new SQL.Database();
    console.log('🆕 New database created');
  }
  
  // Run schema
  const statements = SCHEMA.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    if (stmt.trim()) db.run(stmt);
  }
  console.log('✅ Schema initialized');
  
  // Seed store items if empty
  const storeCount = db.exec('SELECT COUNT(*) FROM gamification_store')[0]?.values[0][0] || 0;
  if (storeCount === 0) {
    for (const item of STORE_ITEMS) {
      db.run(
        'INSERT INTO gamification_store (item_name, description, icon, cost, required_level, category) VALUES (?, ?, ?, ?, ?, ?)',
        [item.item_name, item.description, item.icon, item.cost, item.required_level, item.category]
      );
    }
    console.log(`✅ ${STORE_ITEMS.length} store items seeded`);
  }
  
  return db;
}

async function seed() {
  console.log('🔄 Starting seed...\n');

  const SQL = await initSqlJs();
  const db = await ensureDatabase(SQL);

  // Check if user already exists
  const existingUser = db.exec('SELECT id FROM users WHERE email = ?', [TEST_USER.email]);
  if (existingUser.length && existingUser[0].values.length > 0) {
    console.log(`⚠️  User "${TEST_USER.email}" already exists.`);
    console.log('❌ To re-run seed, first delete the database:');
    console.log('   rm -f data/dotchflow.db');
    process.exit(1);
  }

  // Create user with hashed password
  const password_hash = await bcrypt.hash(TEST_USER.password, 10);
  
  db.run(
    'INSERT INTO users (email, password_hash, language, xp_points, dotch_coins, level, streak_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [TEST_USER.email, password_hash, 'en', 500, 250, 3, 5]
  );

  const userId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
  console.log(`✅ User created: ID=${userId}, Email=${TEST_USER.email}, Password=${TEST_USER.password}`);

  // Create default categories
  const categories = [
    { name: 'Food', icon: '🍔', limit: 800 },
    { name: 'Transport', icon: '🚗', limit: 300 },
    { name: 'Housing', icon: '🏠', limit: 1500 },
    { name: 'Health', icon: '💊', limit: 200 },
    { name: 'Entertainment', icon: '🎮', limit: 400 },
    { name: 'Education', icon: '📚', limit: 250 },
    { name: 'Salary', icon: '💰', limit: 0 },
    { name: 'Freelance', icon: '💻', limit: 0 },
    { name: 'Investments', icon: '', limit: 0 },
  ];

  for (const cat of categories) {
    db.run(
      'INSERT INTO categories (user_id, name, icon, monthly_limit) VALUES (?, ?, ?, ?)',
      [userId, cat.name, cat.icon, cat.limit]
    );
  }
  console.log(`✅ ${categories.length} categories created`);

  // Create transactions (last 30 days)
  const transactions = [
    { amount: 450, description: 'Supermarket', category: 'Food', type: 'expense' },
    { amount: 150, description: 'Uber', category: 'Transport', type: 'expense' },
    { amount: 1200, description: 'Rent', category: 'Housing', type: 'expense' },
    { amount: 80, description: 'Pharmacy', category: 'Health', type: 'expense' },
    { amount: 200, description: 'Netflix + Spotify', category: 'Entertainment', type: 'expense' },
    { amount: 120, description: 'Udemy Course', category: 'Education', type: 'expense' },
    { amount: 8500, description: 'Monthly Salary', category: 'Salary', type: 'income' },
    { amount: 320, description: 'Gas', category: 'Transport', type: 'expense' },
    { amount: 95, description: 'Restaurant', category: 'Food', type: 'expense' },
    { amount: 1800, description: 'Internet + Utilities', category: 'Housing', type: 'expense' },
    { amount: 250, description: 'Gym', category: 'Health', type: 'expense' },
    { amount: 60, description: 'Cinema', category: 'Entertainment', type: 'expense' },
    { amount: 1200, description: 'Freelance Project', category: 'Freelance', type: 'income' },
    { amount: 45, description: 'Coffee with friends', category: 'Entertainment', type: 'expense' },
    { amount: 350, description: 'Grocery', category: 'Food', type: 'expense' },
    { amount: 2000, description: 'Stocks - Investment', category: 'Investments', type: 'expense' },
  ];

  const catMap = {};
  const cats = db.exec('SELECT id, name FROM categories WHERE user_id = ?', [userId]);
  if (cats.length) {
    for (const row of cats[0].values) {
      catMap[row[1]] = row[0];
    }
  }

  // Insert transactions with dates spanning last 30 days
  const today = new Date();
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0];

    db.run(
      'INSERT INTO transactions (user_id, amount, description, category_id, date, type, is_quick_entry, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, t.amount, t.description, catMap[t.category], dateStr, t.type, 0, 0]
    );
  }
  console.log(`✅ ${transactions.length} transactions created`);

  // Create goals
  const goals = [
    { name: 'Trip to Fernando de Noronha', target: 5000, current: 2300, deadline: '2026-12-31' },
    { name: 'New Laptop', target: 6000, current: 1500, deadline: '2026-09-30' },
    { name: 'Emergency Fund', target: 10000, current: 4500, deadline: '2027-06-30' },
  ];

  for (const g of goals) {
    db.run(
      'INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, g.name, g.target, g.current, g.deadline, 'em_andamento']
    );
  }
  console.log(`✅ ${goals.length} goals created`);

  // Unlock some store items for the user
  const unlocks = [
    { item: 'Dark Theme Premium', level: 1 },
    { item: 'Smart Notifications', level: 5 },
  ];

  const storeItems = db.exec('SELECT id, item_name FROM gamification_store');
  const itemMap = {};
  if (storeItems.length) {
    for (const row of storeItems[0].values) {
      itemMap[row[1]] = row[0];
    }
  }

  for (const u of unlocks) {
    const itemId = itemMap[u.item];
    if (itemId) {
      db.run(
        'INSERT INTO user_store_unlocks (user_id, store_item_id) VALUES (?, ?)',
        [userId, itemId]
      );
      console.log(`🔓 Unlocked: ${u.item}`);
    }
  }

  // Save database
  const data = db.export();
  await fs.outputFile(DB_PATH, Buffer.from(data));
  console.log('\n💾 Database saved!\n');

  // Summary
  console.log('========== SEED COMPLETE ==========');
  console.log(`📧 Email: ${TEST_USER.email}`);
  console.log(`🔑 Password: ${TEST_USER.password}`);
  console.log(`🪙 Dotch Coins: 250`);
  console.log(`⭐ Level: 3`);
  console.log(`🔥 Streak: 5 days`);
  console.log('=====================================');
}

seed().catch(console.error);
