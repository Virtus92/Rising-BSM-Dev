import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { Request, Response } from 'express';
import { mock, mockReset } from 'jest-mock-extended';
import { AuthMiddleware } from '../../../src/middleware/AuthMiddleware.js';
import { IErrorHandler } from '../../../src/interfaces/IErrorHandler.js';
import { ILoggingService } from '../../../src/interfaces/ILoggingService.js';

// Import the real JWT types for error classes
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

// Mock JWT module - this approach makes verify a proper Jest mock function
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  JsonWebTokenError,
  TokenExpiredError
}));

// Import the mocked module after mocking
import jwt from 'jsonwebtoken';

// Mock dependencies
const mockErrorHandler = mock<IErrorHandler>();
const mockLogger = mock<ILoggingService>();

// Constants
const JWT_SECRET = 'test-jwt-secret';
const TEST_USER_ID = 1;
const TEST_ROLE = 'admin';
const TEST_EMAIL = 'test@example.com';

// Create the middleware
let authMiddleware: AuthMiddleware;

describe('AuthMiddleware Unit Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    mockReset(mockErrorHandler);
    mockReset(mockLogger);
    
    // Reset jwt mock - using jest.mocked helper for proper typing
    jest.mocked(jwt.verify).mockClear();
    jest.mocked(jwt.verify).mockImplementation(() => ({
      sub: TEST_USER_ID,
      role: TEST_ROLE,
      email: TEST_EMAIL
    }));
    
    // Default error handler behavior
    mockErrorHandler.createUnauthorizedError.mockImplementation(message => {
      const error = new Error(message) as any;
      error.statusCode = 401;
      return error;
    });
    
    mockErrorHandler.createForbiddenError.mockImplementation(message => {
      const error = new Error(message) as any;
      error.statusCode = 403;
      return error;
    });
    
    mockErrorHandler.createError.mockImplementation((message, statusCode) => {
      const error = new Error(message) as any;
      error.statusCode = statusCode;
      return error;
    });
    
    mockErrorHandler.createNotFoundError.mockImplementation(message => {
      const error = new Error(message) as any;
      error.statusCode = 404;
      return error;
    });
    
    // Create the middleware instance
    authMiddleware = new AuthMiddleware(
      mockErrorHandler,
      mockLogger,
      JWT_SECRET
    );
  });
  
  describe('authenticate', () => {
    it('should authenticate user with valid token', async () => {
      // Arrange
      const mockReq = {
        headers: {
          authorization: 'Bearer valid-token'
        }
      } as unknown as Request;
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      // Act
      const middleware = authMiddleware.authenticate();
      await middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', JWT_SECRET);
      expect((mockReq as any).user).toHaveProperty('id', TEST_USER_ID);
      expect((mockReq as any).user).toHaveProperty('role', TEST_ROLE);
      expect((mockReq as any).user).toHaveProperty('email', TEST_EMAIL);
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should reject authentication with missing token', async () => {
      // Arrange
      const mockReq = {
        headers: {}
      } as unknown as Request;
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      // Act
      const middleware = authMiddleware.authenticate();
      await middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(mockErrorHandler.createUnauthorizedError).toHaveBeenCalledWith('Authentication required');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
    
    it('should reject authentication with malformed token', async () => {
      // Arrange
      const mockReq = {
        headers: {
          authorization: 'Malformed-token-format'
        }
      } as unknown as Request;
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      // Act
      const middleware = authMiddleware.authenticate();
      await middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(mockErrorHandler.createUnauthorizedError).toHaveBeenCalledWith('Authentication required');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
    
    it('should reject authentication with invalid token', async () => {
      // Arrange
      const mockReq = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      } as unknown as Request;
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      // Mock token verification to fail
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });
      
      // Act
      const middleware = authMiddleware.authenticate();
      await middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', JWT_SECRET);
      expect(mockErrorHandler.createUnauthorizedError).toHaveBeenCalledWith('Invalid token');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
    
    it('should reject authentication with expired token', async () => {
      // Arrange
      const mockReq = {
        headers: {
          authorization: 'Bearer expired-token'
        }
      } as unknown as Request;
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      // Clear existing mocks first
      mockErrorHandler.createUnauthorizedError.mockReset();
      mockErrorHandler.createUnauthorizedError.mockImplementation(message => {
        const error = new Error(message) as any;
        error.statusCode = 401;
        return error;
      });
      
      // Mock token verification to fail with expiration error
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });
      
      // Act
      const middleware = authMiddleware.authenticate();
      await middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('expired-token', JWT_SECRET);
      expect(mockErrorHandler.createUnauthorizedError).toHaveBeenCalledWith('Token expired');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
  
  describe('authorize', () => {
    it('should authorize user with correct role', () => {
      // Arrange
      const mockReq = {
        user: {
          id: TEST_USER_ID,
          role: TEST_ROLE,
          email: TEST_EMAIL
        }
      } as unknown as Request;
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      // Act
      const middleware = authMiddleware.authorize(['admin']);
      middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should authorize user when any role matches', () => {
      // Arrange
      const mockReq = {
        user: {
          id: TEST_USER_ID,
          role: TEST_ROLE,
          email: TEST_EMAIL
        }
      } as unknown as Request;
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      // Act
      const middleware = authMiddleware.authorize(['admin', 'manager']);
      middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should reject user with wrong role', () => {
      // Arrange
      const mockReq = {
        user: {
          id: TEST_USER_ID,
          role: 'mitarbeiter',
          email: TEST_EMAIL
        }
      } as unknown as Request;
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      // Act
      const middleware = authMiddleware.authorize(['admin', 'manager']);
      middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockErrorHandler.createForbiddenError).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
    
    it('should allow any authenticated user if no roles specified', () => {
      // Arrange
      const mockReq = {
        user: {
          id: TEST_USER_ID,
          role: 'benutzer',
          email: TEST_EMAIL
        }
      } as unknown as Request;
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      // Act
      const middleware = authMiddleware.authorize([]);
      middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should reject unauthenticated user', () => {
      // Arrange
      const mockReq = {} as Request; // No user property
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      // Act
      const middleware = authMiddleware.authorize(['admin']);
      middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockErrorHandler.createUnauthorizedError).toHaveBeenCalledWith('Authentication required');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
  
  describe('checkOwnership', () => {
    // Define the resource finder function type
    type ResourceOwnerFinder = (resourceId: number) => Promise<number | null>;
    
    // Create a mock and cast it to the function type
    const mockResourceFinder = jest.fn() as jest.MockedFunction<ResourceOwnerFinder>;
    
    beforeEach(() => {
      // Reset mock
      mockResourceFinder.mockReset();
    });
    
    it('should allow access to owner', async () => {
      // Arrange
      const mockReq = {
        user: {
          id: TEST_USER_ID,
          role: 'mitarbeiter', // Not admin to test ownership
          email: TEST_EMAIL
        },
        params: {
          resourceId: '123'
        }
      } as unknown as Request;
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      mockResourceFinder.mockResolvedValueOnce(TEST_USER_ID); // User is owner
      
      // Act
      const middleware = authMiddleware.checkOwnership('resourceId', mockResourceFinder);
      await middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockResourceFinder).toHaveBeenCalledWith(123);
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should bypass check for admin users', async () => {
      // Arrange
      const mockReq = {
        user: {
          id: TEST_USER_ID,
          role: 'admin', // Admin role
          email: TEST_EMAIL
        },
        params: {
          resourceId: '123'
        }
      } as unknown as Request;
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      // Act
      const middleware = authMiddleware.checkOwnership('resourceId', mockResourceFinder);
      await middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockResourceFinder).not.toHaveBeenCalled(); // Finder not called for admin
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should reject access for non-owner', async () => {
      // Arrange
      const mockReq = {
        user: {
          id: TEST_USER_ID,
          role: 'mitarbeiter',
          email: TEST_EMAIL
        },
        params: {
          resourceId: '123'
        }
      } as unknown as Request;
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      mockResourceFinder.mockResolvedValueOnce(999); // Different user ID
      
      // Act
      const middleware = authMiddleware.checkOwnership('resourceId', mockResourceFinder);
      await middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockResourceFinder).toHaveBeenCalledWith(123);
      expect(mockErrorHandler.createForbiddenError).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
    
    it('should return not found for non-existent resource', async () => {
      // Arrange
      const mockReq = {
        user: {
          id: TEST_USER_ID,
          role: 'mitarbeiter',
          email: TEST_EMAIL
        },
        params: {
          resourceId: '123'
        }
      } as unknown as Request;
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      mockResourceFinder.mockResolvedValueOnce(null); // Resource not found
      
      // Act
      const middleware = authMiddleware.checkOwnership('resourceId', mockResourceFinder);
      await middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockResourceFinder).toHaveBeenCalledWith(123);
      expect(mockErrorHandler.createNotFoundError).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
    
    it('should reject with invalid resource ID', async () => {
      // Arrange
      const mockReq = {
        user: {
          id: TEST_USER_ID,
          role: 'mitarbeiter',
          email: TEST_EMAIL
        },
        params: {
          resourceId: 'invalid-id' // Not a number
        }
      } as unknown as Request;
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      // Act
      const middleware = authMiddleware.checkOwnership('resourceId', mockResourceFinder);
      await middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockResourceFinder).not.toHaveBeenCalled();
      expect(mockErrorHandler.createError).toHaveBeenCalledWith('Invalid resource ID', 400);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
    
    it('should reject unauthenticated user', async () => {
      // Arrange
      const mockReq = {
        params: {
          resourceId: '123'
        }
      } as unknown as Request; // No user property
      
      const mockRes = {} as Response;
      const mockNext = jest.fn();
      
      // Act
      const middleware = authMiddleware.checkOwnership('resourceId', mockResourceFinder);
      await middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockResourceFinder).not.toHaveBeenCalled();
      expect(mockErrorHandler.createUnauthorizedError).toHaveBeenCalledWith('Authentication required');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});