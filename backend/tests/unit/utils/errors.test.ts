import {
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    DatabaseError,
    ConflictError,
    BadRequestError,
    createErrorResponse
  } from '../../../utils/errors';
  import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
  
  describe('Error Utilities', () => {
    describe('AppError', () => {
      test('should create basic AppError with correct properties', () => {
        const error = new AppError('Test error', 400);
        
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(400);
        expect(error.isOperational).toBe(true);
      });
      
      test('should include details when provided', () => {
        const details = { field: 'test', reason: 'invalid' };
        const error = new AppError('Test error', 400, details);
        
        expect(error.details).toEqual(details);
      });
      
      test('should capture stack trace', () => {
        const error = new AppError('Test error', 400);
        
        expect(error.stack).toBeDefined();
      });
    });
    
    describe('ValidationError', () => {
      test('should create ValidationError with error list', () => {
        const errorList = ['Field 1 is required', 'Field 2 is invalid'];
        const error = new ValidationError('Validation failed', errorList);
        
        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.statusCode).toBe(400);
        expect(error.errors).toEqual(errorList);
      });
    });
    
    describe('NotFoundError', () => {
      test('should create NotFoundError with resource', () => {
        const error = new NotFoundError('User');
        
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe('User not found');
        expect(error.statusCode).toBe(404);
        expect(error.resource).toBe('User');
      });
    });
    
    describe('UnauthorizedError', () => {
      test('should create UnauthorizedError with default message', () => {
        const error = new UnauthorizedError();
        
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe('Unauthorized access');
        expect(error.statusCode).toBe(401);
      });
      
      test('should create UnauthorizedError with custom message', () => {
        const error = new UnauthorizedError('Invalid token provided');
        
        expect(error.message).toBe('Invalid token provided');
        expect(error.statusCode).toBe(401);
      });
    });
    
    describe('ForbiddenError', () => {
      test('should create ForbiddenError with correct status code', () => {
        const error = new ForbiddenError();
        
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(403);
      });
    });
  
    describe('DatabaseError', () => {
      test('should create DatabaseError with details', () => {
        const details = { table: 'users', operation: 'insert' };
        const error = new DatabaseError('Database operation failed', details);
        
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(500);
        expect(error.details).toEqual(details);
      });
    });
  
    describe('ConflictError', () => {
      test('should create ConflictError with correct status code', () => {
        const error = new ConflictError('Resource already exists');
        
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(409);
        expect(error.message).toBe('Resource already exists');
      });
    });
  
    describe('BadRequestError', () => {
      test('should create BadRequestError with correct status code', () => {
        const error = new BadRequestError('Invalid input');
        
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Invalid input');
      });
    });
    
    describe('createErrorResponse', () => {
      let originalNodeEnv: string | undefined;
      
      beforeEach(() => {
        originalNodeEnv = process.env.NODE_ENV;
      });
      
      afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
      });
      
      test('should format regular Error into error response', () => {
        const error = new Error('Something went wrong');
        const response = createErrorResponse(error);
        
        expect(response).toEqual(expect.objectContaining({
          success: false,
          error: 'Something went wrong',
          statusCode: 500
        }));
      });
      
      test('should use custom status code for AppError', () => {
        const error = new AppError('Bad request', 400);
        const response = createErrorResponse(error);
        
        expect(response).toEqual(expect.objectContaining({
          success: false,
          error: 'Bad request',
          statusCode: 400
        }));
      });
      
      test('should include errors array for ValidationError', () => {
        const error = new ValidationError('Validation failed', ['Error 1', 'Error 2']);
        const response = createErrorResponse(error);
        
        expect(response).toEqual(expect.objectContaining({
          success: false,
          error: 'Validation failed',
          statusCode: 400,
          errors: ['Error 1', 'Error 2']
        }));
      });
      
      test('should include details for AppError with details', () => {
        const details = { field: 'email', problem: 'duplicate' };
        const error = new AppError('Conflict', 409, details);
        const response = createErrorResponse(error);
        
        expect(response.details).toEqual(details);
      });
      
      test('should include stack trace in development', () => {
        process.env.NODE_ENV = 'development';
        
        const error = new Error('Test error');
        const response = createErrorResponse(error);
        
        expect(response.stack).toBeDefined();
      });
      
      test('should not include stack trace in production', () => {
        process.env.NODE_ENV = 'production';
        
        const error = new Error('Test error');
        const response = createErrorResponse(error);
        
        expect(response.stack).toBeUndefined();
      });
    });
  });