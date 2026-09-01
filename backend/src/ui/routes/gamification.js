// src/ui/routes/gamification.js
const express = require('express');
const { getDatabase, queryOne, execute } = require('../../infra/database/db');
const { authMiddleware } = require('../middleware/auth');
const { createTranslator } = require('../../i18n');

const router = express.Router();

// XP and coins per action
const XP_DAILY_CHECKIN = 50;
const COINS_DAILY_CHECKIN = 10;
const XP_STREAK_BONUS = 25; // per streak day
const XP_PER_LEVEL = 500;

function calculateLevel(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

// POST /gamification/checkin
router.post('/checkin', authMiddleware, async (req, res) => {
  const translate = await createTranslator(req);
  try {
    const db = await getDatabase();
    const user = await queryOne(db, 'SELECT * FROM users WHERE id = ?', [req.userId]);
    if (!user) return res.status(404).json({ error: await translate('gamification.userNotFound') });

    const today = new Date().toISOString().split('T')[0];
    const lastCheckin = user.last_checkin;

    if (lastCheckin === today) {
      return res.status(400).json({
        error: await translate('gamification.alreadyCheckedIn'),
        next_checkin: today + ' 23:59:59'
      });
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak = lastCheckin === yesterday ? user.streak_count + 1 : 1;

    const xpGained = XP_DAILY_CHECKIN + (newStreak - 1) * XP_STREAK_BONUS;
    const coinsGained = COINS_DAILY_CHECKIN + Math.floor(newStreak / 5) * 5;

    const newXp = user.xp_points + xpGained;
    const newCoins = user.dotch_coins + coinsGained;
    const newLevel = calculateLevel(newXp);
    const leveledUp = newLevel > user.level;

    await execute(db,
      'UPDATE users SET xp_points=?, dotch_coins=?, level=?, streak_count=?, last_checkin=? WHERE id=?',
      [newXp, newCoins, newLevel, newStreak, today, req.userId]
    );

    const message = newStreak > 1
      ? await translate('gamification.streakBonus', { days: newStreak })
      : await translate('gamification.checkinSuccess');

    res.json({
      success: true,
      xp_gained: xpGained,
      coins_gained: coinsGained,
      streak_count: newStreak,
      xp_points: newXp,
      dotch_coins: newCoins,
      level: newLevel,
      leveled_up: leveledUp,
      message
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: await translate('gamification.internalError') });
  }
});

// GET /gamification/status
router.get('/status', authMiddleware, async (req, res) => {
  const translate = await createTranslator(req);
  try {
    const db = await getDatabase();
    const user = await queryOne(db, 
      'SELECT id, level, xp_points, dotch_coins, streak_count, last_checkin FROM users WHERE id = ?',
      [req.userId]
    );
    const today = new Date().toISOString().split('T')[0];
    const xpForCurrentLevel = (user.level - 1) * XP_PER_LEVEL;
    const xpProgress = user.xp_points - xpForCurrentLevel;
    const xpToNextLevel = XP_PER_LEVEL;

    res.json({
      ...user,
      xp_progress: xpProgress,
      xp_to_next_level: xpToNextLevel,
      xp_percent: Math.round((xpProgress / xpToNextLevel) * 100),
      checked_in_today: user.last_checkin === today
    });
  } catch (err) {
    res.status(500).json({ error: await translate('gamification.internalError') });
  }
});

module.exports = router;
