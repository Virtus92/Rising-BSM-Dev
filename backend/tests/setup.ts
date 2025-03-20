import { jest } from '@jest/globals';

// Set timeout for all tests
jest.setTimeout(10000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.BACKEND_PORT = '5000';

// Silence console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});