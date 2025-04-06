import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IAuthService } from '@/lib/server/interfaces/IAuthService';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/refresh
 * Aktualisiert ein Access-Token mit einem Refresh-Token
 */
export async function POST(req: NextRequest) {
  try {
    const authService = container.resolve<IAuthService>('AuthService');
    
    // Refresh-Token aus dem Cookie oder Request Body abrufen
    const cookieStore = cookies();
    let refreshToken = cookieStore.get('refresh_token')?.value;
    
    // Falls kein Cookie, versuchen aus dem Request Body zu lesen
    if (!refreshToken) {
      const body = await req.json();
      refreshToken = body.refreshToken;
    }
    
    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Kein Refresh-Token vorhanden',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    // IP-Adresse ermitteln
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      '0.0.0.0';
    
    // Token aktualisieren
    const tokenResult = await authService.refreshToken(refreshToken, ipAddress as string);
    
    // Cookies aktualisieren
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 Tage
      path: '/'
    };
    
    cookieStore.set('access_token', tokenResult.accessToken, cookieOptions as any);
    cookieStore.set('refresh_token', tokenResult.refreshToken, cookieOptions as any);
    
    return NextResponse.json({
      success: true,
      data: {
        accessToken: tokenResult.accessToken
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    
    // Cookies löschen bei Fehler
    const cookieStore = cookies();
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');
    
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
