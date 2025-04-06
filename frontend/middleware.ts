/**
 * NextJS Middleware
 * 
 * Diese Middleware implementiert Authentifizierung und andere gemeinsame Funktionen
 * für alle API-Routen.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Pfade, die keine Authentifizierung benötigen
const publicPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/health',
  '/api/docs'
];

/**
 * Überprüft, ob ein Pfad öffentlich zugänglich ist
 */
function isPublicPath(path: string): boolean {
  return publicPaths.some(publicPath => path.startsWith(publicPath));
}

/**
 * Middleware-Hauptfunktion
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // CORS-Header für alle Anfragen
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // OPTIONS-Anfragen sofort beantworten (CORS pre-flight)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers
    });
  }
  
  // Authentifizierung nur für API-Routen prüfen
  if (path.startsWith('/api/') && !isPublicPath(path)) {
    // Token aus Authorization-Header oder Cookie holen
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }
    
    try {
      // Token verifizieren
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-default-super-secret-key-change-in-production');
      
      // Benutzerinformationen an Request anfügen
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', typeof decoded === 'object' ? decoded.sub || decoded.userId : '');
      requestHeaders.set('x-user-role', typeof decoded === 'object' ? decoded.role || 'user' : '');
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Ungültiger Token' },
        { status: 401 }
      );
    }
  }
  
  return response;
}

// Konfigurieren, auf welche Pfade die Middleware angewendet wird
export const config = {
  matcher: ['/api/:path*']
};