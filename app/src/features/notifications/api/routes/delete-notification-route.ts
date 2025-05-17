/**
 * Delete Notification Route
 * Handles deleting notifications with proper error handling
 */
import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { NotFoundError, PermissionError } from '@/core/errors/types/AppError';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { getLogger } from '@/core/logging';
import { routeHandler } from '@/core/api/route-handler';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { auth } from '@/features/auth/api/middleware/authMiddleware';

const logger = getLogger();

/**
 * Delete notification handler
 * 
 * @param request Next.js request
 * @param params Request parameters
 * @param context Route context
 * @returns Success status and message
 */
export const deleteNotificationHandler = async (
  request: NextRequest,
  params: { id: string },
  context: { auth?: { userId?: number } }
) => {
  // Extract ID from params
  const id = parseInt(params.id, 10);
  
  if (isNaN(id)) {
    throw new Error('Invalid notification ID');
  }
  
  // User ID is available from context after auth middleware
  const userId = context.auth?.userId;
  
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // Get notification service
  const serviceFactory = getServiceFactory();
  const notificationService = serviceFactory.createNotificationService();
  
  // Check if notification exists
  const notification = await notificationService.getById(id);
  
  if (!notification) {
    throw new NotFoundError(`Notification with ID ${id} not found`);
  }
  
  // Check ownership - only allow users to delete their own notifications,
  // or users with the NOTIFICATIONS_MANAGE permission to delete any notification
  if (notification.userId !== userId) {
    // Check if user has permission to manage notifications
    const permissionService = serviceFactory.createPermissionService();
    const hasPermission = await permissionService.hasPermission(
      userId,
      SystemPermission.NOTIFICATIONS_MANAGE
    );
    
    if (!hasPermission) {
      throw new PermissionError(
        'You do not have permission to delete this notification',
        'NOTIFICATION_PERMISSION_DENIED'
      );
    }
  }
  
  // Delete notification
  const result = await notificationService.delete(id, {
    context: {
      userId
    }
  });
  
  logger.info(`Notification ${id} deleted by user ${userId}`);
  
  // Return success result
  return {
    success: true,
    id,
    message: 'Notification deleted successfully'
  };
};

/**
 * DELETE /api/notifications/:id route
 */
export const DELETE = auth(
  async (request: NextRequest, user) => {
    try {
      // Extract ID from URL path segments
      const urlParts = request.nextUrl.pathname.split('/');
      const id = urlParts[urlParts.length - 1]; // Take the last segment (the id part)

      if (!id) {
        return formatResponse.error('Notification ID is required', 400);
      }
      
      // User is already authenticated through the auth middleware
      if (!user || !user.id) {
        return formatResponse.error('Authentication failed', 401);
      }
      
      // Create a context object with user ID
      const context = { 
        auth: { 
          userId: user.id 
        } 
      };
      
      // Call handler with ID and context
      const result = await deleteNotificationHandler(request, { id }, context);
      return formatResponse.success(result, 'Notification deleted successfully');
    } catch (error) {
      logger.error('Error deleting notification:', error as Error);
      return formatResponse.error(
        error instanceof Error ? error.message : 'An error occurred while deleting the notification', 
        error instanceof NotFoundError ? 404 : 
        error instanceof PermissionError ? 403 : 500
      );
    }
  },
  // Auth middleware options
  {
    requireAuth: true,
    requiredPermission: [SystemPermission.NOTIFICATIONS_MANAGE]
  }
);
