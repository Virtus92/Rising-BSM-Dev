/**
 * Notification Controller
 * 
 * Handles API requests related to user notifications.
 * @module controllers/notification
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/controller.types.js';
import { 
  MarkNotificationReadDTO, 
  NotificationFilterDTO,
  NotificationStatsDTO 
} from '../types/dtos/notification.dto.js';
import { NotificationService } from '../services/notification.service.js';
import { ResponseFactory, processPagination } from '../utils/http.utils.js';
import { asyncHandler } from '../utils/error.utils.js';
import { inject } from '../config/dependency-container.js';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/common.utils.js';

// Create notification repository and service
const prisma = inject<PrismaClient>('PrismaClient');
const notificationRepository = new NotificationRepository(prisma);
const notificationService = new NotificationService(notificationRepository);

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Retrieves paginated list of notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NotificationResponseDTO'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 */
export const getNotifications = asyncHandler(async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const filters: NotificationFilterDTO = {
      ...(req.validatedQuery || req.query),
      userId
    };

    // Setup pagination
    const pagination = processPagination({
      page: req.query.page as string,
      limit: req.query.limit as string
    });

    // Get notifications from service
    const result = await notificationService.findAll(filters, {
      page: pagination.current,
      limit: pagination.limit
    });

    // Return paginated response
    ResponseFactory.paginated(
      res, 
      result.data, 
      {
        ...result.pagination,
        skip: (pagination.current - 1) * pagination.limit
      },
      'Notifications retrieved successfully'
    );
  } catch (error) {
    logger.error('Error getting notifications', { error, userId: req.user?.id });
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/notifications/read:
 *   put:
 *     summary: Mark notifications as read
 *     description: Mark specific notification or all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarkNotificationReadDTO'
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       description: Number of notifications marked as read
 *                 message:
 *                   type: string
 *                   example: Notifications marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
export const markNotificationsRead = asyncHandler(async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const data: MarkNotificationReadDTO = req.validatedData || req.body;

    // Mark notifications as read
    const count = await notificationService.markNotificationsRead(userId, data);

    // Return success response
    ResponseFactory.success(
      res, 
      { count }, 
      'Notifications marked as read'
    );
  } catch (error) {
    logger.error('Error marking notifications as read', { error, userId: req.user?.id, data: req.body });
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     description: Retrieves notification statistics for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/NotificationStatsDTO'
 *       401:
 *         description: Unauthorized
 */
export const getNotificationStats = asyncHandler(async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Get notification statistics
    const stats = await notificationService.getNotificationStats(userId);
    
    // Return success response
    ResponseFactory.success(
      res, 
      stats, 
      'Notification statistics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error getting notification statistics', { error, userId: req.user?.id });
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     description: Delete a specific notification for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/NotificationResponseDTO'
 *                 message:
 *                   type: string
 *                   example: Notification deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
export const deleteNotification = asyncHandler(async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const notificationId = parseInt(req.params.id);
    
    // Delete notification
    const result = await notificationService.deleteUserNotification(userId, notificationId);
    
    // Return success response
    ResponseFactory.success(
      res, 
      result, 
      'Notification deleted successfully'
    );
  } catch (error) {
    logger.error('Error deleting notification', { 
      error, 
      userId: req.user?.id, 
      notificationId: req.params.id 
    });
    next(error);
  }
});

// Import at top - circular reference issue workaround
import { NotificationRepository } from '../repositories/notification.repository.js';