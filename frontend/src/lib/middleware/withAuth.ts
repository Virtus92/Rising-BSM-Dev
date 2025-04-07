/**
 * Auth Middleware für Next.js API-Routen
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, isTokenExpired, getUserFromToken, refreshAccessToken } from '@/lib/auth';
import { apiResponse } from '@/lib/utils/api/unified-response';

/**
 * Authentifiziert einen API-Request und fügt Benutzerinformationen hinzu
 * 
 * @param handler - API-Routenhandler
 * @param requireAuth - Ob Authentifizierung erforderlich ist
 * @param allowedRoles - Erlaubte Benutzerrollen
 * @returns Middleware-Handler
 */
export function withAuth(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse> | NextResponse,
  requireAuth: boolean = true,
  allowedRoles: string[] = []
) {
  return async function(req: NextRequest, context?: any) {
    try {
      // Token aus Header oder Cookie extrahieren
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : getAccessToken();

      if (!token && requireAuth) {
        return apiResponse.unauthorized('Authentifizierung erforderlich');
      }

      if (token) {
        // Token validieren
        if (isTokenExpired(token)) {
          // Token-Aktualisierung versuchen
          const refreshed = await refreshAccessToken();
          if (!refreshed && requireAuth) {
            return apiResponse.unauthorized('Session abgelaufen, bitte neu anmelden');
          }
        }

        // Benutzerinformationen extrahieren
        const user = getUserFromToken(token);
        
        if (!user && requireAuth) {
          return apiResponse.unauthorized('Ungültiges Token');
        }
        
        // Rollenbasierte Autorisierung
        if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
          return apiResponse.forbidden('Unzureichende Berechtigungen');
        }
        
        // Benutzer zum Request hinzufügen
        if (user) {
          // Wir können in Next.js nicht direkt das Request-Objekt modifizieren
          // Stattdessen übergeben wir den Benutzer als Kontext
          return handler(req, { ...context, user });
        }
      }

      // Weiterleiten zum Handler
      return handler(req, context);
    } catch (error) {
      return apiResponse.error('Authentifizierungsfehler: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };
}

/**
 * Middleware für API-Routen, die keine Authentifizierung erfordern
 */
export function withOptionalAuth(handler: (req: NextRequest, context?: any) => Promise<NextResponse> | NextResponse) {
  return withAuth(handler, false);
}

/**
 * Middleware für API-Routen, die Admin-Berechtigungen erfordern
 */
export function withAdminAuth(handler: (req: NextRequest, context?: any) => Promise<NextResponse> | NextResponse) {
  return withAuth(handler, true, ['admin']);
}

/**
 * Middleware für API-Routen, die Manager-Berechtigungen erfordern
 */
export function withManagerAuth(handler: (req: NextRequest, context?: any) => Promise<NextResponse> | NextResponse) {
  return withAuth(handler, true, ['admin', 'manager']);
}
