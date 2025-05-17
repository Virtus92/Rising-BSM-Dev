import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { INotificationService } from '@/domain/services/INotificationService';

/**
 * PATCH handler for marking all notifications as read
 * @param request - Next.js request object
 * @returns Response with success status and count of updated notifications
 */
export async function PATCH(request: NextRequest) {
  const authHandler = await withAuth(async (req: NextRequest, user: any) => {
    try {
      // Ensure user ID exists
      if (!user?.id) {
        return NextResponse.json(
          formatResponse.error('User ID not found', 401),
          { status: 401 }
        );
      }

      // Get notification service
      const serviceFactory = getServiceFactory();
      const notificationService = serviceFactory.createNotificationService();

      // Mark all notifications as read for the authenticated user
      const result = await notificationService.markAllAsRead(user.id, {
        context: {
          userId: user.id
        }
      });

      // Return formatted response
      return NextResponse.json(
        formatResponse.success(result, `${result.count} notifications marked as read`)
      );
    } catch (error) {
      return NextResponse.json(
        formatResponse.error('An error occurred while marking notifications as read', 500),
        { status: 500 }
      );
    }
  });
  
  return authHandler(request);
}
