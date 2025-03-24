/**
 * Notification Routes
 * 
 * Route definitions for notification operations with validation.
 * @module routes/notification
 */
import { Router } from 'express';
import { 
  getNotifications,
  markNotificationsRead,
  getNotificationStats,
  deleteNotification
} from '../controller/notification.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  markNotificationReadSchema,
  notificationQuerySchema
} from '../types/dtos/notification.dto.js';

// Create router
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management
 */

/**
 * @route GET /api/v1/notifications
 * @description Get user notifications
 * @access Private
 */
router.get('/', validateQuery(notificationQuerySchema), getNotifications);

/**
 * @route GET /api/v1/notifications/stats
 * @description Get notification statistics
 * @access Private
 */
router.get('/stats', getNotificationStats);

/**
 * @route PUT /api/v1/notifications/read
 * @description Mark notifications as read
 * @access Private
 */
router.put('/read', validateBody(markNotificationReadSchema), markNotificationsRead);

/**
 * @route DELETE /api/v1/notifications/:id
 * @description Delete a notification
 * @access Private
 */
router.delete('/:id', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Notification ID is required',
      type: 'Notification ID must be a number'
    }
  }
}), deleteNotification);

export default router;