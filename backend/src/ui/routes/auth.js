// src/ui/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDatabase, queryOne, execute } = require('../../infra/database/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dotchflow_secret';

// POST /auth/register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter ao menos 6 caracteres'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const db = await getDatabase();
      const { email, password } = req.body;

      const existing = queryOne(db, 'SELECT id FROM users WHERE email = ?', [email]);
      if (existing) return res.status(409).json({ error: 'Email já cadastrado' });

      const password_hash = await bcrypt.hash(password, 10);
      const { lastInsertRowId } = execute(db, 
        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
        [email, password_hash]
      );

      // Seed default categories for new user
      const defaultCategories = [
        { name: 'Alimentação', icon: '🍔', limit: 0 },
        { name: 'Transporte', icon: '🚗', limit: 0 },
        { name: 'Moradia', icon: '🏠', limit: 0 },
        { name: 'Saúde', icon: '💊', limit: 0 },
        { name: 'Lazer', icon: '🎮', limit: 0 },
        { name: 'Educação', icon: '📚', limit: 0 },
      ];
      for (const cat of defaultCategories) {
        execute(db, 'INSERT INTO categories (user_id, name, icon, monthly_limit) VALUES (?, ?, ?, ?)',
          [lastInsertRowId, cat.name, cat.icon, cat.limit]);
      }

      const token = jwt.sign({ userId: lastInsertRowId }, JWT_SECRET, { expiresIn: '7d' });
      const user = queryOne(db, 'SELECT id, email, xp_points, dotch_coins, level, streak_count FROM users WHERE id = ?', [lastInsertRowId]);

      res.status(201).json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro interno' });
    }
  }
);

// POST /auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha obrigatória'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const db = await getDatabase();
      const { email, password } = req.body;

      const user = queryOne(db, 'SELECT * FROM users WHERE email = ?', [email]);
      if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      const { password_hash, ...safeUser } = user;

      res.json({ token, user: safeUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro interno' });
    }
  }
);

// GET /auth/me
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const db = await getDatabase();
    const user = queryOne(db, 
      'SELECT id, email, xp_points, dotch_coins, level, streak_count, last_checkin, created_at FROM users WHERE id = ?', 
      [req.userId]
    );
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
