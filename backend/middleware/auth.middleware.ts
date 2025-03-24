/**
 * Authentication Middleware
 * 
 * Middleware for handling authentication and authorization.
 * Verifies JWT tokens, attaches user to request, and implements role-based access control.
 */
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/security.utils.js';
import { UnauthorizedError, ForbiddenError } from '../utils/error.utils.js';
import { AuthenticatedRequest, AuthUser } from '../types/common/types.js';
import { prisma } from '../utils/prisma.utils.js';
import logger from '../utils/logger.js';

/**
 * Extracts JWT token from Authorization header
 * @param req HTTP request
 * @returns JWT token or null
 */
function extractTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

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
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Verify token
    try {
      const payload = verifyToken(token);
      
      // Verify user in database if configured to do so
      if (process.env.VERIFY_JWT_USER_IN_DB === 'true') {
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
          throw new UnauthorizedError('User account is inactive');
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
        throw new ForbiddenError('Insufficient permissions');
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
      const ownerId = await idProvider(resourceId);
      
      if (ownerId === null) {
        throw new UnauthorizedError('Resource not found');
      }
      
      // Check if user is owner
      if (ownerId !== authReq.user.id) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  authenticate,
  authorize,
  isAdmin,
  isManager,
  isResourceOwner
};