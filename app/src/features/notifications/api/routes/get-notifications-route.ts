import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { INotificationService } from '@/domain/services/INotificationService';
import { NotificationFilterParams } from '../models/notification-request-models';
import { NotificationType } from '@/domain';

/**
 * GET handler for fetching notifications
 * @param request - Next.js request object
 * @returns Response with notifications
 */
export async function GET(request: NextRequest) {
  const authHandler = await withAuth(async (req: NextRequest, user: any) => {
    try {
      // Parse query parameters
      const url = new URL(req.url);
      const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!, 10) : 1;
      const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 10;
      const userId = url.searchParams.get('userId') ? parseInt(url.searchParams.get('userId')!, 10) : undefined;
      const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
      const search = url.searchParams.get('search') || undefined;
      const sortBy = url.searchParams.get('sortBy') || 'createdAt';
      const sortDirection = (url.searchParams.get('sortDirection') as 'asc' | 'desc') || 'desc';
      const type = url.searchParams.get('type') as NotificationType || undefined;

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
        type: type
      };

      // Fetch notifications with filters
      const result = await notificationService.findNotifications(filterParams, {
        context: {
          userId: user?.id
        }
      });

      // Return formatted response
      return NextResponse.json(formatResponse.success(result));
    } catch (error) {
      return NextResponse.json(
        formatResponse.error('An error occurred while fetching notifications', 500),
        { status: 500 }
      );
    }
  });
  
  return authHandler(request);
}
