import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IAuthService } from '@/lib/server/interfaces/IAuthService';

/**
 * POST /api/auth/forgot-password
 * Generiert ein Token für das Zurücksetzen des Passworts
 */
export async function POST(req: NextRequest) {
  try {
    const authService = container.resolve<IAuthService>('AuthService');
    
    // Daten aus dem Request extrahieren
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'E-Mail ist erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    // Token generieren
    const resetToken = await authService.generateResetToken(email);
    
    // In einer realen Anwendung würde hier eine E-Mail versendet werden
    // Für Testzwecke geben wir das Token zurück
    // In der Produktion sollte dies entfernt werden!
    return NextResponse.json({
      success: true,
      data: {
        message: 'Wenn ein Benutzerkonto mit dieser E-Mail existiert, wurde eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts gesendet.',
        // Nur für Entwicklung/Test
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
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
}
