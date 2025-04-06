import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IUserRepository } from '@/lib/server/interfaces/IUserRepository';
import { verifyToken, generateToken, generateRefreshToken } from '@/lib/server/core/auth';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/refresh-token
 * Aktualisiert ein abgelaufenes JWT-Token mit einem Refresh-Token
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Refresh-Token aus Request-Body oder Cookie holen
    let refreshToken: string | undefined;
    
    try {
      const body = await req.json();
      refreshToken = body.refreshToken;
    } catch (e) {
      // Kein JSON-Body oder kein refreshToken im Body
    }
    
    // Wenn kein Token im Body, versuchen aus Cookies zu lesen
    if (!refreshToken) {
      const cookieStore = cookies();
      refreshToken = cookieStore.get('refresh_token')?.value;
    }
    
    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Refresh-Token ist erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    // Token verifizieren
    const payload = verifyToken(refreshToken);
    
    if (!payload || payload.tokenType !== 'refresh') {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültiges oder abgelaufenes Refresh-Token',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 401 }
      );
    }
    
    // Benutzer aus der Datenbank holen, um sicherzustellen, dass er noch existiert
    const userRepository = container.resolve<IUserRepository>('UserRepository');
    const user = await userRepository.findById(payload.id);
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Benutzer nicht gefunden',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 401 }
      );
    }
    
    // Neues Access-Token generieren
    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    // Neues Refresh-Token generieren (Token-Rotation für bessere Sicherheit)
    const newRefreshToken = generateRefreshToken({
      id: user.id,
      email: user.email
    });
    
    // Cookies aktualisieren
    const cookieStore = cookies();
    
    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 // 1 Stunde in Sekunden
    });
    
    cookieStore.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30 Tage in Sekunden
    });
    
    return NextResponse.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 60 * 60 // 1 Stunde in Sekunden
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Interner Serverfehler',
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}
