// src/index.js — DotchFlow API entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./ui/routes/auth');
const gamificationRoutes = require('./ui/routes/gamification');
const financeRoutes = require('./ui/routes/finance');
const transactionsRoutes = require('./ui/routes/transactions');
const categoriesRoutes = require('./ui/routes/categories');
const goalsRoutes = require('./ui/routes/goals');
const storeRoutes = require('./ui/routes/store');
const adminRoutes = require('./ui/routes/admin');
const { getDatabase } = require('./infra/database/db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'DotchFlow API', version: '1.0.0' }));

// Routes
app.use('/auth', authRoutes);
app.use('/gamification', gamificationRoutes);
app.use('/finance', financeRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/categories', categoriesRoutes);
app.use('/goals', goalsRoutes);
app.use('/store', storeRoutes);
app.use('/admin', adminRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Initialize DB then start server
getDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 DotchFlow API running on http://localhost:${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/health`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = app;
