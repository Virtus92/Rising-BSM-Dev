/**
 * API route for specific notification operations
 */
import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/infrastructure/services/NotificationService';
import { authMiddleware } from '../../auth/middleware/authMiddleware';
import { responseFormatter } from '@/infrastructure/api/response-formatter';
import { routeHandler } from '@/infrastructure/api/route-handler';

/**
 * GET /api/notifications/[id]
 * Get specific notification by id
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return routeHandler(async () => {
    // Authentication check
    const session = await authMiddleware(req);
    if (!session || !session.user) {
      return NextResponse.json(
        responseFormatter.error('Unauthorized'),
        { status: 401 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        responseFormatter.error('Invalid notification ID'),
        { status: 400 }
      );
    }

    const notificationService = new NotificationService();
    const notification = await notificationService.getNotificationById(id);

    if (!notification) {
      return NextResponse.json(
        responseFormatter.error('Notification not found'),
        { status: 404 }
      );
    }

    // Check if notification belongs to the current user
    if (notification.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        responseFormatter.error('Access denied'),
        { status: 403 }
      );
    }

    return NextResponse.json(
      responseFormatter.success(notification)
    );
  });
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return routeHandler(async () => {
    // Authentication check
    const session = await authMiddleware(req);
    if (!session || !session.user) {
      return NextResponse.json(
        responseFormatter.error('Unauthorized'),
        { status: 401 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        responseFormatter.error('Invalid notification ID'),
        { status: 400 }
      );
    }

    const notificationService = new NotificationService();
    
    // Check if notification belongs to the current user
    const notification = await notificationService.getNotificationById(id);
    if (!notification) {
      return NextResponse.json(
        responseFormatter.error('Notification not found'),
        { status: 404 }
      );
    }
    
    if (notification.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        responseFormatter.error('Access denied'),
        { status: 403 }
      );
    }

    await notificationService.deleteNotification(id);

    return NextResponse.json(
      responseFormatter.success({ success: true })
    );
  });
}
