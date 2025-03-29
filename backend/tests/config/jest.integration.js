/**
 * Jest Integration Test Configuration
 * 
 * Configuration specifically optimized for integration tests.
 */
const baseConfig = require('../../jest.config.js');

module.exports = {
  ...baseConfig,
  // Run only integration tests
  testMatch: [
    '**/tests/integration/**/*.test.(ts|js)',
  ],
  // Set test environment
  testEnvironment: 'node',
  // Set env variable for test type
  setupFilesAfterEnv: [
    '<rootDir>/tests/config/setup-integration-tests.js',
    '<rootDir>/tests/utils/test-setup.js'
  ],
  // Focus on integration tests code coverage
  collectCoverageFrom: [
    'src/services/**/*.{ts,js}',
    'src/repositories/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  // Increase timeout for integration tests
  testTimeout: 60000
};
