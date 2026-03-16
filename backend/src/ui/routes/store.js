// src/ui/routes/store.js
const express = require('express');
const { getDatabase, queryAll, queryOne, execute } = require('../../infra/database/db');
const { authMiddleware } = require('../middleware/auth');
const { createTranslator } = require('../../i18n');

const router = express.Router();

// GET /store
router.get('/', authMiddleware, async (req, res) => {
  const translate = await createTranslator(req);
  try {
    const db = await getDatabase();
    const items = queryAll(db, 'SELECT * FROM gamification_store ORDER BY required_level ASC');
    const user = queryOne(db, 'SELECT dotch_coins, level FROM users WHERE id = ?', [req.userId]);
    const unlocked = queryAll(db, 'SELECT store_item_id FROM user_store_unlocks WHERE user_id = ?', [req.userId]);
    const unlockedIds = new Set(unlocked.map(u => u.store_item_id));

    const enriched = items.map(item => ({
      ...item,
      unlocked: unlockedIds.has(item.id),
      can_afford: user.dotch_coins >= item.cost_in_coins,
      meets_level: user.level >= item.required_level
    }));

    res.json({ items: enriched, dotch_coins: user.dotch_coins, level: user.level });
  } catch (err) {
    res.status(500).json({ error: await translate('store.internalError') });
  }
});

// POST /store/unlock
router.post('/unlock', authMiddleware, async (req, res) => {
  const translate = await createTranslator(req);
  try {
    const db = await getDatabase();
    const { store_item_id } = req.body;
    if (!store_item_id) return res.status(400).json({ error: await translate('store.itemRequired') });

    const item = queryOne(db, 'SELECT * FROM gamification_store WHERE id = ?', [store_item_id]);
    if (!item) return res.status(404).json({ error: await translate('store.itemNotFound') });

    const user = queryOne(db, 'SELECT dotch_coins, level FROM users WHERE id = ?', [req.userId]);

    const alreadyOwned = queryOne(db,
      'SELECT id FROM user_store_unlocks WHERE user_id=? AND store_item_id=?',
      [req.userId, store_item_id]
    );
    if (alreadyOwned) return res.status(409).json({ error: await translate('store.itemAlreadyOwned') });

    if (user.level < item.required_level) {
      return res.status(403).json({ error: await translate('store.levelRequired', { level: item.required_level }) });
    }
    if (user.dotch_coins < item.cost_in_coins) {
      return res.status(403).json({ error: await translate('store.insufficientCoins') });
    }

    execute(db, 'UPDATE users SET dotch_coins = dotch_coins - ? WHERE id = ?', [item.cost_in_coins, req.userId]);
    execute(db, 'INSERT INTO user_store_unlocks (user_id, store_item_id) VALUES (?, ?)', [req.userId, store_item_id]);

    const updatedUser = queryOne(db, 'SELECT dotch_coins, level FROM users WHERE id = ?', [req.userId]);

    res.json({
      success: true,
      item_unlocked: item.item_name,
      coins_spent: item.cost_in_coins,
      dotch_coins_remaining: updatedUser.dotch_coins
    });
  } catch (err) {
    res.status(500).json({ error: await translate('store.internalError') });
  }
});

module.exports = router;
