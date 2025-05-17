import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';
import { getNotificationService } from '@/core/factories/serviceFactory.server';

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
export const PUT = routeHandler(async (request: NextRequest) => {
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
