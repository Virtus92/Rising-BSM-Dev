import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { INotificationService } from '@/domain/services/INotificationService';

/**
 * PATCH handler for marking a notification as read
 * @param request - Next.js request object
 * @param params - URL parameters including notification ID
 * @returns Response with updated notification
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHandler = await withAuth(async (req: NextRequest, user: any) => {
    try {
      // Extract ID from params
      const id = parseInt(params.id, 10);
      if (isNaN(id)) {
        return NextResponse.json(
          formatResponse.error('Invalid notification ID', 400),
          { status: 400 }
        );
      }

      // Get notification service
      const serviceFactory = getServiceFactory();
      const notificationService = serviceFactory.createNotificationService();

      // Get the notification to check ownership
      const existingNotification = await notificationService.getById(id);
      if (!existingNotification) {
        return NextResponse.json(
          formatResponse.notFound(`Notification with ID ${id} not found`),
          { status: 404 }
        );
      }

      // Check if the user has permission to mark this notification as read
      if (existingNotification.userId !== user?.id && user?.role !== 'admin') {
        return NextResponse.json(
          formatResponse.error('You do not have permission to mark this notification as read', 403),
          { status: 403 }
        );
      }

      // Mark notification as read
      const updatedNotification = await notificationService.markAsRead(id, {
        context: {
          userId: user?.id
        }
      });

      // Return formatted response
      return NextResponse.json(
        formatResponse.success(updatedNotification, 'Notification marked as read')
      );
    } catch (error) {
      return NextResponse.json(
        formatResponse.error('An error occurred while marking the notification as read', 500),
        { status: 500 }
      );
    }
  });
  
  return authHandler(request);
}
