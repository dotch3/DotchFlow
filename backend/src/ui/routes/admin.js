/**
 * @file admin.js
 * @description Administrative endpoints for database management
 * @module admin
 * 
 * Endpoints:
 * - GET  /admin/status   - Get database statistics and configuration
 * - POST /admin/cleanup - Remove old transactions and orphaned records
 * - POST /admin/reset   - Reset database to initial state (keeps system data)
 * - POST /admin/seed    - Seed test user with sample data
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { authMiddleware } = require('../middleware/auth');
const { getDatabase, queryOne, queryAll, execute, getMetadata, setMetadata } = require('../../infra/database/db');
const { createTranslator } = require('../../i18n');

const router = express.Router();

// Apply authentication to all admin routes
router.use(authMiddleware);

// Configuration
const CLEANUP_INTERVAL_DAYS = parseInt(process.env.CLEANUP_INTERVAL_DAYS) || 30;
const TEST_USER = {
  email: 'test@dotchflow.com',
  password: 'myPassword123'
};

// Store items for seeding
const STORE_ITEMS = [
  { item_name: 'Dark Theme Premium', description: 'Elegant dark theme', icon: '🌙', cost: 100, required_level: 1, category: 'theme' },
  { item_name: 'Sunset Theme', description: 'Sunset colored theme', icon: '🌅', cost: 150, required_level: 3, category: 'theme' },
  { item_name: 'Smart Notifications', description: 'Custom alerts', icon: '🔔', cost: 200, required_level: 5, category: 'feature' },
  { item_name: 'Golden Avatar', description: 'Stand out with style', icon: '👑', cost: 300, required_level: 7, category: 'avatar' },
  { item_name: 'Multi-Wallet Mode', description: 'Manage multiple wallets', icon: '💼', cost: 500, required_level: 10, category: 'feature' },
  { item_name: 'Annual PDF Report', description: 'Export your data', icon: '📊', cost: 250, required_level: 5, category: 'feature' },
];

/**
 * GET /admin/status
 * Returns database statistics and cleanup configuration
 */
router.get('/status', async (req, res) => {
  try {
    const db = await getDatabase();
    const translate = await createTranslator(req);
    
    const userCount = await queryOne(db, 'SELECT COUNT(*) as count FROM users');
    const transactionCount = await queryOne(db, 'SELECT COUNT(*) as count FROM transactions');
    const categoryCount = await queryOne(db, 'SELECT COUNT(*) as count FROM categories');
    const goalCount = await queryOne(db, 'SELECT COUNT(*) as count FROM goals');
    const storeItemCount = await queryOne(db, 'SELECT COUNT(*) as count FROM gamification_store');
    
    const lastCleanup = await getMetadata(db, 'last_cleanup');
    const lastCleanupDate = lastCleanup ? new Date(lastCleanup) : null;
    
    let nextCleanup = null;
    if (lastCleanupDate) {
      nextCleanup = new Date(lastCleanupDate);
      nextCleanup.setDate(nextCleanup.getDate() + CLEANUP_INTERVAL_DAYS);
    }
    
    res.json({
      stats: {
        users: userCount?.count || 0,
        transactions: transactionCount?.count || 0,
        categories: categoryCount?.count || 0,
        goals: goalCount?.count || 0,
        store_items: storeItemCount?.count || 0
      },
      config: {
        max_users: parseInt(process.env.MAX_USERS) || 50,
        cleanup_interval_days: CLEANUP_INTERVAL_DAYS
      },
      cleanup: {
        last_cleanup: lastCleanup,
        next_cleanup: nextCleanup ? nextCleanup.toISOString() : null,
        cleanup_needed: !lastCleanup || (lastCleanupDate && new Date() > nextCleanup)
      }
    });
  } catch (err) {
    console.error('Status error:', err);
    const translate = await createTranslator(req);
    res.status(500).json({ error: await translate('admin.statusError') });
  }
});

/**
 * POST /admin/cleanup
 * Removes transactions older than CLEANUP_INTERVAL_DAYS and orphaned records
 * 
 * Behavior:
 * - Deletes transactions older than configured interval (keeps last 100)
 * - Removes orphaned categories, goals, and store unlocks
 * - Updates last_cleanup metadata
 */
router.post('/cleanup', async (req, res) => {
  try {
    const db = await getDatabase();
    const translate = await createTranslator(req);
    
    const lastCleanup = await getMetadata(db, 'last_cleanup');
    
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - CLEANUP_INTERVAL_DAYS);
    const thresholdStr = thresholdDate.toISOString().split('T')[0];
    
    const deleteResult = await execute(db, 
      "DELETE FROM transactions WHERE date < ? AND id NOT IN (SELECT id FROM transactions ORDER BY date DESC LIMIT 100)",
      [thresholdStr]
    );
    
    const categoriesDeleted = await execute(db, 
      "DELETE FROM categories WHERE user_id NOT IN (SELECT id FROM users)"
    );
    
    const goalsDeleted = await execute(db,
      "DELETE FROM goals WHERE user_id NOT IN (SELECT id FROM users)"
    );
    
    const unlocksDeleted = await execute(db,
      "DELETE FROM user_store_unlocks WHERE user_id NOT IN (SELECT id FROM users)"
    );
    
    const now = new Date().toISOString();
    await setMetadata(db, 'last_cleanup', now);
    
    
    res.json({
      success: true,
      message: await translate('admin.cleanupSuccess'),
      deleted: {
        transactions: deleteResult.changes || 0,
        orphaned_categories: categoriesDeleted.changes || 0,
        orphaned_goals: goalsDeleted.changes || 0,
        orphaned_unlocks: unlocksDeleted.changes || 0
      },
      last_cleanup: now,
      next_cleanup_in_days: CLEANUP_INTERVAL_DAYS
    });
  } catch (err) {
    console.error('Cleanup error:', err);
    const translate = await createTranslator(req);
    res.status(500).json({ error: await translate('admin.cleanupError') });
  }
});

