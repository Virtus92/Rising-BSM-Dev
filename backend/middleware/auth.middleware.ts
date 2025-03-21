import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { AuthenticatedRequest } from '../types/authenticated-request';
import prisma from '../utils/prisma.utils';
import config from '../config';

/**
 * Authentication middleware that validates JWT tokens
 * Attaches user object to request if authenticated
 */
export const authenticate = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }
    
    try {
      const payload = verifyToken(token);
      
      // Verify user in database if configured
      if (config.VERIFY_JWT_USER_IN_DB) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true
          }
        });

        if (!user || user.status !== 'aktiv') {
          throw new UnauthorizedError('User inactive or not found');
        }
        
        (req as AuthenticatedRequest).user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
      } else {
        // Use payload data directly if not verifying in DB
        (req as AuthenticatedRequest).user = {
          id: payload.userId,
          name: payload.name || '',
          email: payload.email || '',
          role: payload.role || ''
        };
      }
      
      next();
    } catch (error) {
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if the authenticated user has admin privileges
 */
export const isAdmin = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Check for admin role
    if (authReq.user.role !== 'admin') {
      throw new ForbiddenError('Admin privileges required');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if the authenticated user has manager privileges (manager or admin)
 */
export const isManager = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Check for manager or admin role
    if (authReq.user.role !== 'admin' && authReq.user.role !== 'manager') {
      throw new ForbiddenError('Manager privileges required');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if the authenticated user has employee privileges (or higher)
 */
export const isEmployee = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Check for employee, manager or admin role
    if (!['admin', 'manager', 'employee', 'mitarbeiter'].includes(authReq.user.role)) {
      throw new ForbiddenError('Employee privileges required');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};