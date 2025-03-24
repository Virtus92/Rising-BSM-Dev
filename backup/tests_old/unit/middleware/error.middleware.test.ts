import { Request, Response } from 'express';
import { errorHandler, notFoundHandler } from '../../../middleware/error.middleware';
import { AppError, ValidationError } from '../../../utils/errors';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import config from '../../../config';

describe('Error Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  
  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/test'
    };
    
    // Fix response mock with type assertions
    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any
    };
    
    next = jest.fn();
    
    // Spy on console.error to silence it during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('errorHandler', () => {
    test('should handle AppError correctly', () => {
      const error = new AppError('Test error', 400);
      
      errorHandler(error, req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Test error',
        statusCode: 400
      }));
    });
    
    test('should handle ValidationError with validation errors', () => {
      const error = new ValidationError('Validation failed', ['Field is required']);
      
      errorHandler(error, req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Validation failed',
        errors: ['Field is required']
      }));
    });
    
    test('should default to 500 status for generic errors', () => {
      const error = new Error('Something went wrong');
      
      errorHandler(error, req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Something went wrong'
      }));
    });

    test('should use default message when error.message is empty', () => {
      const error = new Error();
      error.message = '';
      
      errorHandler(error, req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'An unexpected error occurred',
        statusCode: 500
      }));
    });
    
    test('should log stack trace in development environment', () => {
      // Save original value
      const originalIsDevValue = config.IS_DEVELOPMENT;
      
      // Mock config for development
      Object.defineProperty(config, 'IS_DEVELOPMENT', {
        value: true,
        configurable: true
      });
      
      const error = new Error('Test error');
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      errorHandler(error, req as Request, res as Response, next);
      
      // Verify stack trace was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack);
      
      // Restore original value
      Object.defineProperty(config, 'IS_DEVELOPMENT', {
        value: originalIsDevValue,
        configurable: true
      });
    });
    
    test('should not log stack trace in production environment', () => {
      // Save original value
      const originalIsDevValue = config.IS_DEVELOPMENT;
      
      // Mock config for production
      Object.defineProperty(config, 'IS_DEVELOPMENT', {
        value: false,
        configurable: true
      });
      
      const error = new Error('Test error');
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      errorHandler(error, req as Request, res as Response, next);
      
      // Check that stack trace was not logged
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(error.stack);
      
      // Restore original value
      Object.defineProperty(config, 'IS_DEVELOPMENT', {
        value: originalIsDevValue,
        configurable: true
      });
    });
  });
  
  describe('notFoundHandler', () => {
    test('should create 404 error and pass to next middleware', () => {
      notFoundHandler(req as Request, res as Response, next);
      
      // Safe type assertion - check that next was called
      expect(next).toHaveBeenCalled();
      
      // Get the error and check properties safely
      const error = next.mock.calls[0][0];
      expect(error instanceof AppError).toBe(true);
      
      // Now that we've verified it's an AppError, we can check properties
      const appError = error as AppError;
      expect(appError.statusCode).toBe(404);
      expect(appError.message).toContain('Resource not found: GET /test');
    });
  });
});