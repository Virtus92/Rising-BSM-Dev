import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IAuthService } from '@/lib/server/interfaces/IAuthService';
import { withRoles } from '@/lib/server/core/auth';

/**
 * POST /api/auth/register
 * Registriert einen neuen Benutzer (Nur für Admins)
 */
export const POST = withRoles(['admin'], async (req: NextRequest) => {
  try {
    const authService = container.resolve<IAuthService>('AuthService');
    
    // Daten aus dem Request extrahieren
    const userData = await req.json();
    
    // Benutzer registrieren
    const user = await authService.register(userData);
    
    return NextResponse.json({
      success: true,
      data: user,
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });
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
