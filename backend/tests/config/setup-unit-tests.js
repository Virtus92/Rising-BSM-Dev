/**
 * Setup Unit Tests
 * 
 * This file sets up the environment specifically for unit tests.
 */

// Set environment type for conditional logic in setup
process.env.JEST_TEST_TYPE = 'unit';

// Set test timeout
jest.setTimeout(10000);

// Mock all external modules that shouldn't be called in unit tests
jest.mock('../../src/config', () => ({
  // Mock configuration values for unit tests
  NODE_ENV: 'test',
  IS_PRODUCTION: false,
  IS_DEVELOPMENT: false,
  IS_TEST: true,
  JWT_SECRET: 'test-jwt-secret',
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  JWT_REFRESH_EXPIRES_IN: '7d',
  JWT_REFRESH_TOKEN_ROTATION: true,
  VERIFY_JWT_USER_IN_DB: false,
  LOG_LEVEL: 'error',
  // Add other config mocks as needed
  default: {
    NODE_ENV: 'test',
    IS_PRODUCTION: false,
    IS_DEVELOPMENT: false,
    IS_TEST: true,
    JWT_SECRET: 'test-jwt-secret',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_REFRESH_EXPIRES_IN: '7d',
    JWT_REFRESH_TOKEN_ROTATION: true,
    VERIFY_JWT_USER_IN_DB: false,
    LOG_LEVEL: 'error'
  }
}));

// Mock the PrismaClient in unit tests
jest.mock('@prisma/client', () => {
  const mockPrismaClient = jest.fn().mockImplementation(() => {
    return {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return await callback({});
      }),
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      customer: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      // Add other models as needed
    };
  });

  return {
    PrismaClient: mockPrismaClient
  };
});

// Run after all tests to clean up any mocks
afterAll(() => {
  jest.restoreAllMocks();
});