/**
 * POST /admin/reset
 * Resets database to initial state - deletes all user data but keeps system data
 * 
 * Behavior:
 * - Deletes all users (except if keepUsers param is true)
 * - Deletes all user transactions
 * - Deletes all user categories
 * - Deletes all user goals
 * - Deletes all user store unlocks
 * - Keeps gamification_store items
 * - Resets metadata
 */
router.post('/reset', async (req, res) => {
  try {
    const db = await getDatabase();
    const translate = await createTranslator(req);
    
    const keepUsers = req.query.keepUsers === 'true';
    
    if (!keepUsers) {
      await execute(db, 'DELETE FROM user_store_unlocks');
      await execute(db, 'DELETE FROM transactions');
      await execute(db, 'DELETE FROM goals');
      await execute(db, 'DELETE FROM categories');
      await execute(db, 'DELETE FROM users');
    } else {
      const users = await queryAll(db, 'SELECT id FROM users');
      for (const user of users) {
        await execute(db, 'DELETE FROM user_store_unlocks WHERE user_id = ?', [user.id]);
        await execute(db, 'DELETE FROM transactions WHERE user_id = ?', [user.id]);
        await execute(db, 'DELETE FROM goals WHERE user_id = ?', [user.id]);
        await execute(db, 'DELETE FROM categories WHERE user_id = ?', [user.id]);
      }
    }
    
    await setMetadata(db, 'last_cleanup', null);
    
    
    res.json({
      success: true,
      message: await translate('admin.resetSuccess'),
      deleted: {
        users_deleted: keepUsers ? 0 : 'all',
        users_preserved: keepUsers ? 'all' : 0,
        transactions_deleted: true,
        categories_deleted: true,
        goals_deleted: true,
        unlocks_deleted: true
      },
      system_data_preserved: ['gamification_store']
    });
  } catch (err) {
    console.error('Reset error:', err);
    const translate = await createTranslator(req);
    res.status(500).json({ error: await translate('admin.resetError') });
  }
});

/**
 * POST /admin/seed
 * Creates a test user with sample data for development/testing
 * 
 * Creates:
 * - Test user (test@dotchflow.com / myPassword123)
 * - 9 default categories
 * - 16 sample transactions (last 30 days)
 * - 3 sample goals
 * - 2 unlocked store items
 * 
 * Note: Fails if user already exists
 */
router.post('/seed', async (req, res) => {
  try {
    const db = await getDatabase();
    const translate = await createTranslator(req);
    
    const existingUser = await queryOne(db, 'SELECT id FROM users WHERE email = ?', [TEST_USER.email]);
    if (existingUser) {
      return res.status(409).json({ 
        error: await translate('admin.seedUserExists'),
        message: `User ${TEST_USER.email} already exists. Use /admin/reset first.`
      });
    }
    
    const password_hash = await bcrypt.hash(TEST_USER.password, 10);
    
    await execute(db,
      'INSERT INTO users (email, password_hash, language, xp_points, dotch_coins, level, streak_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [TEST_USER.email, password_hash, 'en', 1250, 250, 3, 5]
    );
    
    const userResult = await queryOne(db, 'SELECT last_insert_rowid() as id');
    const userId = userResult?.id;
    
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
    
    const categoryIds = {};
    for (const cat of categories) {
      await execute(db,
        'INSERT INTO categories (user_id, name, icon, monthly_limit) VALUES (?, ?, ?, ?)',
        [userId, cat.name, cat.icon, cat.limit]
      );
      const catResult = await queryOne(db, 'SELECT last_insert_rowid() as id');
      categoryIds[cat.name] = catResult?.id;
    }
    
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
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().split('T')[0];
      
      await execute(db,
        'INSERT INTO transactions (user_id, amount, description, category_id, date, type, is_quick_entry, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, t.amount, t.description, categoryIds[t.category], dateStr, t.type, 0, 0]
      );
    }
    
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
    
    const storeItems = await queryAll(db, 'SELECT id, item_name FROM gamification_store');
    const itemMap = {};
    for (const item of storeItems) {
      itemMap[item.item_name] = item.id;
    }
    
    const unlocks = ['Dark Theme Premium', 'Smart Notifications'];
    for (const itemName of unlocks) {
      const itemId = itemMap[itemName];
      if (itemId) {
        await execute(db,
          'INSERT INTO user_store_unlocks (user_id, store_item_id) VALUES (?, ?)',
          [userId, itemId]
        );
      }
    }
    
    
    res.status(201).json({
      success: true,
      message: await translate('admin.seedSuccess'),
      user: {
        email: TEST_USER.email,
        password: TEST_USER.password,
        xp_points: 1250,
        dotch_coins: 250,
        level: 3,
        streak_count: 5
      },
      seeded: {
        categories: categories.length,
        transactions: transactions.length,
        goals: goals.length,
        unlocks: unlocks.length
      }
    });
  } catch (err) {
    console.error('Seed error:', err);
    const translate = await createTranslator(req);
    res.status(500).json({ error: await translate('admin.seedError') });
  }
});

module.exports = router;
