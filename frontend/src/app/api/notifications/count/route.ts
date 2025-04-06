import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { INotificationService } from '@/lib/server/interfaces/INotificationService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/notifications/count
 * Zählt ungelesene Benachrichtigungen für den authentifizierten Benutzer
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const notificationService = container.resolve<INotificationService>('NotificationService');
    
    const count = await notificationService.countUnread(user.id);
    
    return NextResponse.json({
      success: true,
      data: {
        count
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Interner Serverfehler',
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: statusCode }
    );
  }
});
