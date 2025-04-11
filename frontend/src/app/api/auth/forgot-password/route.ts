/**
 * Forgot Password API-Route
 * 
 * Verarbeitet Anfragen zum Zurücksetzen des Passworts.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess } from '@/infrastructure/api/response-formatter';
import { getAuthService } from '@/infrastructure/common/factories';

/**
 * POST /api/auth/forgot-password
 * 
 * Sendet eine E-Mail mit einem Link zum Zurücksetzen des Passworts.
 */
export const POST = apiRouteHandler(async (req: NextRequest) => {
  // Parse den Anfragekörper
  const { email } = await req.json();
  
  if (!email) {
    return NextResponse.json(
      {
        success: false,
        message: 'Email is required',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  // Für die Entwicklungsphase simulieren wir einen erfolgreichen Versand
  // In der Produktion würden wir den AuthService verwenden
  
  // Formatiere die Antwort
  return NextResponse.json(
    formatSuccess(
      { email },
      'Password reset instructions have been sent to your email'
    ),
    { status: 200 }
  );
}, { requiresAuth: false });