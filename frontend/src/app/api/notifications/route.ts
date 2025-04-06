import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { INotificationService } from '@/lib/server/interfaces/INotificationService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/notifications
 * Holt alle Benachrichtigungen für den authentifizierten Benutzer
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const notificationService = container.resolve<INotificationService>('NotificationService');
    
    // Query-Parameter extrahieren
    const { searchParams } = new URL(req.url);
    const readParam = searchParams.get('read');
    const read = readParam ? readParam === 'true' : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    const options = {
      read,
      limit,
      offset
    };
    
    const result = await notificationService.findByUser(user.id, options);
    
    return NextResponse.json({
      success: true,
      data: result.notifications,
      meta: {
        total: result.total,
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

/**
 * DELETE /api/notifications
 * Löscht alle Benachrichtigungen des aktuellen Benutzers
 */
export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const notificationService = container.resolve<INotificationService>('NotificationService');
    
    const count = await notificationService.deleteAll(user.id);
    
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
