import { Request, NextFunction, Response } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { AuthenticatedRequest } from '../types/common/types.js';
import prisma from '../utils/prisma.utils.js';

/**
 * Authentication middleware that validates JWT tokens
 * Always verifies user in database and attaches user object to request if authenticated
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
      
      // Always verify user in database
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
      
      (req as unknown as AuthenticatedRequest).user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      
      next();
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Admin role authorization middleware
 * Requires the authenticate middleware to be called first
 */
export const isAdmin = (
  req: Request, 
  next: NextFunction
): void => {
  const user = (req as unknown as AuthenticatedRequest).user;
  
  if (!user) {
    return next(new UnauthorizedError('Authentication required'));
  }
  
  if (user.role !== 'admin') {
    return next(new ForbiddenError('Admin privileges required'));
  }
  
  next();
};

/**
 * Manager role authorization middleware
 * Requires the authenticate middleware to be called first
 */
export const isManager = (
  req: Request, 
  next: NextFunction
): void => {
  const user = (req as unknown as AuthenticatedRequest).user;
  
  if (!user) {
    return next(new UnauthorizedError('Authentication required'));
  }
  
  if (user.role !== 'admin' && user.role !== 'manager') {
    return next(new ForbiddenError('Manager privileges required'));
  }
  
  next();
};

/**
 * Resource owner middleware
 * Checks if the authenticated user is the owner of the resource
 * Allows admins to access resources regardless of ownership
 * @param paramName - Name of the parameter containing the resource ID
 * @param userIdProvider - Function to get the user ID from the resource
 */
export const isResourceOwner = (
  paramName: string,
  userIdProvider: (resourceId: number) => Promise<number | null>
) => {
  return async (
    req: Request, 
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = (req as unknown as AuthenticatedRequest).user;
      
      if (!user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      // Admins can access all resources
      if (user.role === 'admin') {
        return next();
      }
      
      const resourceId = parseInt(req.params[paramName]);
      
      if (isNaN(resourceId)) {
        throw new UnauthorizedError('Invalid resource ID');
      }
      
      const resourceUserId = await userIdProvider(resourceId);
      
      if (resourceUserId === null) {
        throw new UnauthorizedError('Resource not found');
      }
      
      if (resourceUserId !== user.id) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};