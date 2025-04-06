import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { UserRole } from '../entities/User.js';

/**
 * Create settings routes
 * 
 * @param settingsController - Settings management controller
 * @param authMiddleware - Authentication middleware
 * @param validationService - Service for validating request data
 * @param errorHandler - Service for handling errors
 * @returns Configured router for settings endpoints
 */
export function createSettingsRoutes(
  settingsController: SettingsController, 
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

  // User settings routes - authenticated users only
  router.get('/user',
    authMiddleware.authenticate(),
    settingsController.getMySettings
  );

  router.put('/user',
    authMiddleware.authenticate(),
    settingsController.updateMySettings
  );

  // System settings routes - admin only
  router.get('/system',
    ...adminOnlyAccess,
    settingsController.getSystemSettings
  );

  router.put('/system',
    ...adminOnlyAccess,
    settingsController.updateSystemSettings
  );

  return router;
}