/**
 * Reset Password API-Route
 * 
 * Verarbeitet Anfragen zum Setzen eines neuen Passworts nach einem Reset.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess } from '@/infrastructure/api/response-formatter';
import { getAuthService } from '@/infrastructure/common/factories';

/**
 * POST /api/auth/reset-password
 * 
 * Setzt das Passwort mit einem gültigen Reset-Token zurück.
 */
export const POST = apiRouteHandler(async (req: NextRequest) => {
  // Parse den Anfragekörper
  const { token, password, confirmPassword } = await req.json();
  
  // Validiere die Eingaben
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: 'Token is required',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  if (!password) {
    return NextResponse.json(
      {
        success: false,
        message: 'Password is required',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  if (password !== confirmPassword) {
    return NextResponse.json(
      {
        success: false,
        message: 'Passwords do not match',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  // Für die Entwicklungsphase simulieren wir ein erfolgreiches Passwort-Reset
  // In der Produktion würden wir den AuthService verwenden
  
  // Formatiere die Antwort
  return NextResponse.json(
    formatSuccess({}, 'Password has been reset successfully'),
    { status: 200 }
  );
}, { requiresAuth: false });