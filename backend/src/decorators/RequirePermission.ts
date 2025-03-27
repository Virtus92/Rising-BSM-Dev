import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import container from '../core/DiContainer.js';
/**
 * RequirePermission decorator factory
 * Creates middleware that checks for required permissions
 * 
 * @param permissions - Required permission names
 * @returns Middleware function
 */
export function RequirePermission(permissions: string[]) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(req: Request, res: Response, next: NextFunction) {
      // Get the auth middleware from the container
      const authMiddleware = container.resolve<AuthMiddleware>('AuthMiddleware');
      
      // Create permission check middleware
      const permissionCheck = authMiddleware.authorizePermission(permissions);
      
      // Apply the middleware
      permissionCheck(req, res, (err?: any) => {
        if (err) {
          // If permission check fails, pass to error handler
          next(err);
        } else {
          // If permission check passes, call the original method
          return originalMethod.apply(this, [req, res, next]);
        }
      });
    };
    
    return descriptor;
  };
}