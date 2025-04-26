import { NextResponse } from 'next/server';
import { auth } from '@/features/auth/api/middleware/authMiddleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';
import { getServiceFactory } from '@/core/factories';
import { INotificationService } from '@/domain/services/INotificationService';

/**
 * GET handler for fetching a notification by ID
 * @param request - Next.js request object
 * @param params - URL parameters including notification ID
 * @returns Response with notification data
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Extract ID from params
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return formatResponse.error('Invalid notification ID', 400);
    }

    // Authenticate user
    const authResult = await auth(request);
    if (!authResult.success) {
      return formatResponse.error(authResult.message || 'Authentication required', authResult.status || 401);
    }

    // Get notification service
    const serviceFactory = getServiceFactory();
    const notificationService = serviceFactory.createNotificationService();

    // Fetch notification by ID
    const notification = await notificationService.getById(id, {
      context: {
        userId: authResult.user?.id
      }
    });

    // Check if notification exists
    if (!notification) {
      return formatResponse.notFound(`Notification with ID ${id} not found`);
    }

    // Check if this notification belongs to the authenticated user
    if (notification.userId !== authResult.user?.id && authResult.user?.role !== 'admin') {
      return formatResponse.error('You do not have permission to view this notification', 403);
    }

    // Return formatted response
    return formatResponse.success(notification);
  } catch (error) {
    return formatResponse.error('An error occurred while fetching the notification', 500);
  }
}
