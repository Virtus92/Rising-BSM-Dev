import { jest } from '@jest/globals';
import { 
  ErrorHandler 
} from '../../../src/core/ErrorHandler';
import { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError,
  ErrorResponse 
} from '../../../src/interfaces/IErrorHandler';
import { ILoggingService } from '../../../src/interfaces/ILoggingService';

// Mock ILoggingService
const mockLoggingService = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
} as unknown as ILoggingService;

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Create error handler with stack traces enabled (dev/test mode)
    errorHandler = new ErrorHandler(mockLoggingService, true);
  });
  
  describe('createError', () => {
    it('should create an AppError with default values', () => {
      // Arrange
      const message = 'Test error';
      
      // Act
      const error = errorHandler.createError(message);
      
      // Assert
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe('internal_error');
      expect(error.details).toBeUndefined();
    });
    
    it('should create an AppError with custom values', () => {
      // Arrange
      const message = 'Custom error';
      const statusCode = 400;
      const errorCode = 'custom_error';
      const details = { test: true };
      
      // Act
      const error = errorHandler.createError(message, statusCode, errorCode, details);
      
      // Assert
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(statusCode);
      expect(error.errorCode).toBe(errorCode);
      expect(error.details).toEqual(details);
    });
  });
  
  describe('createValidationError', () => {
    it('should create a ValidationError', () => {
      // Arrange
      const message = 'Validation failed';
      const errors = ['Field is required', 'Value is invalid'];
      
      // Act
      const error = errorHandler.createValidationError(message, errors);
      
      // Assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe(message);
      expect(error.errors).toEqual(errors);
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('validation_error');
    });
  });
  
  describe('createNotFoundError', () => {
    it('should create a NotFoundError', () => {
      // Arrange
      const message = 'Resource not found';
      const resource = 'user';
      
      // Act
      const error = errorHandler.createNotFoundError(message, resource);
      
      // Assert
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe(message);
      expect(error.resource).toBe(resource);
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('not_found');
    });
  });
  
  describe('createUnauthorizedError', () => {
    it('should create an UnauthorizedError', () => {
      // Arrange
      const message = 'Authentication required';
      
      // Act
      const error = errorHandler.createUnauthorizedError(message);
      
      // Assert
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('unauthorized');
    });
  });
  
  describe('createForbiddenError', () => {
    it('should create a ForbiddenError', () => {
      // Arrange
      const message = 'Access denied';
      
      // Act
      const error = errorHandler.createForbiddenError(message);
      
      // Assert
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe('forbidden');
    });
  });
  
  describe('formatError', () => {
    it('should format an AppError', () => {
      // Arrange
      const error = new AppError('Application error', 400, 'app_error', { detail: 'test' });
      
      // Act
      const response = errorHandler.formatError(error);
      
      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toBe('Application error');
      expect(response.statusCode).toBe(400);
      expect(response.errorCode).toBe('app_error');
      expect(response.timestamp).toBeDefined();
      expect(response.stack).toBeDefined();
      expect(response.details).toEqual({ detail: 'test' });
    });
    
    it('should format a ValidationError with errors array', () => {
      // Arrange
      const errors = ['Field is required', 'Value is invalid'];
      const error = new ValidationError('Validation failed', errors);
      
      // Act
      const response = errorHandler.formatError(error);
      
      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toBe('Validation failed');
      expect(response.statusCode).toBe(400);
      expect(response.errorCode).toBe('validation_error');
      expect(response.errors).toEqual(errors);
    });
    
    it('should format a standard Error', () => {
      // Arrange
      const error = new Error('Standard error');
      
      // Act
      const response = errorHandler.formatError(error);
      
      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toBe('Standard error');
      expect(response.statusCode).toBe(500);
      expect(response.errorCode).toBe('internal_error');
      expect(response.stack).toBeDefined();
    });
    
    it('should format a string error', () => {
      // Arrange
      const errorString = 'String error message';
      
      // Act
      const response = errorHandler.formatError(errorString);
      
      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toBe(errorString);
      expect(response.statusCode).toBe(500);
      expect(response.errorCode).toBe('internal_error');
    });
    
    it('should format an object error', () => {
      // Arrange
      const errorObj = { 
        message: 'Object error', 
        statusCode: 418, 
        code: 'teapot',
        stack: 'mock stack trace'
      };
      
      // Act
      const response = errorHandler.formatError(errorObj);
      
      // Assert
      expect(response.success).toBe(false);
      expect(response.message).toBe('Object error');
      expect(response.statusCode).toBe(418);
      expect(response.errorCode).toBe('teapot');
      expect(response.stack).toBe('mock stack trace');
    });
    
    it('should not include stack trace in production mode', () => {
      // Arrange
      const prodErrorHandler = new ErrorHandler(mockLoggingService, false);
      const error = new AppError('Production error', 500, 'prod_error', { detail: 'test' });
      
      // Act
      const response = prodErrorHandler.formatError(error);
      
      // Assert
      expect(response.stack).toBeUndefined();
      expect(response.details).toBeUndefined();
    });
  });
  
  describe('handleError', () => {
    it('should log and format the error', () => {
      // Arrange
      const error = new AppError('Test error', 400, 'test_error');
      const logErrorSpy = jest.spyOn(errorHandler, 'logError');
      const formatErrorSpy = jest.spyOn(errorHandler, 'formatError');
      
      // Act
      const response = errorHandler.handleError(error);
      
      // Assert
      expect(logErrorSpy).toHaveBeenCalledWith(error, undefined);
      expect(formatErrorSpy).toHaveBeenCalledWith(error);
      expect(response.message).toBe('Test error');
    });
    
    it('should add request path if available', () => {
      // Arrange
      const error = new AppError('Test error');
      const req = { path: '/api/test' };
      
      // Act
      const response = errorHandler.handleError(error, req);
      
      // Assert
      expect(response.path).toBe('/api/test');
    });
    
    it('should use originalUrl if path is not available', () => {
      // Arrange
      const error = new AppError('Test error');
      const req = { originalUrl: '/api/original' };
      
      // Act
      const response = errorHandler.handleError(error, req);
      
      // Assert
      expect(response.path).toBe('/api/original');
    });
    
    it('should send response if response object is provided', () => {
      // Arrange
      const error = new AppError('Test error', 400);
      const req = { path: '/api/test' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Act
      const response = errorHandler.handleError(error, req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(response);
    });
  });
  
  describe('logError', () => {
    it('should log AppError with appropriate level based on status code', () => {
      // Arrange
      const error500 = new AppError('Server error', 500);
      const error400 = new AppError('Client error', 400);
      const error300 = new AppError('Redirect', 300);
      
      // Act
      errorHandler.logError(error500);
      errorHandler.logError(error400);
      errorHandler.logError(error300);
      
      // Assert
      expect(mockLoggingService.error).toHaveBeenCalledWith('500 internal_error: Server error', error500, expect.any(Object));
      expect(mockLoggingService.warn).toHaveBeenCalledWith('400 internal_error: Client error', expect.any(Object));
      expect(mockLoggingService.info).toHaveBeenCalledWith('300 internal_error: Redirect', expect.any(Object));
    });
    
    it('should include request metadata if available', () => {
      // Arrange
      const error = new Error('Test error');
      const req = {
        method: 'GET',
        path: '/api/test',
        query: { filter: 'active' },
        ip: '127.0.0.1',
        user: { id: 1 }
      };
      
      // Act
      errorHandler.logError(error, req);
      
      // Assert
      expect(mockLoggingService.error).toHaveBeenCalledWith(
        'Test error',
        error,
        {
          method: 'GET',
          path: '/api/test',
          query: { filter: 'active' },
          ip: '127.0.0.1',
          userId: 1
        }
      );
    });
    
    it('should handle string errors', () => {
      // Arrange
      const errorString = 'String error message';
      
      // Act
      errorHandler.logError(errorString);
      
      // Assert
      expect(mockLoggingService.error).toHaveBeenCalledWith(
        'String error message',
        errorString,
        expect.any(Object)
      );
    });
  });
});
