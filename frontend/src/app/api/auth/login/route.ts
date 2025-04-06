// Serverinitialisierung zuerst importieren
import '@/lib/server/init';

import { NextRequest, NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/server/core/api-handler';
import { ILoggingService } from '@/lib/server/interfaces/ILoggingService';
import { IAuthService } from '@/lib/server/interfaces/IAuthService';
import { cookies } from 'next/headers';
import { LoginDto } from '@/lib/dtos/AuthDtos';

// Dienste, die für diese Route aufgelöst werden sollen
const SERVICES_TO_RESOLVE = ['AuthService', 'LoggingService'];

/**
 * POST /api/auth/login
 * Authentifiziert einen Benutzer und gibt Access- und Refresh-Token zurück
 */
export const POST = createApiHandler(
  async (req: NextRequest, user, services) => {
    const { logger, AuthService } = services as {
      logger: ILoggingService;
      AuthService: IAuthService;
    };
    
    // Daten aus dem Request extrahieren
    const requestData = await req.json();
    const loginDto: LoginDto = {
      email: requestData.email,
      password: requestData.password,
      remember: requestData.remember || false
    };
    
    logger.debug('Login-Anfrage erhalten', { email: loginDto.email });
    
    // IP-Adresse ermitteln
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      '0.0.0.0';
    
    // Context-Objekt für den Service
    const serviceOptions = {
      context: {
        ipAddress
      }
    };
    
    // Authentifizierung durchführen
    logger.debug('Starte Authentifizierung', { ipAddress });
    const authResult = await AuthService.login(loginDto, serviceOptions);
    
    // Cookies-Optionen
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: loginDto.remember ? 7 * 24 * 60 * 60 : 24 * 60 * 60, // 7 Tage oder 1 Tag in Sekunden
      path: '/'
    };
    
    // Cookies setzen
    const cookieStore = cookies();
    cookieStore.set('access_token', authResult.accessToken, cookieOptions);
    cookieStore.set('refresh_token', authResult.refreshToken, cookieOptions);
    
    logger.info('Benutzer erfolgreich authentifiziert', { 
      userId: authResult.id,
      userRole: authResult.user.role
    });
    
    return NextResponse.json({
      success: true,
      data: {
        ...authResult,
        // Wir filtern das Passwort und sensible Daten heraus, falls diese
        // versehentlich in der Antwort enthalten sein sollten
        user: {
          id: authResult.user.id,
          name: authResult.user.name,
          email: authResult.user.email,
          role: authResult.user.role,
          status: authResult.user.status,
          profilePicture: authResult.user.profilePicture,
          createdAt: authResult.user.createdAt,
          updatedAt: authResult.user.updatedAt
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  },
  {
    servicesToResolve: SERVICES_TO_RESOLVE,
    requireAuth: false // Login benötigt keine Authentifizierung
  }
);
