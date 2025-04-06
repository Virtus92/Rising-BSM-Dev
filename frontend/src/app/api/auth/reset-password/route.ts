import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IAuthService } from '@/lib/server/interfaces/IAuthService';

/**
 * POST /api/auth/reset-password
 * Setzt das Passwort eines Benutzers zurück
 */
export async function POST(req: NextRequest) {
  try {
    const authService = container.resolve<IAuthService>('AuthService');
    
    // Daten aus dem Request extrahieren
    const { token, password } = await req.json();
    
    if (!token || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token und Passwort sind erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    // Passwort zurücksetzen
    const result = await authService.resetPassword(token, password);
    
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
}
