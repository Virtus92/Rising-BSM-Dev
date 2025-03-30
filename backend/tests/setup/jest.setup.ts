import { jest } from '@jest/globals';

/**
 * Jest Setup File
 * 
 * This file runs before each test file.
 * It sets up the global test environment.
 */

// Set test environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  JWT_SECRET: 'test-jwt-secret',
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  JWT_REFRESH_TOKEN_ROTATION: 'true'
};

// Additional Jest matchers or global setup can be added here
jest.setTimeout(10000); // Set default timeout to 10 seconds

// Mock console methods to reduce noise during tests
// Comment out these lines if you need to see console output during tests
global.console.log = jest.fn();
global.console.info = jest.fn();
global.console.warn = jest.fn();
global.console.error = jest.fn();

// Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
