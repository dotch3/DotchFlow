// backend/src/__tests__/routes/transactions.test.js
const request = require('supertest');
const express = require('express');

const mockTransactions = [
  {
    id: 1,
    user_id: 1,
    amount: 100,
    description: 'Test expense',
    category_id: 1,
    category_name: 'Food',
    category_icon: '🍔',
    date: '2024-01-15',
    type: 'expense',
    is_quick_entry: 0,
    is_recurring: 0,
    created_at: '2024-01-15T10:00:00.000Z'
  }
];

describe('GET /transactions', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();

    const mockDb = {
      getDatabase: jest.fn().mockResolvedValue({}),
      queryOne: jest.fn().mockReturnValue(null),
      queryAll: jest.fn((db, sql, params) => {
        // Summary query with GROUP BY (check first to avoid matching 'transactions')
        if (sql && sql.includes('GROUP BY')) {
          return [
            { type: 'income', total: 5000 },
            { type: 'expense', total: 2500 }
          ];
        }
        // Transactions list query
        if (sql && sql.includes('transactions') && params && params[0]) {
          return mockTransactions;
        }
        return [];
      }),
      execute: jest.fn().mockReturnValue({ changes: 1 })
    };

    jest.doMock('../../infra/database/db', () => mockDb);
    jest.doMock('../../i18n', () => ({
      t: jest.fn((key) => key),
      createTranslator: jest.fn().mockResolvedValue(jest.fn((key) => key))
    }));

    // Mock auth middleware
    jest.doMock('../../ui/middleware/auth', () => ({
      authMiddleware: (req, res, next) => {
        req.userId = 1;
        next();
      }
    }));

    const appExpress = express();
    appExpress.use(express.json());
    const transactionRoutes = require('../../ui/routes/transactions');
    appExpress.use('/transactions', transactionRoutes);
    app = appExpress;
  });

  it('returns 200 with transaction list', async () => {
    const res = await request(app)
      .get('/transactions');

    expect(res.status).toBe(200);
    expect(res.body.transactions).toBeDefined();
    expect(Array.isArray(res.body.transactions)).toBe(true);
  });

  it('returns income and expense totals', async () => {
    const res = await request(app)
      .get('/transactions');

    expect(res.status).toBe(200);
    expect(res.body.totals).toBeDefined();
    expect(res.body.totals.income).toBeDefined();
    expect(res.body.totals.expense).toBeDefined();
  });
});

describe('POST /transactions', () => {
  let app;
  let mockDb;

  beforeEach(() => {
    jest.resetModules();

    mockDb = {
      getDatabase: jest.fn().mockResolvedValue({}),
      queryOne: jest.fn().mockReturnValue(null),
      queryAll: jest.fn().mockReturnValue([]),
      execute: jest.fn((db, sql, params) => {
        if (sql && sql.includes('INSERT INTO transactions')) {
          return { changes: 1, lastInsertRowId: 1 };
        }
        return { changes: 1 };
      })
    };

    jest.doMock('../../infra/database/db', () => mockDb);
    jest.doMock('../../i18n', () => ({
      t: jest.fn((key) => key),
      createTranslator: jest.fn().mockResolvedValue(jest.fn((key) => key))
    }));

    jest.doMock('../../ui/middleware/auth', () => ({
      authMiddleware: (req, res, next) => {
        req.userId = 1;
        next();
      }
    }));

    const appExpress = express();
    appExpress.use(express.json());
    const transactionRoutes = require('../../ui/routes/transactions');
    appExpress.use('/transactions', transactionRoutes);
    app = appExpress;
  });

  it('returns 201 with created transaction', async () => {
    const res = await request(app)
      .post('/transactions')
      .send({
        amount: 150,
        type: 'expense',
        description: 'Test transaction'
      });

    expect(res.status).toBe(201);
    expect(res.body.transaction).toBeDefined();
  });

  it('returns 400 with invalid amount', async () => {
    const res = await request(app)
      .post('/transactions')
      .send({
        amount: -50,
        type: 'expense'
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 with invalid type', async () => {
    const res = await request(app)
      .post('/transactions')
      .send({
        amount: 100,
        type: 'invalid_type'
      });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /transactions/:id', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();

    const mockDb = {
      getDatabase: jest.fn().mockResolvedValue({}),
      queryOne: jest.fn((db, sql, params) => {
        if (sql && sql.includes('id = ?') && params && params[0]) {
          return { id: 1, user_id: 1, amount: 100 };
        }
        return null;
      }),
      queryAll: jest.fn().mockReturnValue([]),
      execute: jest.fn().mockReturnValue({ changes: 1 })
    };

    jest.doMock('../../infra/database/db', () => mockDb);
    jest.doMock('../../i18n', () => ({
      t: jest.fn((key) => key),
      createTranslator: jest.fn().mockResolvedValue(jest.fn((key) => key))
    }));

    jest.doMock('../../ui/middleware/auth', () => ({
      authMiddleware: (req, res, next) => {
        req.userId = 1;
        next();
      }
    }));

    const appExpress = express();
    appExpress.use(express.json());
    const transactionRoutes = require('../../ui/routes/transactions');
    appExpress.use('/transactions', transactionRoutes);
    app = appExpress;
  });

  it('returns 200 when deleting transaction', async () => {
    const res = await request(app)
      .delete('/transactions/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 if transaction does not exist', async () => {
    const db = require('../../infra/database/db');
    db.queryOne.mockReturnValueOnce(null);

    const res = await request(app)
      .delete('/transactions/999');

    expect(res.status).toBe(404);
  });
});