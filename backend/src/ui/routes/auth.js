// src/ui/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDatabase, queryOne, execute } = require('../../infra/database/db');
const { t, createTranslator } = require('../../i18n');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dotchflow_secret';
const MAX_USERS = parseInt(process.env.MAX_USERS) || 50;

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

    const translate = await createTranslator(req);

    try {
      const db = await getDatabase();
      const { email, password } = req.body;

      // Check user limit
      const userCount = queryOne(db, 'SELECT COUNT(*) as count FROM users');
      if (userCount && userCount.count >= MAX_USERS) {
        return res.status(403).json({ error: 'MAX_USERS_REACHED' });
      }

      const existing = queryOne(db, 'SELECT id FROM users WHERE email = ?', [email]);
      if (existing) return res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS' });

      const password_hash = await bcrypt.hash(password, 10);
      const { lastInsertRowId } = execute(db, 
        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
        [email, password_hash]
      );

      // Seed default categories for new user
      const defaultCategories = [
        { name: 'Food', icon: '🍔', limit: 0 },
        { name: 'Transport', icon: '🚗', limit: 0 },
        { name: 'Housing', icon: '🏠', limit: 0 },
        { name: 'Health', icon: '💊', limit: 0 },
        { name: 'Entertainment', icon: '🎮', limit: 0 },
        { name: 'Education', icon: '📚', limit: 0 },
      ];
      for (const cat of defaultCategories) {
        execute(db, 'INSERT INTO categories (user_id, name, icon, monthly_limit) VALUES (?, ?, ?, ?)',
          [lastInsertRowId, cat.name, cat.icon, cat.limit]);
      }

      const token = jwt.sign({ userId: lastInsertRowId }, JWT_SECRET, { expiresIn: '7d' });
      const user = queryOne(db, 'SELECT id, email, language, xp_points, dotch_coins, level, streak_count FROM users WHERE id = ?', [lastInsertRowId]);

      res.status(201).json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'INTERNAL_ERROR' });
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

    const translate = await createTranslator(req);

    try {
      const db = await getDatabase();
      const { email, password } = req.body;

      const user = queryOne(db, 'SELECT * FROM users WHERE email = ?', [email]);
      if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      const { password_hash, ...safeUser } = user;

      res.json({ token, user: safeUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  }
);

// GET /auth/me
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  const translate = await createTranslator(req);
  try {
    const db = await getDatabase();
    const user = queryOne(db, 
      'SELECT id, email, language, xp_points, dotch_coins, level, streak_count, last_checkin, created_at FROM users WHERE id = ?', 
      [req.userId]
    );
    if (!user) return res.status(404).json({ error: await translate('errors.userNotFound') });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: await translate('errors.internal') });
  }
});

// PUT /auth/language - Update user language preference
router.put('/language', require('../middleware/auth').authMiddleware, async (req, res) => {
  const translate = await createTranslator(req);
  try {
    const { language } = req.body;
    const validLanguages = ['en', 'es', 'pt-BR'];
    
    if (!language || !validLanguages.includes(language)) {
      return res.status(400).json({ error: await translate('errors.invalidLanguage') });
    }

    const db = await getDatabase();
    execute(db, 'UPDATE users SET language = ? WHERE id = ?', [language, req.userId]);
    
    const user = queryOne(db, 
      'SELECT id, email, language, xp_points, dotch_coins, level, streak_count, last_checkin, created_at FROM users WHERE id = ?', 
      [req.userId]
    );
    
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: await translate('errors.internal') });
  }
});

module.exports = router;
