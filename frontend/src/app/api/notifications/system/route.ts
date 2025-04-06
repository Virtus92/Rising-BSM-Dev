import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { INotificationService } from '@/lib/server/interfaces/INotificationService';
import { withRoles } from '@/lib/server/core/auth';

/**
 * POST /api/notifications/system
 * Erstellt eine System-Benachrichtigung für alle Benutzer (Nur für Admin)
 */
export const POST = withRoles(['admin'], async (req: NextRequest, user) => {
  try {
    const notificationService = container.resolve<INotificationService>('NotificationService');
    
    const data = await req.json();
    
    if (!data.title || !data.message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Titel und Nachricht sind erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const notificationData = {
      title: data.title,
      message: data.message,
      type: data.type || 'system',
      description: data.description,
      createdBy: user.id
    };
    
    const count = await notificationService.createSystemNotification(
      notificationData,
      data.roles
    );
    
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
