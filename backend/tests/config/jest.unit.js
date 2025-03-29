/**
 * Jest Unit Test Configuration
 * 
 * Configuration specifically optimized for unit tests.
 */
const baseConfig = require('../../jest.config.js');

module.exports = {
  ...baseConfig,
  // Run only unit tests
  testMatch: [
    '**/tests/unit/**/*.test.(ts|js)',
  ],
  // Set test environment
  testEnvironment: 'node',
  // No need for database setup in unit tests
  globalSetup: undefined,
  globalTeardown: undefined,
  // Set env variable for test type
  setupFilesAfterEnv: [
    '<rootDir>/tests/config/setup-unit-tests.js',
    '<rootDir>/tests/utils/test-setup.js'
  ],
  // Speed up by focusing on unit tests only
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/index.ts',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  // Set coverage thresholds for unit tests
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80
    },
    './src/services/': {
      statements: 90,
      branches: 80,
      functions: 90,
      lines: 90
    },
    './src/utils/': {
      statements: 90,
      branches: 80,
      functions: 90,
      lines: 90
    }
  }
};
