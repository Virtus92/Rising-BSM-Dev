// Server-side test setup

// Environment variables for server tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock Prisma for server tests
jest.mock('@/core/db/prisma/server-client', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // Add other models as needed
  },
}));

// Mock external dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Global fetch mock for server tests
global.fetch = jest.fn();

// Fix navigator issue for @testing-library/user-event
if (typeof globalThis.navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { 
      clipboard: { 
        writeText: jest.fn(),
        readText: jest.fn()
      },
      userAgent: 'Mozilla/5.0 (jest)'
    },
    writable: true,
    configurable: true
  });
}

// Also define window for any dependencies that might need it
if (typeof globalThis.window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: globalThis,
    writable: true,
    configurable: true
  });
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});