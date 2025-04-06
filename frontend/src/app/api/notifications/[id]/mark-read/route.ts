import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { INotificationService } from '@/lib/server/interfaces/INotificationService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * POST /api/notifications/[id]/mark-read
 * Markiert eine bestimmte Benachrichtigung als gelesen
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const notificationService = container.resolve<INotificationService>('NotificationService');
    
    // Benachrichtigungs-ID aus der URL extrahieren
    const urlParts = req.url.split('/');
    const id = parseInt(urlParts[urlParts.length - 2]);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Benachrichtigungs-ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    // Benachrichtigung abrufen, um zu prüfen, ob sie dem Benutzer gehört
    const notification = await notificationService.findById(id);
    
    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          error: 'Benachrichtigung nicht gefunden',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 404 }
      );
    }
    
    // Prüfen, ob die Benachrichtigung dem Benutzer gehört oder der Benutzer Admin ist
    if (notification.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unzureichende Berechtigungen',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 403 }
      );
    }
    
    // Benachrichtigung als gelesen markieren
    const count = await notificationService.markAsRead([id]);
    
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
