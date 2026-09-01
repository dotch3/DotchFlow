// src/index.js — DotchFlow API entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const debug = require('debug')('dotchflow:server');
const dbDebug = require('debug')('dotchflow:db');
const httpDebug = require('debug')('dotchflow:http');

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
const { version: APP_VERSION } = require('../package.json');

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================================================
// DEBUG LOGGING SETUP
// =============================================================================
// Run with: DEBUG=dotchflow:* npm run dev
// Or for specific logs: DEBUG=dotchflow:http npm run dev

// Custom Morgan format for HTTP requests
morgan.token('body', (req) => {
  if (Object.keys(req.body || {}).length > 0) {
    return `\n  Body: ${JSON.stringify(req.body)}`;
  }
  return '';
});
morgan.token('auth', (req) => {
  const token = req.headers.authorization;
  if (token) {
    return `\n  Auth: ${token.substring(0, 30)}...`;
  }
  return '';
});

// HTTP request logging middleware (dev mode only)
const isDev = process.env.NODE_ENV !== 'production';
if (isDev) {
  app.use(morgan(':method :url :status :response-time ms - :res[content-length]:body:auth'));
}

// Detailed debug logging for all requests
app.use((req, res, next) => {
  const start = Date.now();
  
  httpDebug(`🚀 INCOMING: ${req.method} ${req.url}`);
  httpDebug(`   Query: ${JSON.stringify(req.query)}`);
  if (req.headers.authorization) {
    httpDebug(`   Auth: Bearer ${req.headers.authorization.substring(0, 40)}...`);
  }
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    const reset = '\x1b[0m';
    httpDebug(`${color}✅ RESPONSE: ${req.method} ${req.url} → ${res.statusCode} (${duration}ms)${reset}`);
  });
  
  next();
});

// Expose debug namespaces for use in other modules
app.set('dbDebug', dbDebug);
app.set('httpDebug', httpDebug);

// Swagger: src/docs/openapi.yaml is the single source of truth for the
// API spec - loaded as-is and served directly. (There used to be a second,
// hand-duplicated copy of info/servers/security here, built via
// swagger-jsdoc's `definition` option and merged with this file - that
// tool is meant for merging JSDoc comments scattered across route files
// into a base spec, which this project never had, so all it did here was
// silently win over the YAML on info/servers/security and make edits to
// openapi.yaml look like they had no effect. Removed; this is the only copy now.)
const swaggerDocs = yaml.load(fs.readFileSync(path.join(__dirname, 'docs/openapi.yaml'), 'utf8'));

// Keep the served spec's version number tied to package.json instead of
// letting openapi.yaml's own `info.version` drift out of sync with it.
swaggerDocs.info.version = APP_VERSION;

// Local dev server URL: read the actual configured PORT instead of
// whatever's written in the YAML (which goes stale the moment PORT is
// changed in .env - previously sent "Try it out" requests to a port
// nothing was listening on, which looked like a CORS/network error in
// Swagger UI but was really just the wrong URL).
swaggerDocs.servers = [
  { url: `http://localhost:${PORT}`, description: 'Local development server' },
];

// Render exposes the live URL via RENDER_EXTERNAL_URL. When present, put it
// first in the Swagger "servers" dropdown so /api-docs works out of the box
// against the deployed API, without hand-editing openapi.yaml per deploy.
if (process.env.RENDER_EXTERNAL_URL) {
  swaggerDocs.servers.unshift({ url: process.env.RENDER_EXTERNAL_URL, description: 'Production (Render)' });
}

// Used only if CORS_ORIGINS isn't set in .env - covers the most common
// local dev server ports (Vite, CRA/Next, Angular, alt Node ports) so a
// browser-based frontend isn't blocked by CORS before anyone's configured
// anything. Set CORS_ORIGINS explicitly for anything beyond local dev.
const defaultOrigins = [
  'http://localhost:5173', // Vite
  'http://localhost:3000', // Create React App / Next.js
  'http://localhost:3001', // Next.js fallback port, or a second local API
  'http://localhost:4200', // Angular CLI
  'http://localhost:8080', // Vue CLI / webpack-dev-server
];
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : defaultOrigins;
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'DotchFlow API', version: APP_VERSION }));

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
      console.log(`📖 Swagger: http://localhost:${PORT}/api-docs`);
      console.log(`\n🔧 DEBUG MODES:`);
      console.log(`   DEBUG=dotchflow:*        → All logs`);
      console.log(`   DEBUG=dotchflow:http     → HTTP requests only`);
      console.log(`   DEBUG=dotchflow:db       → Database queries`);
      console.log(`   DEBUG=dotchflow:server   → Server info only\n`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = app;
