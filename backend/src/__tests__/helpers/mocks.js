// backend/src/__tests__/helpers/mocks.js

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

const mockCategories = [
  { id: 1, user_id: 1, name: 'Food', icon: '🍔', monthly_limit: 0 },
  { id: 2, user_id: 1, name: 'Transport', icon: '🚗', monthly_limit: 0 },
  { id: 3, user_id: 1, name: 'Housing', icon: '🏠', monthly_limit: 0 }
];

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

const createMockDb = () => ({
  queryOne: jest.fn((sql, params) => {
    // User by email
    if (sql.includes('email = ?') && params[0]) {
      return mockUsers.find(u => u.email === params[0]) || null;
    }
    // User by id
    if (sql.includes('id = ?') && sql.includes('users')) {
      return mockUsers.find(u => u.id === params[0]) || null;
    }
    // Category
    if (sql.includes('categories')) {
      if (sql.includes('id = ?')) {
        return mockCategories.find(c => c.id === params[0]) || null;
      }
      return mockCategories;
    }
    // Transaction
    if (sql.includes('transactions')) {
      if (sql.includes('id = ?')) {
        return mockTransactions.find(t => t.id === params[0]) || null;
      }
      return mockTransactions;
    }
    return null;
  }),

  queryAll: jest.fn((sql, params) => {
    if (sql.includes('categories') && sql.includes('user_id')) {
      return mockCategories.filter(c => c.user_id === params[0]);
    }
    if (sql.includes('transactions') && sql.includes('user_id')) {
      return mockTransactions.filter(t => t.user_id === params[0]);
    }
    return [];
  }),

  execute: jest.fn(() => ({ changes: 1, lastInsertRowid: 1 }))
});

const resetMocks = (mockDb) => {
  mockDb.queryOne.mockClear();
  mockDb.queryAll.mockClear();
  mockDb.execute.mockClear();
};

module.exports = { createMockDb, mockUsers, mockCategories, mockTransactions, resetMocks };