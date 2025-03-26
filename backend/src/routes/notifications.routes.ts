import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';

/**
 * Create notification routes with user-specific access
 * 
 * @param notificationController - Notification management controller
 * @param authMiddleware - Authentication middleware
 * @returns Configured router for notification endpoints
 */
export function createNotificationRoutes(
  notificationController: NotificationController, 
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

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

  return router;
}