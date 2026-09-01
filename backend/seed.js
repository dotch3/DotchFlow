// seed.js - Creates a test user with sample data in Postgres.
// Usage:
//   npm run seed     - Run seed (fails if the test user already exists)
//   npm run dev-seed - Reset the app data + seed in one command

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDatabase, queryOne, queryAll, execute } = require('./src/infra/database/db');

const TEST_USER = {
  email: 'test@dotchflow.com',
  password: 'myPassword123',
};

async function seed() {
  console.log('🔄 Starting seed...\n');

  const db = await getDatabase();

  const existingUser = await queryOne(db, 'SELECT id FROM users WHERE email = ?', [TEST_USER.email]);
  if (existingUser) {
    console.log(`⚠️  User "${TEST_USER.email}" already exists — wiping their data before reseeding.`);
    const uid = existingUser.id;
    await execute(db, 'DELETE FROM user_store_unlocks WHERE user_id = ?', [uid]);
    await execute(db, 'DELETE FROM transactions WHERE user_id = ?', [uid]);
    await execute(db, 'DELETE FROM goals WHERE user_id = ?', [uid]);
    await execute(db, 'DELETE FROM categories WHERE user_id = ?', [uid]);
    await execute(db, 'DELETE FROM users WHERE id = ?', [uid]);
  }

  const password_hash = await bcrypt.hash(TEST_USER.password, 10);

  const { lastInsertRowId: userId } = await execute(db,
    'INSERT INTO users (email, password_hash, language, xp_points, dotch_coins, level, streak_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [TEST_USER.email, password_hash, 'en', 1250, 250, 3, 5]
  );
  console.log(`✅ User created: ID=${userId}, Email=${TEST_USER.email}, Password=${TEST_USER.password}`);

  const categories = [
    { name: 'Food', icon: '🍔', limit: 800 },
    { name: 'Transport', icon: '🚗', limit: 300 },
    { name: 'Housing', icon: '🏠', limit: 1500 },
    { name: 'Health', icon: '💊', limit: 200 },
    { name: 'Entertainment', icon: '🎮', limit: 400 },
    { name: 'Education', icon: '📚', limit: 250 },
    { name: 'Salary', icon: '💰', limit: 0 },
    { name: 'Freelance', icon: '💻', limit: 0 },
    { name: 'Investments', icon: '📈', limit: 0 },
  ];

  const catMap = {};
  for (const cat of categories) {
    const { lastInsertRowId: catId } = await execute(db,
      'INSERT INTO categories (user_id, name, icon, monthly_limit) VALUES (?, ?, ?, ?)',
      [userId, cat.name, cat.icon, cat.limit]
    );
    catMap[cat.name] = catId;
  }
  console.log(`✅ ${categories.length} categories created`);

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

  const today = new Date();
  for (const t of transactions) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0];

    await execute(db,
      'INSERT INTO transactions (user_id, amount, description, category_id, date, type, is_quick_entry, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, t.amount, t.description, catMap[t.category], dateStr, t.type, 0, 0]
    );
  }
  console.log(`✅ ${transactions.length} transactions created`);

  const goals = [
    { name: 'Trip to Fernando de Noronha', target: 5000, current: 2300, deadline: '2026-12-31' },
    { name: 'New Laptop', target: 6000, current: 1500, deadline: '2026-09-30' },
    { name: 'Emergency Fund', target: 10000, current: 4500, deadline: '2027-06-30' },
  ];
  for (const g of goals) {
    await execute(db,
      'INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, g.name, g.target, g.current, g.deadline, 'in_progress']
    );
  }
  console.log(`✅ ${goals.length} goals created`);

  const unlocks = [
    { item: 'Dark Theme Premium', level: 1 },
    { item: 'Smart Notifications', level: 5 },
  ];
  const storeItems = await queryAll(db, 'SELECT id, item_name FROM gamification_store');
  const itemMap = {};
  for (const row of storeItems) itemMap[row.item_name] = row.id;

  for (const u of unlocks) {
    const itemId = itemMap[u.item];
    if (itemId) {
      await execute(db, 'INSERT INTO user_store_unlocks (user_id, store_item_id) VALUES (?, ?)', [userId, itemId]);
      console.log(`🔓 Unlocked: ${u.item}`);
    }
  }

  console.log('\n========== SEED COMPLETE ==========');
  console.log(`📧 Email: ${TEST_USER.email}`);
  console.log(`🔑 Password: ${TEST_USER.password}`);
  console.log(`🪙 Dotch Coins: 250`);
  console.log(`⭐ Level: 3`);
  console.log(`🔥 Streak: 5 days`);
  console.log('=====================================');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
