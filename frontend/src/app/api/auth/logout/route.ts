import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IAuthService } from '@/lib/server/interfaces/IAuthService';
import { cookies } from 'next/headers';
import { withAuth } from '@/lib/server/core/auth';

/**
 * POST /api/auth/logout
 * Meldet einen Benutzer ab und widerruft das Refresh-Token
 */
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const authService = container.resolve<IAuthService>('AuthService');
    
    // IP-Adresse ermitteln
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      '0.0.0.0';
    
    // Refresh-Token aus dem Cookie abrufen
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    
    // Wenn ein Refresh-Token vorhanden ist, widerrufen
    if (refreshToken) {
      await authService.revokeToken(refreshToken, ipAddress as string);
    }
    
    // Cookies löschen
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');
    
    return NextResponse.json({
      success: true,
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
