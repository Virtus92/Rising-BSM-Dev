import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../../../utils/errors';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { MockProxy, mockDeep } from 'jest-mock-extended';

const mockFindUnique = jest.fn();


const mockPrisma = mockDeep<PrismaClient>();
mockPrisma.user.findUnique.mockResolvedValue(null);

// Mock imports 
jest.mock('../../../utils/jwt', () => ({
  verifyToken: jest.fn(),
  extractTokenFromHeader: jest.fn()
}));

import { prismaMock } from '../../mocks/prisma.mock';

jest.mock('../../../utils/prisma.utils', () => ({
  __esModule: true,
  prisma: {
    user: {
      findUnique: mockFindUnique
    }
  },
  default: jest.fn(() => ({ user: { findUnique: mockFindUnique } }))
}));

// Now import the modules after the mocks are set up
import { authenticate, isAdmin, isManager, isEmployee } from '../../../middleware/auth.middleware';
import * as jwtUtils from '../../../utils/jwt';

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
      
      // Mock user in database - use mockImplementation for stable TypeScript
      await mockFindUnique.mockImplementation(() => Promise.resolve({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        status: 'aktiv'
      }));

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
      
      // Fix: Properly resolve the promise with null
      mockFindUnique.mockResolvedValue(null);

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