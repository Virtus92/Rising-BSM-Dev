import { Router } from 'express';
import { RoleController } from '../controllers/RoleController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { UserRole } from '../entities/User.js';
import { 
  roleCreateValidationSchema, 
  roleUpdateValidationSchema,
  permissionAssignmentValidationSchema
} from '../dtos/RoleDtos.js';

/**
 * Create role routes with comprehensive access control
 * 
 * @param roleController - Role management controller
 * @param authMiddleware - Authentication and authorization middleware
 * @param validationService - Validation service
 * @param errorHandler - Error handler
 * @returns Configured router for role endpoints
 */
export function createRoleRoutes(
  roleController: RoleController, 
  authMiddleware: AuthMiddleware,
  validationService: IValidationService,
  errorHandler: IErrorHandler
): Router {
  const router = Router();
  const validationMiddleware = new ValidationMiddleware(validationService, errorHandler);

  // Middleware configurations
  const adminOnlyAccess = [
    authMiddleware.authenticate(),
    authMiddleware.authorize([UserRole.ADMIN])
  ];

  // Role endpoints - all require admin access
  router.get('/', 
    ...adminOnlyAccess, 
    roleController.getAllRoles.bind(roleController)
  );

  router.get('/:id', 
    ...adminOnlyAccess, 
    roleController.getRoleById.bind(roleController)
  );

  router.post('/', 
    ...adminOnlyAccess, 
    validationMiddleware.validate(roleCreateValidationSchema),
    roleController.createRole.bind(roleController)
  );

  router.put('/:id', 
    ...adminOnlyAccess, 
    validationMiddleware.validate(roleUpdateValidationSchema),
    roleController.updateRole.bind(roleController)
  );

  router.delete('/:id', 
    ...adminOnlyAccess, 
    roleController.deleteRole.bind(roleController)
  );

  // Permission endpoints
  router.get('/permissions', 
    ...adminOnlyAccess, 
    roleController.getAllPermissions.bind(roleController)
  );

  router.post('/permissions', 
    ...adminOnlyAccess, 
    roleController.createPermission.bind(roleController)
  );

  router.post('/:id/permissions', 
    ...adminOnlyAccess, 
    validationMiddleware.validate(permissionAssignmentValidationSchema),
    roleController.assignPermissions.bind(roleController)
  );

  return router;
}