// src/ui/routes/goals.js
const express = require('express');
const { getDatabase, queryAll, queryOne, execute } = require('../../infra/database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /goals
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDatabase();
    const goals = queryAll(db, 'SELECT * FROM goals WHERE user_id = ? ORDER BY deadline ASC', [req.userId]);

    const enriched = goals.map(goal => {
      const remaining = goal.target_amount - goal.current_amount;
      const progress = goal.target_amount > 0
        ? Math.round((goal.current_amount / goal.target_amount) * 100)
        : 0;

      let monthly_needed = null;
      if (goal.deadline && remaining > 0) {
        const now = new Date();
        const deadline = new Date(goal.deadline);
        const monthsLeft = Math.max(1,
          (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth())
        );
        monthly_needed = Math.ceil(remaining / monthsLeft);
      }

      return { ...goal, remaining, progress_percent: progress, monthly_needed };
    });

    res.json({ goals: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /goals
router.post('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDatabase();
    const { name, target_amount, deadline } = req.body;
    if (!name || !target_amount) return res.status(400).json({ error: 'Nome e valor alvo são obrigatórios' });

    const { lastInsertRowId } = execute(db,
      'INSERT INTO goals (user_id, name, target_amount, deadline) VALUES (?, ?, ?, ?)',
      [req.userId, name, target_amount, deadline || null]
    );
    const goal = queryOne(db, 'SELECT * FROM goals WHERE id = ?', [lastInsertRowId]);
    res.status(201).json({ goal });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /goals/:id/deposit
router.post('/:id/deposit', authMiddleware, async (req, res) => {
  try {
    const db = await getDatabase();
    const goal = queryOne(db, 'SELECT * FROM goals WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    if (!goal) return res.status(404).json({ error: 'Objetivo não encontrado' });

    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valor inválido' });

    const newAmount = goal.current_amount + amount;
    const status = newAmount >= goal.target_amount ? 'concluido' : 'em_andamento';

    execute(db,
      'UPDATE goals SET current_amount=?, status=? WHERE id=?',
      [Math.min(newAmount, goal.target_amount), status, goal.id]
    );

    // Award XP if completed
    let xp_gained = 0;
    if (status === 'concluido') {
      xp_gained = 200;
      execute(db, 'UPDATE users SET xp_points = xp_points + 200 WHERE id = ?', [req.userId]);
    }

    const updated = queryOne(db, 'SELECT * FROM goals WHERE id = ?', [goal.id]);
    res.json({ goal: updated, xp_gained, completed: status === 'concluido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /goals/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDatabase();
    const goal = queryOne(db, 'SELECT id FROM goals WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    if (!goal) return res.status(404).json({ error: 'Objetivo não encontrado' });
    execute(db, 'DELETE FROM goals WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
