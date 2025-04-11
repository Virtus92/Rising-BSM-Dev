/**
 * API route for notifications
 */
import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/infrastructure/services/NotificationService';
import { authMiddleware } from '../auth/middleware/authMiddleware';
import { responseFormatter } from '@/infrastructure/api/response-formatter';
import { routeHandler } from '@/infrastructure/api/route-handler';
import { NotificationFilterParamsDto } from '@/domain/dtos/NotificationDtos';

/**
 * GET /api/notifications
 * Get notifications for the current user
 */
export async function GET(req: NextRequest) {
  return routeHandler(async () => {
    // Authentication check
    const session = await authMiddleware(req);
    if (!session || !session.user) {
      return NextResponse.json(
        responseFormatter.error('Unauthorized'),
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const filterParams: NotificationFilterParamsDto = {
      userId: session.user.id,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      unreadOnly: searchParams.get('unreadOnly') === 'true'
    };

    // Get notifications for the user
    const notificationService = new NotificationService();
    const notifications = await notificationService.getNotifications(filterParams);

    // Format the date for each notification for easier display
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      formattedDate: new Date(notification.createdAt).toLocaleString()
    }));

    return NextResponse.json(
      responseFormatter.success(formattedNotifications)
    );
  });
}

/**
 * POST /api/notifications
 * Create a new notification (admin only)
 */
export async function POST(req: NextRequest) {
  return routeHandler(async () => {
    // Authentication check
    const session = await authMiddleware(req);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        responseFormatter.error('Unauthorized - Admin access required'),
        { status: 403 }
      );
    }

    // Parse request body
    const data = await req.json();
    
    // Create notification
    const notificationService = new NotificationService();
    const newNotification = await notificationService.createNotification(data);

    return NextResponse.json(
      responseFormatter.success(newNotification),
      { status: 201 }
    );
  });
}
