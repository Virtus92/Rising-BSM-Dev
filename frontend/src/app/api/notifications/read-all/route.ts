/**
 * API route for marking all notifications as read
 */
import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/infrastructure/services/NotificationService';
import { authMiddleware } from '../../auth/middleware/authMiddleware';
import { responseFormatter } from '@/infrastructure/api/response-formatter';
import { routeHandler } from '@/infrastructure/api/route-handler';

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
export async function PUT(req: NextRequest) {
  return routeHandler(async () => {
    // Authentication check
    const session = await authMiddleware(req);
    if (!session || !session.user) {
      return NextResponse.json(
        responseFormatter.error('Unauthorized'),
        { status: 401 }
      );
    }

    const notificationService = new NotificationService();
    const result = await notificationService.markAllAsRead(session.user.id);

    return NextResponse.json(
      responseFormatter.success({ count: result })
    );
  });
}
