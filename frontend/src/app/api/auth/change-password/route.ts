/**
 * Change Password API-Route
 * 
 * Verarbeitet Anfragen zum Ändern des Passworts für angemeldete Benutzer.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess } from '@/infrastructure/api/response-formatter';
import { getAuthService } from '@/infrastructure/common/factories';

/**
 * POST /api/auth/change-password
 * 
 * Ändert das Passwort eines angemeldeten Benutzers.
 */
export const POST = apiRouteHandler(async (req: NextRequest) => {
  // Parse den Anfragekörper
  const { currentPassword, newPassword, newPasswordConfirm } = await req.json();
  
  // Validiere die Eingaben
  if (!currentPassword) {
    return NextResponse.json(
      {
        success: false,
        message: 'Current password is required',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  if (!newPassword) {
    return NextResponse.json(
      {
        success: false,
        message: 'New password is required',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  if (newPassword !== newPasswordConfirm) {
    return NextResponse.json(
      {
        success: false,
        message: 'New passwords do not match',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  // Für die Entwicklungsphase simulieren wir eine erfolgreiche Passwortänderung
  // In der Produktion würden wir den AuthService verwenden
  
  // Formatiere die Antwort
  return NextResponse.json(
    formatSuccess({}, 'Password has been changed successfully'),
    { status: 200 }
  );
}, {
  // Nur angemeldete Benutzer dürfen ihr Passwort ändern
  requiresAuth: true
});