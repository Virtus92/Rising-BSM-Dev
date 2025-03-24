/**
 * Jest setup file
 * 
 * This file runs before each test file and sets up global mocks and configurations.
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';

// Set up global mocks for Prisma
jest.mock('./utils/prisma.utils', () => {
  const { mockDeep } = require('jest-mock-extended');
  const prismaMock = mockDeep();
  return {
    __esModule: true,
    prisma: prismaMock,
    default: prismaMock
  };
});

// Mock logger to prevent console output during tests
jest.mock('./utils/common.utils', () => {
  return {
    __esModule: true,
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    },
    cache: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      getOrExecute: jest.fn()
    },
    delay: jest.fn().mockResolvedValue(undefined),
    env: jest.fn((key, defaultValue) => defaultValue)
  };
});

// Add global test helper for Prisma mocking
global.createPrismaMock = () => {
  const { mockDeep } = require('jest-mock-extended');
  return mockDeep();
};

// Enable fake timers
jest.useFakeTimers();

// Silence console during tests unless explicitly testing console output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock the dependency container
jest.mock('./config/dependency-container', () => {
  return {
    __esModule: true,
    inject: jest.fn().mockImplementation((name) => {
      if (name === 'PrismaClient') {
        const { mockDeep } = require('jest-mock-extended');
        return mockDeep();
      }
      return jest.fn();
    }),
    cleanup: jest.fn().mockResolvedValue(undefined),
    default: {
      getInstance: jest.fn().mockReturnValue({
        register: jest.fn(),
        resolve: jest.fn(),
        has: jest.fn(),
        remove: jest.fn(),
        clear: jest.fn()
      })
    }
  };
});