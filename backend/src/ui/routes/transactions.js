// src/ui/routes/transactions.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase, queryAll, queryOne, execute } = require('../../infra/database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// XP reward for transactions
const XP_PER_TRANSACTION = 10;

// GET /transactions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDatabase();
    const { category_id, type, start_date, end_date, search, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT t.*, c.name as category_name, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [req.userId];

    if (category_id) { sql += ' AND t.category_id = ?'; params.push(category_id); }
    if (type) { sql += ' AND t.type = ?'; params.push(type); }
    if (start_date) { sql += ' AND t.date >= ?'; params.push(start_date); }
    if (end_date) { sql += ' AND t.date <= ?'; params.push(end_date); }
    if (search) { sql += ' AND (t.description LIKE ?)'; params.push(`%${search}%`); }

    sql += ' ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const transactions = queryAll(db, sql, params);

    // Count totals
    const summary = queryAll(db,
      'SELECT type, SUM(amount) as total FROM transactions WHERE user_id = ? GROUP BY type',
      [req.userId]
    );
    const totals = { income: 0, expense: 0 };
    for (const s of summary) totals[s.type] = s.total;

    res.json({ transactions, totals, balance: totals.income - totals.expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /transactions
router.post('/',
  authMiddleware,
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Valor deve ser positivo'),
    body('type').isIn(['income', 'expense']).withMessage('Tipo inválido'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const db = await getDatabase();
      const {
        amount, description = '', category_id = null,
        date = new Date().toISOString().split('T')[0],
        type = 'expense', is_quick_entry = false, is_recurring = false
      } = req.body;

      const { lastInsertRowId } = execute(db,
        'INSERT INTO transactions (user_id, amount, description, category_id, date, type, is_quick_entry, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [req.userId, amount, description, category_id, date, type, is_quick_entry ? 1 : 0, is_recurring ? 1 : 0]
      );

      // Award XP for logging
      execute(db, 'UPDATE users SET xp_points = xp_points + ? WHERE id = ?', [XP_PER_TRANSACTION, req.userId]);

      const tx = queryOne(db,
        'SELECT t.*, c.name as category_name, c.icon as category_icon FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = ?',
        [lastInsertRowId]
      );

      res.status(201).json({ transaction: tx, xp_gained: XP_PER_TRANSACTION });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro interno' });
    }
  }
);

// PUT /transactions/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDatabase();
    const tx = queryOne(db, 'SELECT * FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!tx) return res.status(404).json({ error: 'Transação não encontrada' });

    const { amount, description, category_id, date, type, is_recurring } = req.body;
    execute(db,
      'UPDATE transactions SET amount=COALESCE(?,amount), description=COALESCE(?,description), category_id=COALESCE(?,category_id), date=COALESCE(?,date), type=COALESCE(?,type), is_recurring=COALESCE(?,is_recurring) WHERE id = ?',
      [amount, description, category_id, date, type, is_recurring !== undefined ? (is_recurring ? 1 : 0) : null, req.params.id]
    );

    const updated = queryOne(db,
      'SELECT t.*, c.name as category_name, c.icon as category_icon FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = ?',
      [req.params.id]
    );
    res.json({ transaction: updated });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /transactions/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDatabase();
    const tx = queryOne(db, 'SELECT id FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!tx) return res.status(404).json({ error: 'Transação não encontrada' });
    execute(db, 'DELETE FROM transactions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
