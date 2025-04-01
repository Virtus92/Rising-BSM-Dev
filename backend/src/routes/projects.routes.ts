import { Router } from 'express';
import { ProjectController } from '../controllers/ProjectController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { UserRole } from '../entities/User.js';
import { 
  projectCreateValidationSchema, 
  projectUpdateValidationSchema,
  projectStatusUpdateValidationSchema,
  projectNoteValidationSchema
} from '../dtos/ProjectDtos.js';

/**
 * Create project routes with comprehensive access control
 * 
 * @param projectController - Project management controller
 * @param authMiddleware - Authentication and authorization middleware
 * @param validationService - Service for validating request data
 * @param errorHandler - Service for handling errors
 * @returns Configured router for project endpoints
 */
export function createProjectRoutes(
  projectController: ProjectController, 
  authMiddleware: AuthMiddleware,
  validationService: IValidationService,
  errorHandler: IErrorHandler
): Router {
  const router = Router();
  const validationMiddleware = new ValidationMiddleware(validationService, errorHandler);

  // Middleware configurations
  const managerAndAdminAccess = [
    authMiddleware.authenticate(),
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER])
  ];

  const adminOnlyAccess = [
    authMiddleware.authenticate(),
    authMiddleware.authorize([UserRole.ADMIN])
  ];

  const authenticatedAccess = [
    authMiddleware.authenticate()
  ];

  // Statistics access
  router.get('/statistics', 
    ...managerAndAdminAccess, 
    projectController.getProjectStatistics
  );

  // Search
  router.get('/search', 
    ...authenticatedAccess, 
    projectController.searchProjects
  );

  // Active projects
  router.get('/active', 
    ...authenticatedAccess, 
    projectController.getActiveProjects
  );

  // Export projects (admin-only)
  router.get('/export', 
    ...adminOnlyAccess, 
    projectController.exportProjects
  );

  // Get projects by customer
  router.get('/customer/:customerId', 
    ...authenticatedAccess, 
    projectController.getProjectsByCustomer
  );

  // Get projects by service
  router.get('/service/:serviceId', 
    ...authenticatedAccess, 
    projectController.getProjectsByService
  );

  // Standard CRUD routes
  router.get('/', 
    ...authenticatedAccess, 
    projectController.getAllProjects
  );

  router.post('/', 
    ...managerAndAdminAccess,
    validationMiddleware.validate(projectCreateValidationSchema),
    projectController.createProject
  );

  router.get('/:id', 
    ...authenticatedAccess, 
    projectController.getProjectById
  );

  router.get('/:id/notes', 
    ...authenticatedAccess, 
    projectController.getProjectNotes
  );

  router.post('/:id/notes', 
    ...authenticatedAccess,
    validationMiddleware.validate(projectNoteValidationSchema),
    projectController.addProjectNote
  );

  router.put('/:id', 
    ...managerAndAdminAccess,
    validationMiddleware.validate(projectUpdateValidationSchema),
    projectController.updateProject
  );

  router.patch('/:id/status', 
    ...managerAndAdminAccess,
    validationMiddleware.validate(projectStatusUpdateValidationSchema),
    projectController.updateProjectStatus
  );

  router.delete('/:id', 
    ...adminOnlyAccess, 
    projectController.deleteProject
  );

  return router;
}

export default createProjectRoutes;