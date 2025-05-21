// Mock Next.js modules first before any imports
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data) => ({ data })),
    next: jest.fn()
  }
}));

// Mock the response formatter
jest.mock('../formatting/response-formatter', () => ({
  formatResponse: {
    error: jest.fn().mockImplementation((error, statusCode, code, details) => {
      return { 
        success: false, 
        message: typeof error === 'string' ? error : error.message, 
        error: { code: code || 'ERROR' } 
      };
    }),
    unauthorized: jest.fn().mockImplementation((message, details) => {
      return { 
        success: false, 
        message, 
        error: { code: 'UNAUTHORIZED' } 
      };
    }),
    forbidden: jest.fn().mockImplementation((message, details) => {
      return { 
        success: false, 
        message, 
        error: { code: 'FORBIDDEN' } 
      };
    })
  }
}));

// Mock the logger
jest.mock('@/core/logging', () => ({
  getLogger: jest.fn().mockReturnValue({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  })
}));

import { getErrorHandler } from '../error-handler';
import { AuthErrorType } from '@/types/types/auth';
import {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  PermissionError,
  ConflictError,
  BadRequestError
} from '../types/AppError';

describe('ErrorHandler', () => {
  let errorHandler: any;

  beforeEach(() => {
    // Get a fresh instance of the error handler
    errorHandler = getErrorHandler();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createError', () => {
    it('should create a generic AppError with default values', () => {
      const error = errorHandler.createError('Test error');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe('INTERNAL_ERROR');
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.details).toBeUndefined();
    });
    
    it('should create a generic AppError with custom values', () => {
      const error = errorHandler.createError('Custom error', 400, 'CUSTOM_ERROR', { test: true });
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('CUSTOM_ERROR');
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.details).toEqual({ test: true });
    });
  });
  
  describe('createValidationError', () => {
    it('should create a ValidationError with default values', () => {
      const error = errorHandler.createValidationError('Validation failed');
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toBeUndefined();
    });
    
    it('should create a ValidationError with error details as array', () => {
      const errors = ['Field is required', 'Value is invalid'];
      const error = errorHandler.createValidationError('Validation failed', errors);
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Validation failed');
      expect(error.details).toEqual(errors);
    });
    
    it('should create a ValidationError with error details as record', () => {
      const errors = { name: ['Name is required'] };
      const error = errorHandler.createValidationError('Validation failed', errors);
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Validation failed');
      expect(error.details).toEqual(errors);
    });
    
    it('should create a ValidationError with custom error code', () => {
      const error = errorHandler.createValidationError('Validation failed', [], 'CUSTOM_VALIDATION');
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errorCode).toBe('CUSTOM_VALIDATION');
      expect(error.code).toBe('CUSTOM_VALIDATION');
    });
  });
  
  describe('createNotFoundError', () => {
    it('should create a NotFoundError with default values', () => {
      const error = errorHandler.createNotFoundError('Resource not found');
      
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('NOT_FOUND');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.details).toBeUndefined();
    });
    
    it('should create a NotFoundError with custom values', () => {
      const error = errorHandler.createNotFoundError('Product not found', 'PRODUCT_NOT_FOUND', { id: 123 });
      
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Product not found');
      expect(error.errorCode).toBe('PRODUCT_NOT_FOUND');
      expect(error.code).toBe('PRODUCT_NOT_FOUND');
      expect(error.details).toEqual({ id: 123 });
    });
  });
  
  describe('createUnauthorizedError', () => {
    it('should create an AuthenticationError with default values', () => {
      const error = errorHandler.createUnauthorizedError('Authentication required');
      
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('UNAUTHORIZED');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.details).toBeUndefined();
    });
    
    it('should create an AuthenticationError with custom values', () => {
      const error = errorHandler.createUnauthorizedError('Login required', 'LOGIN_REQUIRED', { redirect: '/login' });
      
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Login required');
      expect(error.errorCode).toBe('LOGIN_REQUIRED');
      expect(error.code).toBe('LOGIN_REQUIRED');
      expect(error.details).toEqual({ redirect: '/login' });
    });
  });
  
  describe('createForbiddenError', () => {
    it('should create a PermissionError with default values', () => {
      const error = errorHandler.createForbiddenError('Access denied');
      
      expect(error).toBeInstanceOf(PermissionError);
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe('FORBIDDEN');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.details).toBeUndefined();
    });
    
    it('should create a PermissionError with custom values', () => {
      const error = errorHandler.createForbiddenError('Admin access required', 'ADMIN_REQUIRED', { role: 'user' });
      
      expect(error).toBeInstanceOf(PermissionError);
      expect(error.message).toBe('Admin access required');
      expect(error.errorCode).toBe('ADMIN_REQUIRED');
      expect(error.code).toBe('ADMIN_REQUIRED');
      expect(error.details).toEqual({ role: 'user' });
    });
  });
  
  describe('createConflictError', () => {
    it('should create a ConflictError with default values', () => {
      const error = errorHandler.createConflictError('Resource already exists');
      
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.errorCode).toBe('CONFLICT');
      expect(error.code).toBe('CONFLICT');
      expect(error.details).toBeUndefined();
    });
    
    it('should create a ConflictError with custom values', () => {
      const error = errorHandler.createConflictError('Email already in use', 'EMAIL_IN_USE', { email: 'test@example.com' });
      
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('Email already in use');
      expect(error.errorCode).toBe('EMAIL_IN_USE');
      expect(error.code).toBe('EMAIL_IN_USE');
      expect(error.details).toEqual({ email: 'test@example.com' });
    });
  });
  
  describe('createBadRequestError', () => {
    it('should create a BadRequestError with default values', () => {
      const error = errorHandler.createBadRequestError('Invalid request');
      
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Invalid request');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('BAD_REQUEST');
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.details).toBeUndefined();
    });
    
    it('should create a BadRequestError with custom values', () => {
      const error = errorHandler.createBadRequestError('Missing parameters', 'MISSING_PARAMS', { params: ['id'] });
      
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Missing parameters');
      expect(error.errorCode).toBe('MISSING_PARAMS');
      expect(error.code).toBe('MISSING_PARAMS');
      expect(error.details).toEqual({ params: ['id'] });
    });
  });
  
  describe('handleDatabaseError', () => {
    it('should handle Prisma not found errors', () => {
      const prismaError = new Error('Record not found');
      (prismaError as any).code = 'P2025';
      
      const result = errorHandler.handleDatabaseError(prismaError);
      
      expect(result).toBeInstanceOf(NotFoundError);
      expect(result.message).toBe('Resource not found');
      expect(result.statusCode).toBe(404);
    });
    
    it('should handle Prisma unique constraint errors', () => {
      const prismaError = new Error('Unique constraint violation');
      (prismaError as any).code = 'P2002';
      
      const result = errorHandler.handleDatabaseError(prismaError);
      
      expect(result).toBeInstanceOf(ConflictError);
      expect(result.message).toBe('Duplicate record');
      expect(result.statusCode).toBe(409);
    });
    
    it('should handle Prisma foreign key constraint errors', () => {
      const prismaError = new Error('Foreign key constraint failed');
      (prismaError as any).code = 'P2003';
      
      const result = errorHandler.handleDatabaseError(prismaError);
      
      expect(result).toBeInstanceOf(ConflictError);
      expect(result.message).toBe('Referenced record not found');
      expect(result.statusCode).toBe(409);
    });
    
    it('should return AppError for unknown database errors', () => {
      const unknownError = new Error('Unknown database error');
      
      const result = errorHandler.handleDatabaseError(unknownError);
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Unknown database error');
      expect(result.statusCode).toBe(500);
      expect(result.errorCode).toBe('DATABASE_ERROR');
      expect(result.code).toBe('DATABASE_ERROR');
    });
    
    it('should return existing error if it already has statusCode', () => {
      const appError = new AppError('Existing error', 418, 'TEAPOT');
      
      const result = errorHandler.handleDatabaseError(appError);
      
      expect(result).toBe(appError);
    });
  });
  
  describe('mapError', () => {
    it('should return AppError if already an AppError', () => {
      const appError = new AppError('Existing error', 418, 'TEAPOT');
      
      const result = errorHandler.mapError(appError);
      
      expect(result).toBe(appError);
    });
    
    it('should map auth error with AUTH_REQUIRED type', () => {
      const authError = {
        type: AuthErrorType.AUTH_REQUIRED,
        message: 'Login required'
      };
      
      const result = errorHandler.mapError(authError);
      
      expect(result).toBeInstanceOf(AuthenticationError);
      expect(result.message).toBe('Login required');
      expect(result.statusCode).toBe(401);
    });
    
    it('should map auth error with PERMISSION_DENIED type', () => {
      const authError = {
        type: AuthErrorType.PERMISSION_DENIED,
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED',
        details: { role: 'user' }
      };
      
      const result = errorHandler.mapError(authError);
      
      expect(result).toBeInstanceOf(PermissionError);
      expect(result.message).toBe('Admin access required');
      expect(result.statusCode).toBe(403);
      expect(result.errorCode).toBe('ADMIN_REQUIRED');
      expect(result.details).toEqual({ role: 'user' });
    });
    
    it('should map generic Error to AppError', () => {
      const genericError = new Error('Something went wrong');
      
      const result = errorHandler.mapError(genericError);
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Something went wrong');
      expect(result.statusCode).toBe(500);
      expect(result.errorCode).toBe('INTERNAL_SERVER_ERROR');
    });
    
    it('should handle non-Error objects', () => {
      const nonError = { message: 'Not an error' };
      
      const result = errorHandler.mapError(nonError);
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('An error occurred');
    });
    
    it('should handle primitive values', () => {
      const result = errorHandler.mapError('String error');
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('An error occurred');
    });
  });
});