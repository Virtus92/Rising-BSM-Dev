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
    
    // Mark notification as read directly using Repository pattern
    // This avoids the Symbol exports error in the getById method
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
