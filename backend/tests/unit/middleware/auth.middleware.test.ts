// tests/unit/middleware/auth.middleware.test.ts
import { Request, Response } from 'express';
import { authenticate, isAdmin, isManager, isEmployee } from '../../../middleware/auth.middleware';
import { UnauthorizedError, ForbiddenError } from '../../../utils/errors';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Fix the import path and mock structure
jest.mock('../../../utils/jwt', () => ({
  verifyToken: jest.fn(),
  extractTokenFromHeader: jest.fn()
}));

// Import the mocked module
import * as jwtUtils from '../../../utils/jwt';

// Fix the prisma mock
const mockFindUnique = jest.fn();
jest.mock('../../../utils/prisma.utils', () => ({
  __esModule: true,
  prisma: {
    user: {
      findUnique: mockFindUnique
    }
  }
}));

describe('Authentication Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      headers: {
        authorization: 'Bearer valid-token'
      }
    };
    res = {};
    next = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
    (jwtUtils.verifyToken as jest.Mock).mockReset();
    (jwtUtils.extractTokenFromHeader as jest.Mock).mockReset();
    mockFindUnique.mockReset();
  });

  describe('authenticate middleware', () => {
    test('should authenticate valid token and attach user to request', async () => {
      // Mock JWT verification
      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ userId: 1 });
      
      // Mock user in database
      mockFindUnique.mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        status: 'aktiv'
      });

      await authenticate(req as Request, res as Response, next);

      expect(jwtUtils.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true
        }
      });
      
      expect((req as any).user).toEqual({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin'
      });
      expect(next).toHaveBeenCalled();
    });

    test('should throw UnauthorizedError if user not found or inactive', async () => {
      // Mock JWT verification
      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ userId: 1 });
      
      // Mock user not found in database
      mockFindUnique.mockResolvedValue(null);

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'UnauthorizedError',
        message: 'User inactive or not found'
      }));
    });
  });

    test('should throw UnauthorizedError if user not found or inactive', async () => {
      // Mock JWT verification
      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ userId: 1 });
      
      // Mock user not found in database
      (prismaMock.user.findUnique as jest.Mock<any>).mockResolvedValue(null);

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('isAdmin middleware', () => {
    test('should allow admin users', () => {
      (req as any).user = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      };

      isAdmin(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    test('should reject non-admin users', () => {
      (req as any).user = {
        id: 2,
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user'
      };

      isAdmin(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    test('should reject unauthenticated requests', () => {
      (req as any).user = undefined;

      isAdmin(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('isManager middleware', () => {
    test('should allow admin users', () => {
      (req as any).user = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      };

      isManager(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    test('should allow manager users', () => {
      (req as any).user = {
        id: 2,
        name: 'Manager User',
        email: 'manager@example.com',
        role: 'manager'
      };

      isManager(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    test('should reject non-manager users', () => {
      (req as any).user = {
        id: 3,
        name: 'Employee User',
        email: 'employee@example.com',
        role: 'employee'
      };

      isManager(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('isEmployee middleware', () => {
    test('should allow employee users', () => {
      (req as any).user = {
        id: 3,
        name: 'Employee User',
        email: 'employee@example.com',
        role: 'employee'
      };

      isEmployee(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    test('should allow manager and admin users', () => {
      (req as any).user = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      };

      isEmployee(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();

      (req as any).user.role = 'manager';
      isEmployee(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    test('should reject non-employee users', () => {
      (req as any).user = {
        id: 4,
        name: 'Customer User',
        email: 'customer@example.com',
        role: 'customer'
      };

      isEmployee(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });
});