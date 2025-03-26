import { Request, Response, NextFunction } from 'express';
import { IErrorHandler, UnauthorizedError, ForbiddenError } from '../interfaces/IErrorHandler.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import jwt from 'jsonwebtoken';

/**
 * AuthMiddleware
 * 
 * Middleware for handling authentication and authorization in Express routes.
 * Verifies JWT tokens, attaches user to request, and implements role-based access control.
 */
export class AuthMiddleware {
  /**
   * Creates a new AuthMiddleware instance
   * 
   * @param errorHandler - Error handler service
   * @param logger - Logging service
   * @param jwtSecret - JWT secret key
   */
  constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly logger: ILoggingService,
    private readonly jwtSecret: string
  ) {
    this.logger.debug('Initialized AuthMiddleware');
  }

  /**
   * Authenticate user by verifying JWT token
   * 
   * @returns Express middleware function
   */
  authenticate = () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Extract token from header
        const token = this.extractTokenFromHeader(req);
        
        if (!token) {
          throw this.errorHandler.createUnauthorizedError('Authentication required');
        }
        
        // Verify token
        const payload = this.verifyToken(token);
        
        // Attach user to request
        (req as any).user = {
          id: payload.userId,
          role: payload.role,
          email: payload.email
        };
        
        next();
      } catch (error: unknown) {
        this.logger.warn('Authentication failed', { 
          path: req.path, 
          ip: req.ip, 
          error: error instanceof Error ? error.message : String(error) 
        });
        
        const authError = this.errorHandler.createUnauthorizedError(
          error instanceof Error ? error.message : 'Authentication failed'
        );
        
        next(authError);
      }
    };
  };

  /**
   * Authorize user based on roles
   * 
   * @param allowedRoles - Array of allowed roles
   * @returns Express middleware function
   */
  authorize = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        // Check if user is authenticated
        if (!(req as any).user) {
          throw this.errorHandler.createUnauthorizedError('Authentication required');
        }
        
        const userRole = (req as any).user.role;
        
        // If no roles specified, allow any authenticated user
        if (!allowedRoles.length) {
          return next();
        }
        
        // Check if user has one of the allowed roles
        if (!allowedRoles.includes(userRole)) {
          throw this.errorHandler.createForbiddenError(
            `Access denied. Required roles: ${allowedRoles.join(', ')}`
          );
        }
        
        next();
      } catch (error: unknown) {
        const authError = error instanceof Error && 
          (error instanceof UnauthorizedError || error instanceof ForbiddenError)
          ? error
          : this.errorHandler.createForbiddenError('Access denied');
        
        next(authError);
      }
    };
  };

  authorizePermission(requiredPermission: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Check if user is authenticated
        if (!(req as any).user) {
          throw new UnauthorizedError('Authentication required');
        }
        
        const user = (req as any).user;
        
        // Admin bypass - consider removing this for strict permission checks
        if (user.isAdmin) {
          return next();
        }
        
        // Check if user has the required permission
        if (!user.hasPermission(requiredPermission)) {
          throw new ForbiddenError(`Access denied. Required permission: ${requiredPermission}`);
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }
  
  // Predefined permissions
  Permissions = {
    // User management
    USER_VIEW: 'user:view',
    USER_CREATE: 'user:create',
    USER_EDIT: 'user:edit',
    USER_DELETE: 'user:delete',
    
    // Customer management
    CUSTOMER_VIEW: 'customer:view',
    CUSTOMER_CREATE: 'customer:create',
    CUSTOMER_EDIT: 'customer:edit',
    CUSTOMER_DELETE: 'customer:delete',
    
    // Notification management
    NOTIFICATION_VIEW: 'notification:view',
    NOTIFICATION_CREATE: 'notification:create',
    NOTIFICATION_EDIT: 'notification:edit',
    
    // System settings
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_EDIT: 'settings:edit',
  };

  /**
   * Verify resource ownership
   * 
   * @param paramName - Name of the route parameter containing resource ID
   * @param resourceOwnerFinder - Function to find resource owner ID
   * @returns Express middleware function
   */
  checkOwnership = (
    paramName: string,
    resourceOwnerFinder: (resourceId: number) => Promise<number | null>
  ) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Check if user is authenticated
        if (!(req as any).user) {
          throw this.errorHandler.createUnauthorizedError('Authentication required');
        }
        
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        // Admin users bypass ownership check
        if (userRole === 'admin') {
          return next();
        }
        
        // Get resource ID from URL parameter
        const resourceId = parseInt(req.params[paramName], 10);
        
        if (isNaN(resourceId)) {
          throw this.errorHandler.createError('Invalid resource ID', 400);
        }
        
        // Get owner ID using the provided function
        const ownerId = await resourceOwnerFinder(resourceId);
        
        if (ownerId === null) {
          throw this.errorHandler.createNotFoundError('Resource not found');
        }
        
        // Check if user is owner
        if (ownerId !== userId) {
          throw this.errorHandler.createForbiddenError('You do not have permission to access this resource');
        }
        
        next();
      } catch (error: unknown) {
        next(error instanceof Error ? error : this.errorHandler.createError(String(error), 500));
      }
    };
  };

  /**
   * Extract JWT token from Authorization header
   * 
   * @param req - HTTP request
   * @returns Token or null if not found
   */
  private extractTokenFromHeader(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return null;
    }
    
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  /**
   * Verify JWT token
   * 
   * @param token - JWT token
   * @returns Token payload
   */
  private verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error: unknown) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw this.errorHandler.createUnauthorizedError('Invalid token');
      } else if (error instanceof jwt.TokenExpiredError) {
        throw this.errorHandler.createUnauthorizedError('Token expired');
      } else {
        throw error;
      }
    }
  }
}

export default AuthMiddleware;