import { NextResponse } from 'next/server';
import { auth } from '@/features/auth/api/middleware/authMiddleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';
import { getServiceFactory } from '@/core/factories';
import { INotificationService } from '@/domain/services/INotificationService';

/**
 * PATCH handler for marking all notifications as read
 * @param request - Next.js request object
 * @returns Response with success status and count of updated notifications
 */
export async function PATCH(request: Request) {
  try {
    // Authenticate user
    const authResult = await auth(request);
    if (!authResult.success) {
      return formatResponse.error(authResult.message || 'Authentication required', authResult.status || 401);
    }

    // Ensure user ID exists
    if (!authResult.user?.id) {
      return formatResponse.error('User ID not found', 401);
    }

    // Get notification service
    const serviceFactory = getServiceFactory();
    const notificationService = serviceFactory.createNotificationService();

    // Mark all notifications as read for the authenticated user
    const result = await notificationService.markAllAsRead(authResult.user.id, {
      context: {
        userId: authResult.user.id
      }
    });

    // Return formatted response
    return formatResponse.success(result, `${result.count} notifications marked as read`);
  } catch (error) {
    return formatResponse.error('An error occurred while marking notifications as read', 500);
  }
}
