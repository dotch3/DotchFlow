// backend/src/__tests__/routes/auth.test.js
const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');

const mockUsers = [
  {
    id: 1,
    email: 'test@example.com',
    password_hash: bcrypt.hashSync('password123', 10),
    language: 'en',
    xp_points: 100,
    dotch_coins: 50,
    level: 1,
    streak_count: 0,
    last_checkin: null,
    created_at: '2024-01-01T00:00:00.000Z'
  }
];

// Variable to track next generated ID
let nextUserId = 2;

describe('POST /auth/login', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();

    const mockDb = {
      getDatabase: jest.fn().mockResolvedValue({}),
      queryOne: jest.fn((db, sql, params) => {
        if (sql && typeof sql === 'string' && sql.includes('email') && params && params[0]) {
          return mockUsers.find(u => u.email === params[0]) || null;
        }
        return null;
      }),
      queryAll: jest.fn().mockReturnValue([]),
      execute: jest.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 })
    };

    jest.doMock('../../infra/database/db', () => mockDb);
    jest.doMock('../../i18n', () => ({
      t: jest.fn((key) => key),
      createTranslator: jest.fn().mockResolvedValue(jest.fn((key) => key))
    }));

    const appExpress = express();
    appExpress.use(express.json());
    const authRoutes = require('../../ui/routes/auth');
    appExpress.use('/auth', authRoutes);
    app = appExpress;
  });

  it('returns 401 with wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('returns 401 with non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'notfound@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('returns 400 with empty email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: '', password: 'password123' });

    expect(res.status).toBe(400);
  });

  it('returns 200 with valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
  });
});

describe('POST /auth/register', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    nextUserId = 2;

    const mockDb = {
      getDatabase: jest.fn().mockResolvedValue({}),
      queryOne: jest.fn((db, sql, params) => {
        // First call: check if email exists - contains "WHERE email"
        if (sql && typeof sql === 'string' && sql.includes('WHERE email')) {
          return null;
        }
        // Second call: get created user by ID - contains "WHERE id"
        if (sql && typeof sql === 'string' && sql.includes('WHERE id') && params && params[0]) {
          return {
            id: params[0],
            email: 'new@example.com',
            language: 'en',
            xp_points: 0,
            dotch_coins: 100,
            level: 1,
            streak_count: 0,
            last_checkin: null,
            created_at: '2024-01-01T00:00:00.000Z'
          };
        }
        return null;
      }),
      queryAll: jest.fn().mockReturnValue([]),
      execute: jest.fn((db, sql, params) => {
        // Return lastInsertRowId (with uppercase ID)
        return { changes: 1, lastInsertRowId: nextUserId++ };
      })
    };

    jest.doMock('../../infra/database/db', () => mockDb);
    jest.doMock('../../i18n', () => ({
      t: jest.fn((key) => key),
      createTranslator: jest.fn().mockResolvedValue(jest.fn((key) => key))
    }));

    const appExpress = express();
    appExpress.use(express.json());
    const authRoutes = require('../../ui/routes/auth');
    appExpress.use('/auth', authRoutes);
    app = appExpress;
  });

  it('returns 201 with valid data', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'new@example.com', password: 'password123' });

    console.log('Response:', res.status, res.body);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('new@example.com');
  });

  it('returns 400 with short password', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'new@example.com', password: '123' });

    expect(res.status).toBe(400);
  });

  it('returns 409 if email already exists', async () => {
    const db = require('../../infra/database/db');
    db.queryOne.mockImplementation((db, sql, params) => {
      if (sql && typeof sql === 'string' && sql.includes('WHERE email')) {
        return mockUsers[0];
      }
      return null;
    });

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(409);
  });
});

describe('PUT /auth/language', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();

    jest.doMock('../../ui/middleware/auth', () => ({
      authMiddleware: (req, res, next) => {
        req.userId = 1;
        next();
      }
    }));

    const mockDb = {
      getDatabase: jest.fn().mockResolvedValue({}),
      queryOne: jest.fn((db, sql, params) => {
        if (sql && typeof sql === 'string' && sql.includes('users') && params && params[0]) {
          // Return user with current language (will be updated by mock)
          return { ...mockUsers[0], language: 'en' };
        }
        return null;
      }),
      queryAll: jest.fn().mockReturnValue([]),
      execute: jest.fn((db, sql, params) => {
        // Update mock to return correct language on next queryOne call
        return { changes: 1 };
      })
    };

    // Variable to store current language
    let currentLanguage = 'en';
    
    // Modify queryOne to use current language
    const originalQueryOne = mockDb.queryOne;
    mockDb.queryOne = jest.fn((db, sql, params) => {
      if (sql && typeof sql === 'string' && sql.includes('users') && params && params[0]) {
        return { ...mockUsers[0], language: currentLanguage };
      }
      return null;
    });

    // Modify execute to update language
    mockDb.execute = jest.fn((db, sql, params) => {
      if (sql && sql.includes('UPDATE users SET language')) {
        currentLanguage = params[0]; // New language is in first parameter
      }
      return { changes: 1 };
    });

    jest.doMock('../../infra/database/db', () => mockDb);
    jest.doMock('../../i18n', () => ({
      t: jest.fn((key) => key),
      createTranslator: jest.fn().mockResolvedValue(jest.fn((key) => key))
    }));

    const appExpress = express();
    appExpress.use(express.json());
    const authRoutes = require('../../ui/routes/auth');
    appExpress.use('/auth', authRoutes);
    app = appExpress;
  });

  it('returns 200 with valid language', async () => {
    const res = await request(app)
      .put('/auth/language')
      .send({ language: 'es' });

    expect(res.status).toBe(200);
    expect(res.body.user.language).toBe('es');
  });

  it('returns 400 with invalid language', async () => {
    const res = await request(app)
      .put('/auth/language')
      .send({ language: 'invalid' });

    expect(res.status).toBe(400);
  });
});