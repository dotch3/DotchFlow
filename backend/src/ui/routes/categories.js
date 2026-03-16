// src/ui/routes/categories.js
const express = require('express');
const { getDatabase, queryAll, queryOne, execute } = require('../../infra/database/db');
const { authMiddleware } = require('../middleware/auth');
const { createTranslator } = require('../../i18n');

const router = express.Router();

// GET /categories
router.get('/', authMiddleware, async (req, res) => {
  const translate = await createTranslator(req);
  try {
    const db = await getDatabase();
    const categories = queryAll(db, 'SELECT * FROM categories WHERE user_id = ?', [req.userId]);

    // Calculate monthly usage for current month
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const start = `${y}-${m}-01`;
    const end = `${y}-${m}-31`;

    const enriched = categories.map(cat => {
      const usage = queryOne(db,
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id=? AND category_id=? AND type=\'expense\' AND date BETWEEN ? AND ?',
        [req.userId, cat.id, start, end]
      );
      const spent = usage?.total || 0;
      const pct = cat.monthly_limit > 0 ? Math.round((spent / cat.monthly_limit) * 100) : 0;
      return { ...cat, monthly_spent: spent, usage_percent: pct };
    });

    res.json({ categories: enriched });
  } catch (err) {
    res.status(500).json({ error: await translate('categories.internalError') });
  }
});

// POST /categories
router.post('/', authMiddleware, async (req, res) => {
  const translate = await createTranslator(req);
  try {
    const db = await getDatabase();
    const { name, icon = '📁', monthly_limit = 0 } = req.body;
    if (!name) return res.status(400).json({ error: await translate('categories.nameRequired') });

    const { lastInsertRowId } = execute(db,
      'INSERT INTO categories (user_id, name, icon, monthly_limit) VALUES (?, ?, ?, ?)',
      [req.userId, name, icon, monthly_limit]
    );
    const cat = queryOne(db, 'SELECT * FROM categories WHERE id = ?', [lastInsertRowId]);
    res.status(201).json({ category: cat });
  } catch (err) {
    res.status(500).json({ error: await translate('categories.internalError') });
  }
});

// PUT /categories/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const translate = await createTranslator(req);
  try {
    const db = await getDatabase();
    const cat = queryOne(db, 'SELECT * FROM categories WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    if (!cat) return res.status(404).json({ error: await translate('categories.notFound') });
    const { name, icon, monthly_limit } = req.body;
    execute(db,
      'UPDATE categories SET name=COALESCE(?,name), icon=COALESCE(?,icon), monthly_limit=COALESCE(?,monthly_limit) WHERE id=?',
      [name, icon, monthly_limit, req.params.id]
    );
    const updated = queryOne(db, 'SELECT * FROM categories WHERE id = ?', [req.params.id]);
    res.json({ category: updated });
  } catch (err) {
    res.status(500).json({ error: await translate('categories.internalError') });
  }
});

// DELETE /categories/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const translate = await createTranslator(req);
  try {
    const db = await getDatabase();
    const cat = queryOne(db, 'SELECT id FROM categories WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    if (!cat) return res.status(404).json({ error: await translate('categories.notFound') });
    execute(db, 'DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: await translate('categories.internalError') });
  }
});

module.exports = router;
