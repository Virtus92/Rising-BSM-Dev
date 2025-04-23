import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getNotificationService } from '@/infrastructure/common/factories';

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
export const PUT = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get notification service
    const notificationService = getNotificationService();
    
    // Context for service calls
    const context = { userId: request.auth?.userId };
    
    // Mark all notifications as read
    if (!context.userId) {
      return formatError('Authentication required', 401);
    }
    
    const count = await notificationService.markAllAsRead(context.userId);
    
    return formatSuccess({ count }, 'All notifications marked as read');
  } catch (error) {
    logger.error('Error marking notifications as read:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.auth?.userId
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to mark notifications as read',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
