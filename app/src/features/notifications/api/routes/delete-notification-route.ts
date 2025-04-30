/**
 * Delete Notification Route
 * Handles deleting notifications with proper error handling
 */
import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { NotFoundError, PermissionError } from '@/core/errors/types/AppError';
import { getServiceFactory } from '@/core/factories';
import { getLogger } from '@/core/logging';
import { routeHandler } from '@/core/api/route-handler';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { apiAuth } from '@/features/auth/api/middleware';

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
export const DELETE = routeHandler(async (request: NextRequest) => {
  try {
    // Extract ID from URL path segments
    const urlParts = request.nextUrl.pathname.split('/');
    const id = urlParts[urlParts.length - 1]; // Take the last segment (the id part)

    if (!id) {
      return formatResponse.error('Notification ID is required', 400);
    }
    
    // Create a context object
    const context = { auth: { userId: 0 } };
    
    // Authenticate user
    const auth = await apiAuth(request);
    if (!auth) {
      return formatResponse.error('Authentication required', 401);
    }
    
    // Set the authenticated user ID in context
    if (auth.user?.id) {
      context.auth.userId = auth.user.id;
    }
    
    // Call handler with ID and context
    const result = await deleteNotificationHandler(request, { id }, context);
    return formatResponse.success(result, 'Notification deleted successfully');
  } catch (error) {
    return formatResponse.error('An error occurred while deleting the notification', 500);
  }
});
