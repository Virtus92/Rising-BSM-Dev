/**
 * API route for marking a specific notification as read
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError, formatNotFound } from '@/core/errors/index';
import { getLogger } from '@/core/logging';
import { getNotificationService } from '@/core/factories/serviceFactory.server';

/**
 * PUT /api/notifications/[id]/read
 * Mark a notification as read
 */
export const PUT = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get notification service
    const notificationService = getNotificationService();
    
    // Extract ID from URL path segments
    const urlParts = request.nextUrl.pathname.split('/');
    const idStr = urlParts[urlParts.length - 2]; // Get the [id] part (second to last segment)
    
    // Parse notification ID
    const id = parseInt(idStr);
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
    const logger = getLogger();
    const urlParts = request.nextUrl.pathname.split('/');
    const idStr = urlParts[urlParts.length - 2]; // Get the [id] part (second to last segment)
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return formatError('Invalid notification ID', 400);
    }
    // Log the error with details
    logger.error('Error marking notification as read:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      notificationId: idStr,
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
