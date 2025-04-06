import 'jest';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.HOST = 'localhost';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_DATABASE = 'test_db';

// Mock Prisma
jest.mock('./prisma/generated/client', () => {
  // Define a type for the mock Prisma client
  type MockPrismaClient = {
    $connect: jest.Mock;
    $disconnect: jest.Mock;
    $transaction: jest.Mock;
    $queryRaw: jest.Mock;
    $executeRaw: jest.Mock;
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
      deleteMany: jest.Mock;
    };
    customer: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    refreshToken: {
      create: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
    };
    userActivity: {
      create: jest.Mock;
    };
    notification: {
      findMany: jest.Mock;
      count: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
    };
  };
  
  const mockPrismaClient: MockPrismaClient = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn((callback) => callback(mockPrismaClient)),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn()
    },
    customer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    },
    userActivity: {
      create: jest.fn()
    },
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn()
    },
    // Add other models as needed
  };
  
  return { 
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

// Global mocks for commonly used modules
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(() => ({ userId: 1 })),
  JsonWebTokenError: class JsonWebTokenError extends Error {},
  TokenExpiredError: class TokenExpiredError extends Error {
    expiredAt: Date;
    constructor(message: string, expiredAt: Date) {
      super(message);
      this.expiredAt = expiredAt;
    }
  }
}));

// Global Jest configuration
jest.setTimeout(10000);