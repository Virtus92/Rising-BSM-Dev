import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { createApiHandler, ApiHandler } from './api-handler';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
  sub: number; // Benutzer-ID im JWT ist unter 'sub' gespeichert
  email: string;
  name?: string;
  role: string;
  [key: string]: any;
}

/**
 * Verifiziert ein JWT-Token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Generiert ein JWT-Token
 */
export function generateToken(payload: any, expiresIn = JWT_EXPIRES_IN): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Generiert ein Refresh-Token
 */
export function generateRefreshToken(payload: any): string {
  // Typ markieren als refresh-token
  const refreshPayload = {
    ...payload,
    type: 'refresh'
  };
  
  return jwt.sign(refreshPayload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

/**
 * Middleware-Funktion, die überprüft, ob ein Benutzer authentifiziert ist
 */
export function withAuth(handler: ApiHandler, servicesToResolve: string[] = []) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Token aus Authorization-Header oder Cookies holen
      let token: string | undefined;
      
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        // Cookie-Store lesen
        const cookieStore = cookies();
        token = cookieStore.get('access_token')?.value;
      }
      
      if (!token) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unauthorized: No authentication token provided', 
            meta: { timestamp: new Date().toISOString() } 
          },
          { status: 401 }
        );
      }
      
      const userData = verifyToken(token);
      if (!userData) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unauthorized: Invalid or expired token', 
            meta: { timestamp: new Date().toISOString() } 
          },
          { status: 401 }
        );
      }
      
      // Extrahiere den richtigen 'id' Wert, indem wir 'sub' oder direkt 'id' nutzen
      const user = {
        ...userData,
        id: userData.sub ?? userData.id // Stellen Sie sicher, dass 'id' immer definiert ist
      };
      
      // Den optimierten API-Handler mit den erforderlichen Services verwenden
      return createApiHandler(handler, {
        servicesToResolve,
        requireAuth: true
      })(req, user);
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication error', 
          meta: { timestamp: new Date().toISOString() } 
        },
        { status: 401 }
      );
    }
  };
}

/**
 * Middleware-Funktion, die überprüft, ob ein Benutzer bestimmte Rollen hat
 */
export function withRoles(
  roles: string | string[],
  handler: ApiHandler,
  servicesToResolve: string[] = []
) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return withAuth(async (req: NextRequest, user: TokenPayload, services) => {
    // Prüfen, ob der Benutzer die erforderliche Rolle hat
    if (!user.role || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Forbidden: Insufficient permissions', 
          meta: { timestamp: new Date().toISOString() } 
        },
        { status: 403 }
      );
    }
    
    return handler(req, user, services);
  }, servicesToResolve);
}
