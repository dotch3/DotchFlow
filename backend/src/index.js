// src/index.js — DotchFlow API entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const authRoutes = require('./ui/routes/auth');
const gamificationRoutes = require('./ui/routes/gamification');
const financeRoutes = require('./ui/routes/finance');
const transactionsRoutes = require('./ui/routes/transactions');
const categoriesRoutes = require('./ui/routes/categories');
const goalsRoutes = require('./ui/routes/goals');
const storeRoutes = require('./ui/routes/store');
const adminRoutes = require('./ui/routes/admin');
const { getDatabase } = require('./infra/database/db');
const { t } = require('./i18n');

const app = express();
const PORT = process.env.PORT || 3001;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'DotchFlow API',
      description: 'RESTful API for DotchFlow - Personal finance manager with gamification.\n\n## Authentication\nMost endpoints require JWT authentication. To get a token:\n1. Login at `/auth/login` to receive the token\n\n2. Add the header `Authorization: Bearer <YOUR_TOKEN>` to all authenticated requests\n\n## Response Structure\n- **Success**: `{ "data": ... }` or `{ "resource": ... }`\n\n- **Error**: `{ "error": "error message" }` or `{ "errors": [...] }`',
      version: '1.0.0',
      contact: {
        name: 'dotch3',
        url: 'https://github.com/dotch3'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Local development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ BearerAuth: [] }]
  },
  apis: ['./src/docs/openapi.yaml']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'DotchFlow API', version: '1.0.0' }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.get('/api-docs.json', (req, res) => res.json(swaggerDocs));

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
app.use(async (req, res) => res.status(404).json({ error: await t('errors.routeNotFound') }));

// Global error handler
app.use(async (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: await t('errors.internal') });
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
