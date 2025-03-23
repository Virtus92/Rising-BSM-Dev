/**
 * Notification Routes
 * 
 * Route definitions for notification operations with validation.
 */
import { Router } from 'express';
import { 
  getNotifications,
  markNotificationsRead
} from '../controllers/dashboard.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { markNotificationReadSchema } from '../types/dtos/notification.dto.js';

// Create router
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/v1/notifications
 * @description Get user notifications
 * @access Private
 */
router.get('/', getNotifications);

/**
 * @route PUT /api/v1/notifications/read
 * @description Mark notifications as read
 * @access Private
 */
router.put('/read', validateBody(markNotificationReadSchema), markNotificationsRead);

export default router;