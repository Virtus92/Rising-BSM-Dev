/**
 * Global test setup for Jest
 * 
 * This file is run before every test file
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import type { Response } from 'express';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Define types for the mock Prisma client
type MockPrismaModel = {
  findUnique: jest.Mock;
  findMany: jest.Mock;
  findFirst: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  count: jest.Mock;
  upsert?: jest.Mock;
};

type MockPrismaClient = {
  $connect: jest.Mock;
  $disconnect: jest.Mock;
  user: MockPrismaModel;
  customer: MockPrismaModel;
  project: MockPrismaModel;
  appointment: MockPrismaModel;
  appointmentNote: MockPrismaModel;
  appointmentLog: { create: jest.Mock; findMany: jest.Mock };
  service: MockPrismaModel;
  contactRequest: MockPrismaModel;
  requestNote: { create: jest.Mock; findMany: jest.Mock };
  requestLog: { create: jest.Mock };
  notification: MockPrismaModel;
  userSettings: MockPrismaModel;
  refreshToken: MockPrismaModel;
  customerLog: { create: jest.Mock; findMany: jest.Mock };
  projectNote: { create: jest.Mock; findMany: jest.Mock };
  $transaction: jest.Mock<any, [((prisma: MockPrismaClient) => any) | Promise<any>[]]>;
};

// Mock the prisma client
jest.mock('../utils/prisma.utils', () => {
  // Create the mock client with proper typing
  const mockPrismaClient: MockPrismaClient = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
    },
    appointment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
    },
    appointmentNote: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    appointmentLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
    },
    contactRequest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    requestNote: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    requestLog: {
      create: jest.fn(),
    },
    notification: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    userSettings: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    customerLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    projectNote: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback: ((prisma: MockPrismaClient) => any) | Promise<any>[]) => {
      if (typeof callback === 'function') {
        return callback(mockPrismaClient);
      }
      return Promise.all(callback);
    }),
  };

  return {
    prisma: mockPrismaClient,
    getPrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Direkt Jest Mocks für Auth-Funktionen erstellen statt die Datei zu mocken
// Dies vermeidet das Problem 'Cannot find module '../utils/auth.utils'
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ id: 1, name: 'Test User', role: 'admin' })),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(() => 'hashed-password'),
  compare: jest.fn(() => true),
}));

// Mock date-fns functions if needed
jest.mock('date-fns', () => {
  const actual = jest.requireActual('date-fns');
  return {
    ...actual,
    format: jest.fn((date, formatStr) => '01.01.2025'),
    parseISO: jest.fn((dateStr) => new Date(dateStr)),
    addDays: jest.fn((date, days) => new Date(date)),
    differenceInDays: jest.fn(() => 5),
  };
});

// Mock the response factory for easier testing
jest.mock('../utils/response.factory', () => {
  const mockResponseHandler = (
    res: Response, 
    data: any, 
    message: string, 
    statusCode: number
  ) => {
    res.status(statusCode || 200).json({
      success: true,
      data,
      message: message || ''
    });
  };

  return {
    ResponseFactory: {
      success: jest.fn((res, data, message, statusCode) => 
        mockResponseHandler(res, data, message, statusCode || 200)),
      created: jest.fn((res, data, message) => 
        mockResponseHandler(res, data, message, 201)),
      paginated: jest.fn((res, data, pagination, message, statusCode, meta) => 
        res.status(statusCode || 200).json({
          success: true,
          data,
          pagination,
          message: message || '',
          meta: meta || {}
        })),
      status: jest.fn((res, message, statusCode) => 
        res.status(statusCode).json({
          success: statusCode >= 200 && statusCode < 300,
          message
        })),
    }
  };
});

// Mock the cache service
jest.mock('../services/cache.service', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    getOrExecute: jest.fn((key, callback) => callback()),
  }
}));

// Global beforeAll hook - runs once before all tests
beforeAll(() => {
  // Any global setup
  console.log('Running global test setup...');
});

// Global afterAll hook - runs once after all tests
afterAll(() => {
  // Any global teardown
  console.log('Running global test teardown...');
});

// Global beforeEach hook - runs before each test
beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

// Test user - available in all tests
const testUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin'
};

// Test helper functions
interface MockRequest {
  user?: typeof testUser;
  body?: Record<string, any>;
  params?: Record<string, any>;
  query?: Record<string, any>;
  ip?: string;
  [key: string]: any;
}

// Adding helper functions to global scope for easy access in tests
const createMockRequest = (overrides: Partial<MockRequest> = {}): MockRequest => ({
  user: testUser,
  body: {},
  params: {},
  query: {},
  ip: '127.0.0.1',
  ...overrides
});

const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

// Extend global with your test helpers
declare global {
  namespace NodeJS {
    interface Global {
      testUser: any;
      createMockRequest: any;
      createMockResponse: any;
    }
  }
}

// Make helper functions available globally
(global as any).testUser = testUser;
(global as any).createMockRequest = createMockRequest;
(global as any).createMockResponse = createMockResponse;