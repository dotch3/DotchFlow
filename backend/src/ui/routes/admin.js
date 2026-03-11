// src/ui/routes/admin.js
const express = require('express');
const { getDatabase, queryOne, execute, getMetadata, setMetadata } = require('../../infra/database/db');

const router = express.Router();

const CLEANUP_INTERVAL_DAYS = parseInt(process.env.CLEANUP_INTERVAL_DAYS) || 30;

// POST /admin/cleanup - Trigger database cleanup
router.post('/cleanup', async (req, res) => {
  try {
    const db = await getDatabase();
    
    // Get last cleanup date
    const lastCleanup = getMetadata(db, 'last_cleanup');
    
    // Calculate cleanup threshold (transactions older than CLEANUP_INTERVAL_DAYS)
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - CLEANUP_INTERVAL_DAYS);
    const thresholdStr = thresholdDate.toISOString().split('T')[0];
    
    // Delete old transactions (keep recent ones based on interval)
    const deleteResult = execute(db, 
      "DELETE FROM transactions WHERE date < ? AND id NOT IN (SELECT id FROM transactions ORDER BY date DESC LIMIT 100)",
      [thresholdStr]
    );
    
    // Also cleanup orphaned records
    const categoriesDeleted = execute(db, 
      "DELETE FROM categories WHERE user_id NOT IN (SELECT id FROM users)"
    );
    
    const goalsDeleted = execute(db,
      "DELETE FROM goals WHERE user_id NOT IN (SELECT id FROM users)"
    );
    
    const unlocksDeleted = execute(db,
      "DELETE FROM user_store_unlocks WHERE user_id NOT IN (SELECT id FROM users)"
    );
    
    // Update last cleanup metadata
    const now = new Date().toISOString();
    setMetadata(db, 'last_cleanup', now);
    
    // Persist changes
    const { persistDatabase } = require('../../infra/database/db');
    persistDatabase();
    
    res.json({
      success: true,
      message: 'Cleanup completed',
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
    res.status(500).json({ error: 'Erro ao fazer cleanup' });
  }
});

// GET /admin/status - Get database status and cleanup info
router.get('/status', async (req, res) => {
  try {
    const db = await getDatabase();
    
    const userCount = queryOne(db, 'SELECT COUNT(*) as count FROM users');
    const transactionCount = queryOne(db, 'SELECT COUNT(*) as count FROM transactions');
    const categoryCount = queryOne(db, 'SELECT COUNT(*) as count FROM categories');
    const goalCount = queryOne(db, 'SELECT COUNT(*) as count FROM goals');
    
    const lastCleanup = getMetadata(db, 'last_cleanup');
    const lastCleanupDate = lastCleanup ? new Date(lastCleanup) : null;
    
    // Calculate next cleanup
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
        goals: goalCount?.count || 0
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
    res.status(500).json({ error: 'Erro ao buscar status' });
  }
});

module.exports = router;
