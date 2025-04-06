import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IAuthService } from '@/lib/server/interfaces/IAuthService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * POST /api/auth/change-password
 * Ändert das Passwort eines authentifizierten Benutzers
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const authService = container.resolve<IAuthService>('AuthService');
    
    // Daten aus dem Request extrahieren
    const { currentPassword, newPassword } = await req.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aktuelles und neues Passwort sind erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    // Passwort ändern
    const result = await authService.changePassword(user.id, currentPassword, newPassword);
    
    return NextResponse.json({
      success: result,
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
