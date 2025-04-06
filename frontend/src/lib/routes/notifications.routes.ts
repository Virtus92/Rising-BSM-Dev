import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
// import { markNotificationsReadValidationSchema } from '../dtos/NotificationDtos.js';

/**
 * Create notification routes with user-specific access
 * 
 * @param notificationController - Notification management controller
 * @param authMiddleware - Authentication middleware
 * @param validationService - Service for validating request data
 * @param errorHandler - Service for handling errors
 * @returns Configured router for notification endpoints
 */
export function createNotificationRoutes(
  notificationController: NotificationController, 
  authMiddleware: AuthMiddleware,
  validationService: IValidationService,
  errorHandler: IErrorHandler
): Router {
  const router = Router();
  const validationMiddleware = new ValidationMiddleware(validationService, errorHandler);

  // Ensure all notification routes require authentication
  const authenticatedUserAccess = [
    authMiddleware.authenticate()
  ];

  // Get current user's notifications
  router.get('/', 
    ...authenticatedUserAccess, 
    notificationController.getNotifications
  );

  // Get notification statistics for current user
  router.get('/stats', 
    ...authenticatedUserAccess, 
    notificationController.getNotificationStats
  );

  // Mark notifications as read
  router.put('/read', 
    ...authenticatedUserAccess, 
    notificationController.markNotificationsRead
  );

  // Delete a specific notification
  router.delete('/:id', 
    ...authenticatedUserAccess, 
    notificationController.deleteNotification
  );

  // Example of how to add validation (uncomment and update when schemas are available)
  // router.put('/read', 
  //   ...authenticatedUserAccess, 
  //   validationMiddleware.validate(markNotificationsReadValidationSchema),
  //   notificationController.markNotificationsRead
  // );

  // Test notification (development only)
  router.post('/test', 
    ...authenticatedUserAccess, 
    notificationController.testNotification
  );

  return router;
}