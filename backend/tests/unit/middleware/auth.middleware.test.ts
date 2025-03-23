import { Request, Response } from 'express';
import { authenticate, isAdmin, isManager } from '../../../middleware/auth.middleware.js';
import { verifyToken, extractTokenFromHeader } from '..//../../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '..//../../utils/errors';
import prisma from '../../../utils/prisma.utils.js';

// Mock dependencies
jest.mock('../utils/jwt', () => ({
  verifyToken: jest.fn(),
  extractTokenFromHeader: jest.fn()
}));

jest.mock('../utils/prisma.utils', () => ({
  user: {
    findUnique: jest.fn()
  }
}));

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {
        authorization: 'Bearer valid-token'
      }
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should call next function when token is valid and user exists', async () => {
      // Arrange
      (extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');
      (verifyToken as jest.Mock).mockReturnValue({ userId: 1 });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        status: 'aktiv'
      });

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(extractTokenFromHeader).toHaveBeenCalledWith('Bearer valid-token');
      expect(verifyToken).toHaveBeenCalledWith('valid-token');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true
        }
      });
      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).user).toEqual({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin'
      });
    });

    it('should call next with UnauthorizedError when token is missing', async () => {
      // Arrange
      mockRequest.headers = {};
      (extractTokenFromHeader as jest.Mock).mockReturnValue(null);

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(nextFunction.mock.calls[0][0].message).toBe('Authentication required');
    });

    it('should call next with UnauthorizedError when user is not found', async () => {
      // Arrange
      (extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');
      (verifyToken as jest.Mock).mockReturnValue({ userId: 1 });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(nextFunction.mock.calls[0][0].message).toBe('User inactive or not found');
    });

    it('should call next with UnauthorizedError when user is inactive', async () => {
      // Arrange
      (extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');
      (verifyToken as jest.Mock).mockReturnValue({ userId: 1 });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        status: 'inaktiv'
      });

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(nextFunction.mock.calls[0][0].message).toBe('User inactive or not found');
    });
  });

  describe('isAdmin', () => {
    it('should call next function when user is admin', () => {
      // Arrange
      mockRequest.user = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      };

      // Act
      isAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction.mock.calls[0][0]).toBeUndefined();
    });

    it('should call next with ForbiddenError when user is not admin', () => {
      // Arrange
      mockRequest.user = {
        id: 2,
        name: 'Regular User',
        email: 'user@example.com',
        role: 'mitarbeiter'
      };

      // Act
      isAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(nextFunction.mock.calls[0][0].message).toBe('Admin privileges required');
    });

    it('should call next with UnauthorizedError when user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      isAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(nextFunction.mock.calls[0][0].message).toBe('Authentication required');
    });
  });

  describe('isManager', () => {
    it('should call next function when user is admin', () => {
      // Arrange
      mockRequest.user = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      };

      // Act
      isManager(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction.mock.calls[0][0]).toBeUndefined();
    });

    it('should call next function when user is manager', () => {
      // Arrange
      mockRequest.user = {
        id: 2,
        name: 'Manager User',
        email: 'manager@example.com',
        role: 'manager'
      };

      // Act
      isManager(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction.mock.calls[0][0]).toBeUndefined();
    });

    it('should call next with ForbiddenError when user is not admin or manager', () => {
      // Arrange
      mockRequest.user = {
        id: 3,
        name: 'Regular User',
        email: 'user@example.com',
        role: 'mitarbeiter'
      };

      // Act
      isManager(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(nextFunction.mock.calls[0][0].message).toBe('Manager privileges required');
    });

    it('should call next with UnauthorizedError when user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      isManager(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(nextFunction.mock.calls[0][0].message).toBe('Authentication required');
    });
  });
});