import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/features/auth/api/middleware/authMiddleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { getLogger } from '@/core/logging';
import { INotificationService } from '@/domain/services/INotificationService';

const logger = getLogger();

/**
 * GET handler for fetching a notification by ID
 * @param request - Next.js request object
 * @param user - Authenticated user
 * @returns Response with notification data
 */
export const GET = auth(
  async (request: NextRequest, user: any) => {
    // Extract id from URL
    const urlParts = request.url.split('/');
    const id = parseInt(urlParts[urlParts.length - 1], 10);
    try {
      // Validate the ID
      if (isNaN(id)) {
        return formatResponse.error('Invalid notification ID', 400);
      }

      // User is already authenticated through the auth middleware
      if (!user || !user.id) {
        return formatResponse.error('Authentication failed', 401);
      }

    // Get notification service
    const serviceFactory = getServiceFactory();
    const notificationService = serviceFactory.createNotificationService();

    // Fetch notification by ID
    const notification = await notificationService.getById(id, {
      context: {
        userId: user.id
      }
    });

    // Check if notification exists
    if (!notification) {
      return formatResponse.notFound(`Notification with ID ${id} not found`);
    }

    // Check if this notification belongs to the authenticated user
    if (notification.userId !== user.id && user.role !== 'admin') {
      return formatResponse.error('You do not have permission to view this notification', 403);
    }

    // Return formatted response
    return formatResponse.success(notification);
  } catch (error) {
    logger.error('Error fetching notification:', error as Error);
    return formatResponse.error(
      error instanceof Error ? error.message : 'An error occurred while fetching the notification', 
      500
    );
  }
},
// Auth middleware options
{
  requireAuth: true
});
