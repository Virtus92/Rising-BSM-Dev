import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * DEBUG ENDPOINT: Gibt Informationen zum Authentifizierungsstatus zurück
 * 
 * ACHTUNG: Nur für Entwicklungszwecke. In Produktion deaktivieren.
 */
export async function GET(request: NextRequest) {
  // In Produktion keine sensiblen Informationen preisgeben
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'This endpoint is disabled in production' }, { status: 404 });
  }

  // Cookie-Liste holen (ohne Werte für Sicherheit)
  const cookiesList = cookies();
  const cookieNames = cookiesList.getAll().map(cookie => cookie.name);
  
  // Auth-relevante Cookies hervorheben
  const authCookies = cookieNames.filter(name => 
    name.includes('auth') || 
    name.includes('token') || 
    name.includes('session')
  );
  
  // Header-Informationen sammeln
  const headersList = Object.fromEntries(
    [...request.headers.entries()].filter(([key]) => 
      // Nur nicht-sensible Headers anzeigen
      !key.includes('secret') && 
      !key.includes('auth') && 
      !key.includes('cookie')
    )
  );

  // Response mit Debug-Informationen
  return NextResponse.json({
    authenticated: authCookies.length > 0,
    cookieNames,
    authCookies,
    headers: headersList,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString()
  });
}
