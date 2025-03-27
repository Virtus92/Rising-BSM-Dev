import { Router, Request, Response, NextFunction } from 'express';
import { UserController } from '../controllers/UserController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { UserRole } from '../entities/User.js';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware.js';
import { userRoleAssignmentValidationSchema } from '../dtos/RoleDtos.js';
import { ValidationService } from '../core/ValidationService.js';
import { ErrorHandler } from '../core/ErrorHandler.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { DiContainer } from '../core/DiContainer.js';

/**
 * Create user routes with comprehensive access control
 * 
 * @param userController - User management controller
 * @param authMiddleware - Authentication and authorization middleware
 * @returns Configured router for user endpoints
 */
export function createUserRoutes(
  userController: UserController, 
  authMiddleware: AuthMiddleware
): Router {
  const container = DiContainer.getInstance();
  const router = Router();
  const logger = container.resolve<ILoggingService>('logger');
  const validationService = new ValidationService(logger);
  const errorHandler = new ErrorHandler(logger);
  const validationMiddleware = new ValidationMiddleware(validationService, errorHandler);

  // Middleware configurations
  const adminOnlyAccess = [
    authMiddleware.authenticate(),
    authMiddleware.authorize([UserRole.ADMIN])
  ];

  const selfOrAdminAccess = async (req: Request, res: Response, next: NextFunction) => {
    // Middleware that allows access if user is accessing own record or is admin
    const requestedUserId = parseInt(req.params.id, 10);
    const authenticatedUser = (req as any).user;

    if (
      authenticatedUser.role === UserRole.ADMIN || 
      authenticatedUser.id === requestedUserId
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Unauthorized access',
      message: 'You can only access your own user information'
    });
  };

  router.get('/:id/roles', 
    authMiddleware.authenticate(),
    authMiddleware.authorize([UserRole.ADMIN]),
    userController.getUserWithRoles
  );
  
  // Assign roles to a user
  router.post('/:id/roles', 
    authMiddleware.authenticate(),
    authMiddleware.authorize([UserRole.ADMIN]),
    validationMiddleware.validate(userRoleAssignmentValidationSchema),
    userController.assignRolesToUser
  );
  
  // Remove roles from a user
  router.delete('/:id/roles', 
    authMiddleware.authenticate(),
    authMiddleware.authorize([UserRole.ADMIN]),
    userController.removeRolesFromUser
  );
  
  // Get user permissions
  router.get('/:id/permissions', 
    authMiddleware.authenticate(),
    authMiddleware.authorize([UserRole.ADMIN]),
    userController.getUserPermissions
  );

  // Admin-only routes
  router.get('/', 
    ...adminOnlyAccess, 
    userController.getAllUsers
  );

  router.get('/search', 
    ...adminOnlyAccess, 
    userController.searchUsers
  );

  router.get('/statistics', 
    ...adminOnlyAccess, 
    userController.getUserStatistics
  );

  router.post('/', 
    ...adminOnlyAccess, 
    userController.createUser
  );

  router.post('/bulk-update', 
    ...adminOnlyAccess, 
    userController.bulkUpdateUsers
  );

  // Routes with self or admin access
  router.get('/:id', 
    authMiddleware.authenticate(),
    selfOrAdminAccess,
    userController.getUserById
  );

  router.put('/:id', 
    ...adminOnlyAccess, 
    userController.updateUser
  );

  router.delete('/:id', 
    ...adminOnlyAccess, 
    userController.deleteUser
  );

  // Specialized routes
  router.patch('/:id/status', 
    ...adminOnlyAccess, 
    userController.updateUserStatus
  );

  router.put('/:id/password', 
    authMiddleware.authenticate(),
    selfOrAdminAccess,
    userController.changePassword
  );

  return router;
}