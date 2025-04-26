import { NextResponse } from 'next/server';
import { auth } from '@/features/auth/api/middleware/authMiddleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';
import { getServiceFactory } from '@/core/factories';
import { INotificationService } from '@/domain/services/INotificationService';

/**
 * PATCH handler for marking a notification as read
 * @param request - Next.js request object
 * @param params - URL parameters including notification ID
 * @returns Response with updated notification
 */
export async function PATCH(
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

    // Get the notification to check ownership
    const existingNotification = await notificationService.getById(id);
    if (!existingNotification) {
      return formatResponse.notFound(`Notification with ID ${id} not found`);
    }

    // Check if the user has permission to mark this notification as read
    if (existingNotification.userId !== authResult.user?.id && authResult.user?.role !== 'admin') {
      return formatResponse.error('You do not have permission to mark this notification as read', 403);
    }

    // Mark notification as read
    const updatedNotification = await notificationService.markAsRead(id, {
      context: {
        userId: authResult.user?.id
      }
    });

    // Return formatted response
    return formatResponse.success(updatedNotification, 'Notification marked as read');
  } catch (error) {
    return formatResponse.error('An error occurred while marking the notification as read', 500);
  }
}
