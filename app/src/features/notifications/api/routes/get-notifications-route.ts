import { NextResponse } from 'next/server';
import { auth } from '@/features/auth/api/middleware/authMiddleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';
import { getServiceFactory } from '@/core/factories';
import { INotificationService } from '@/domain/services/INotificationService';
import { NotificationFilterParams } from '../models/notification-request-models';

/**
 * GET handler for fetching notifications
 * @param request - Next.js request object
 * @returns Response with notifications
 */
export async function GET(request: Request) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!, 10) : 1;
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 10;
    const userId = url.searchParams.get('userId') ? parseInt(url.searchParams.get('userId')!, 10) : undefined;
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    const search = url.searchParams.get('search') || undefined;
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortDirection = (url.searchParams.get('sortDirection') as 'asc' | 'desc') || 'desc';
    const type = url.searchParams.get('type') || undefined;

    // Authenticate user
    const authResult = await auth(request);
    if (!authResult.success) {
      return formatResponse.error(authResult.message || 'Authentication required', authResult.status || 401);
    }

    // Get the notification service
    const serviceFactory = getServiceFactory();
    const notificationService = serviceFactory.createNotificationService();

    // Create filter parameters
    const filterParams: NotificationFilterParams = {
      page,
      limit,
      userId,
      unreadOnly,
      sortBy,
      sortDirection,
      type: type as any
    };

    // Fetch notifications with filters
    const result = await notificationService.findNotifications(filterParams, {
      context: {
        userId: authResult.user?.id
      }
    });

    // Return formatted response
    return formatResponse.success(result);
  } catch (error) {
    return formatResponse.error('An error occurred while fetching notifications', 500);
  }
}
