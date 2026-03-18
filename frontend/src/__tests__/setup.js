// Setup for Vitest tests
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock global objects
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:5173/',
  pathname: '/',
  search: '',
  reload: vi.fn(),
};