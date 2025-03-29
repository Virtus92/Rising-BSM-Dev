/**
 * Jest API Test Configuration
 * 
 * Configuration specifically optimized for API tests.
 */
const baseConfig = require('../../jest.config.js');

module.exports = {
  ...baseConfig,
  // Run only API tests
  testMatch: [
    '**/tests/api/**/*.test.(ts|js)',
  ],
  // Set test environment
  testEnvironment: 'node',
  // Set env variable for test type
  setupFilesAfterEnv: [
    '<rootDir>/tests/config/setup-api-tests.js',
    '<rootDir>/tests/utils/test-setup.js'
  ],
  // Focus on API routes
  collectCoverageFrom: [
    'src/controllers/**/*.{ts,js}',
    'src/routes/**/*.{ts,js}',
    'src/middleware/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  // Increase timeout for API tests
  testTimeout: 90000
};
