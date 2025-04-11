/**
 * API route for marking a specific notification as read
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError, formatNotFound } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getNotificationService } from '@/infrastructure/common/factories';

/**
 * PUT /api/notifications/[id]/read
 * Mark a notification as read
 */
export const PUT = apiRouteHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const logger = getLogger();
  
  try {
    // Get notification service
    const notificationService = getNotificationService();
    
    // Parse notification ID
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return formatError('Invalid notification ID', 400);
    }
    
    // Context for service calls
    const context = { 
      userId: request.auth?.userId,
      userRole: request.auth?.role 
    };
    
    // Check if notification exists
    const notification = await notificationService.getById(id, { context });
    if (!notification) {
      return formatNotFound('Notification not found');
    }
    
    // Check ownership or admin access
    if (notification.userId !== context.userId && context.userRole !== 'ADMIN') {
      return formatError('Access denied - You do not have permission to mark this notification as read', 403);
    }
    
    // Mark notification as read
    const updatedNotification = await notificationService.markAsRead(id, { context });
    
    return formatSuccess(updatedNotification, 'Notification marked as read');
  } catch (error) {
    logger.error('Error marking notification as read:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      notificationId: params.id,
      userId: request.auth?.userId
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to mark notification as read',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
