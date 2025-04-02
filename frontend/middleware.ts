import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routen, die Authentifizierung erfordern
const PROTECTED_ROUTES = [
  '/dashboard',
  '/customers',
  '/projects',
  '/appointments',
  '/invoices',
  '/services',
  '/profile',
  '/settings'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Überprüfen, ob die aktuelle Route geschützt ist
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  if (isProtectedRoute) {
    const token = request.cookies.get('access_token')?.value;
    
    // Wenn kein Token vorhanden, zur Login-Seite umleiten
    if (!token) {
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    
    // Token-Validierung (einfach - prüft, ob ein Token existiert)
    // Für eine komplexere Validierung könnte ein Server-Component oder API-Route verwendet werden
  }
  
  return NextResponse.next();
}

// Konfiguration für die Middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/customers/:path*',
    '/projects/:path*',
    '/appointments/:path*',
    '/invoices/:path*',
    '/services/:path*',
    '/profile/:path*',
    '/settings/:path*',
  ],
};
