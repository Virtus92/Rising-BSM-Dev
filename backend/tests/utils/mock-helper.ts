/**
 * Mock Helper Utilities 
 * 
 * This file contains utilities to help create mocks for testing.
 */
import { ILoggingService } from '../../src/interfaces/ILoggingService.js';
import { IErrorHandler, AppError } from '../../src/interfaces/IErrorHandler.js';
import { IValidationService } from '../../src/interfaces/IValidationService.js';
import { IUserRepository } from '../../src/interfaces/IUserRepository.js';
import { ICustomerRepository } from '../../src/interfaces/ICustomerRepository.js';
import { INotificationRepository } from '../../src/interfaces/INotificationRepository.js';
import { IRefreshTokenRepository } from '../../src/interfaces/IRefreshTokenRepository.js';

/**
 * Create a mock logging service
 */
export function createMockLoggingService() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    httpRequest: jest.fn(),
    child: jest.fn().mockReturnThis(),
    startTimer: jest.fn().mockReturnValue('timer-id'),
    endTimer: jest.fn(),
    isLevelEnabled: jest.fn().mockReturnValue(true)
  } as unknown as jest.Mocked<ILoggingService>;
}

/**
 * Create a mock error handler
 */
export function createMockErrorHandler() {
  const mockHandler = {
    handleError: jest.fn().mockImplementation((error) => {
      return {
        success: false,
        message: error.message || 'An error occurred',
        statusCode: error.statusCode || 500,
        errorCode: error.errorCode || 'internal_error',
        timestamp: new Date().toISOString()
      };
    }),
    createError: jest.fn().mockImplementation((message, statusCode = 500, errorCode = 'internal_error', details) => {
      return new AppError(message, statusCode, errorCode, details);
    }),
    formatError: jest.fn(),
    createValidationError: jest.fn().mockImplementation((message, errors = []) => {
      const error = new AppError(message, 400, 'validation_error');
      error.errors = errors;
      return error;
    }),
    createNotFoundError: jest.fn().mockImplementation((message, resource) => {
      return new AppError(message, 404, 'not_found', { resource });
    }),
    createUnauthorizedError: jest.fn().mockImplementation((message) => {
      return new AppError(message, 401, 'unauthorized');
    }),
    createForbiddenError: jest.fn().mockImplementation((message) => {
      return new AppError(message, 403, 'forbidden');
    }),
    logError: jest.fn()
  } as unknown as jest.Mocked<IErrorHandler>;
  
  return mockHandler;
}

/**
 * Create a mock validation service
 */
export function createMockValidationService() {
  return {
    validate: jest.fn().mockReturnValue({ isValid: true, errors: [], validatedData: {} }),
    validateField: jest.fn(),
    registerType: jest.fn(),
    registerRule: jest.fn(),
    createSchema: jest.fn(),
    sanitize: jest.fn().mockImplementation((data) => data)
  } as unknown as jest.Mocked<IValidationService>;
}

/**
 * Create a mock user repository
 */
export function createMockUserRepository() {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCriteria: jest.fn(),
    findOneByCriteria: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    transaction: jest.fn().mockImplementation(async (callback) => await callback({ } as any)),
    bulkUpdate: jest.fn(),
    findByEmail: jest.fn(),
    findByName: jest.fn(),
    findUsers: jest.fn(),
    searchUsers: jest.fn(),
    updatePassword: jest.fn(),
    getUserActivity: jest.fn(),
    logActivity: jest.fn(),
    hardDelete: jest.fn()
  } as unknown as jest.Mocked<IUserRepository>;
}

/**
 * Create a mock customer repository
 */
export function createMockCustomerRepository() {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCriteria: jest.fn(),
    findOneByCriteria: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    transaction: jest.fn().mockImplementation(async (callback) => await callback({ } as any)),
    bulkUpdate: jest.fn(),
    findSimilarCustomers: jest.fn(),
    searchCustomers: jest.fn(),
    findByIdWithRelations: jest.fn(),
    createCustomerLog: jest.fn(),
    hardDelete: jest.fn(),
    getCustomerLogs: jest.fn()
  } as unknown as jest.Mocked<ICustomerRepository>;
}

/**
 * Create a mock notification repository
 */
export function createMockNotificationRepository() {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCriteria: jest.fn(),
    findOneByCriteria: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    transaction: jest.fn().mockImplementation(async (callback) => await callback({ } as any)),
    bulkUpdate: jest.fn(),
    markAsRead: jest.fn(),
    createBulk: jest.fn(),
    getCountsByType: jest.fn(),
    deleteAllRead: jest.fn(),
    deleteOld: jest.fn()
  } as unknown as jest.Mocked<INotificationRepository>;
}

/**
 * Create a mock refresh token repository
 */
export function createMockRefreshTokenRepository() {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCriteria: jest.fn(),
    findOneByCriteria: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    transaction: jest.fn().mockImplementation(async (callback) => await callback({ } as any)),
    bulkUpdate: jest.fn(),
    findByToken: jest.fn(),
    findByUserId: jest.fn(),
    deleteToken: jest.fn(),
    deleteAllForUser: jest.fn(),
    deleteExpired: jest.fn(),
    rotateToken: jest.fn()
  } as unknown as jest.Mocked<IRefreshTokenRepository>;
}

/**
 * Create a mock request object
 */
export function createMockRequest(options: {
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: any;
  user?: { id: number; role: string; email?: string; name?: string };
  ip?: string;
  headers?: Record<string, any>;
  originalUrl?: string;
  path?: string;
  method?: string;
} = {}) {
  return {
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    user: options.user,
    ip: options.ip || '127.0.0.1',
    headers: {
      authorization: options.user ? `Bearer test-token` : undefined,
      'content-type': 'application/json',
      ...options.headers
    },
    originalUrl: options.originalUrl || '/test',
    path: options.path || '/test',
    method: options.method || 'GET'
  };
}

/**
 * Create a mock response object
 */
export function createMockResponse() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn().mockReturnValue(''),
    statusCode: 200,
    locals: {}
  };
  
  return res;
}

/**
 * Create a mock next function
 */
export function createMockNext() {
  return jest.fn();
}
