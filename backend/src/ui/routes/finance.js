// src/ui/routes/finance.js
const express = require('express');
const { getDatabase, queryAll, queryOne } = require('../../infra/database/db');
const { authMiddleware } = require('../middleware/auth');
const { createTranslator } = require('../../i18n');

const router = express.Router();

// 50-15-35 rule categories (keywords to classify by category name)
// Supports both Portuguese and English category names
const ESSENTIAL_KEYWORDS = ['moradia', 'alimentação', 'saúde', 'transporte', 'housing', 'food', 'health', 'transport'];
const PRIORITY_KEYWORDS = ['educação', 'investimento', 'poupança', 'seguro', 'education', 'investment', 'savings', 'insurance'];
// rest = lifestyle / estilo de vida

function classify(categoryName) {
  const lower = (categoryName || '').toLowerCase();
  for (const kw of ESSENTIAL_KEYWORDS) if (lower.includes(kw)) return 'essential';
  for (const kw of PRIORITY_KEYWORDS) if (lower.includes(kw)) return 'priority';
  return 'lifestyle';
}

// GET /finance/health
router.get('/health', authMiddleware, async (req, res) => {
  const translate = await createTranslator(req);
  try {
    const db = await getDatabase();
    const { year, month } = req.query;
    const now = new Date();
    const y = year || now.getFullYear();
    const m = String(month || now.getMonth() + 1).padStart(2, '0');
    const startDate = `${y}-${m}-01`;
    const endDate = `${y}-${m}-31`;

    const transactions = await queryAll(db,
      `SELECT t.amount, t.type, c.name as category_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.date BETWEEN ? AND ?`,
      [req.userId, startDate, endDate]
    );

    let totalIncome = 0, totalExpense = 0;
    let essential = 0, priority = 0, lifestyle = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
        const group = classify(tx.category_name);
        if (group === 'essential') essential += tx.amount;
        else if (group === 'priority') priority += tx.amount;
        else lifestyle += tx.amount;
      }
    }

    const balance = totalIncome - totalExpense;
    const ref = totalIncome || 1;

    // Score from 0-100 based on how close to 50-15-35 ideal
    const essentialDelta = Math.abs((essential / ref * 100) - 50);
    const priorityDelta = Math.abs((priority / ref * 100) - 15);
    const lifestyleDelta = Math.abs((lifestyle / ref * 100) - 35);
    const score = Math.max(0, 100 - essentialDelta - priorityDelta - lifestyleDelta);

    res.json({
      period: `${y}-${m}`,
      balance,
      total_income: totalIncome,
      total_expense: totalExpense,
      breakdown: {
        essential: { amount: essential, percent: totalIncome ? (essential / totalIncome * 100).toFixed(1) : 0, ideal: 50 },
        priority: { amount: priority, percent: totalIncome ? (priority / totalIncome * 100).toFixed(1) : 0, ideal: 15 },
        lifestyle: { amount: lifestyle, percent: totalIncome ? (lifestyle / totalIncome * 100).toFixed(1) : 0, ideal: 35 }
      },
      health_score: Math.round(score),
      score_label: score >= 75 ? 'Excellent 🟢' : score >= 50 ? 'Good 🟡' : 'Attention 🔴'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: await translate('finance.internalError') });
  }
});

// GET /finance/forecast
router.get('/forecast', authMiddleware, async (req, res) => {
  const translate = await createTranslator(req);
  try {
    const db = await getDatabase();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startDate = `${year}-${month}-01`;

    // Current month balance so far
    const monthTxs = await queryAll(db,
      'SELECT amount, type, date FROM transactions WHERE user_id = ? AND date >= ?',
      [req.userId, startDate]
    );

    let currentBalance = 0;
    for (const tx of monthTxs) {
      currentBalance += tx.type === 'income' ? tx.amount : -tx.amount;
    }

    // Recurring transactions to project
    const recurring = await queryAll(db,
      'SELECT amount, type FROM transactions WHERE user_id = ? AND is_recurring = 1',
      [req.userId]
    );

    // Generate 30-day forecast
    const forecast = [];
    let projectedBalance = currentBalance;
    const dailyRecurring = recurring.reduce((sum, tx) => {
      return sum + (tx.type === 'income' ? tx.amount : -tx.amount) / 30;
    }, 0);

    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      projectedBalance += dailyRecurring;
      forecast.push({
        date: d.toISOString().split('T')[0],
        balance: Math.round(projectedBalance * 100) / 100
      });
    }

    res.json({
      current_balance: currentBalance,
      projected_end_of_month: forecast[29].balance,
      daily_trend: dailyRecurring,
      forecast
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: await translate('finance.internalError') });
  }
});

module.exports = router;
