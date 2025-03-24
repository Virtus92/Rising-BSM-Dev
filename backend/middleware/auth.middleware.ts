/**
 * Authentication Middleware
 * 
 * Middleware for handling authentication and authorization.
 * Verifies JWT tokens, attaches user to request, and implements role-based access control.
 */
import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/security.utils.js';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../utils/error.utils.js';
import { AuthenticatedRequest } from '../types/controller.types.js';
import { prisma } from '../utils/prisma.utils.js';
import { logger } from '../utils/common.utils.js';
import config from '../config/index.js';

/**
 * Authentication middleware 
 * Validates JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Verify token
    try {
      const payload = verifyToken(token);
      
      // Verify user in database if configured to do so
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

        // Check if user exists and is active
        if (!user) {
          throw new UnauthorizedError('User not found');
        }
        
        if (user.status !== 'active') {
          throw new UnauthorizedError('User account is inactive or suspended');
        }
        
        // Attach user to request
        (req as AuthenticatedRequest).user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
      } else {
        // Attach user from token payload
        (req as AuthenticatedRequest).user = {
          id: payload.userId,
          name: payload.name || '',
          email: payload.email || '',
          role: payload.role || 'user'
        };
      }
      
      next();
    } catch (error) {
      logger.debug('Token verification failed', { error });
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid or expired token');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if user has required roles
 * @param roles Allowed roles
 * @returns Authorization middleware
 */
export const authorize = (roles: string | string[] = []) => {
  // Convert single role to array
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      // Check if request has authenticated user
      if (!authReq.user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      // If no roles specified, any authenticated user is allowed
      if (allowedRoles.length === 0) {
        return next();
      }
      
      // Check if user has one of the allowed roles
      if (!allowedRoles.includes(authReq.user.role)) {
        throw new ForbiddenError(`Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Admin authorization middleware
 * Shorthand for authorize(['admin'])
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  return authorize('admin')(req, res, next);
};

/**
 * Manager authorization middleware
 * Shorthand for authorize(['admin', 'manager'])
 */
export const isManager = (req: Request, res: Response, next: NextFunction): void => {
  return authorize(['admin', 'manager'])(req, res, next);
};

/**
 * Resource owner middleware factory
 * Creates middleware that checks if the authenticated user is the owner of the resource
 * @param paramName Name of URL parameter containing resource ID
 * @param idProvider Function to get owner ID from resource
 * @returns Resource ownership middleware
 */
export const isResourceOwner = (
  paramName: string,
  idProvider: (resourceId: number) => Promise<number | null>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      // Check if request has authenticated user
      if (!authReq.user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      // Admin users bypass ownership check
      if (authReq.user.role === 'admin') {
        return next();
      }
      
      // Get resource ID from URL parameter
      const resourceId = parseInt(req.params[paramName]);
      
      if (isNaN(resourceId)) {
        throw new UnauthorizedError('Invalid resource ID');
      }
      
      // Get owner ID from resource
      try {
        const ownerId = await idProvider(resourceId);
        
        if (ownerId === null) {
          throw new NotFoundError('Resource not found');
        }
        
        // Check if user is owner
        if (ownerId !== authReq.user.id) {
          throw new ForbiddenError('You do not have permission to access this resource');
        }
        
        next();
      } catch (error) {
        if (error instanceof NotFoundError || error instanceof ForbiddenError) {
          throw error;
        }
        logger.error('Error in isResourceOwner middleware', { 
          error, 
          resourceId, 
          userId: authReq.user.id 
        });
        throw new ForbiddenError('Unable to verify resource ownership');
      }
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Self or admin middleware
 * Allows access if the user is accessing their own account or is an admin
 */
export const isSelfOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = parseInt(req.params.id);
    
    // Check if request has authenticated user
    if (!authReq.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Admin users bypass self check
    if (authReq.user.role === 'admin') {
      return next();
    }
    
    // Check if user is accessing their own account
    if (isNaN(userId) || userId !== authReq.user.id) {
      throw new ForbiddenError('You do not have permission to access this resource');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export default {
  authenticate,
  authorize,
  isAdmin,
  isManager,
  isResourceOwner,
  isSelfOrAdmin
};