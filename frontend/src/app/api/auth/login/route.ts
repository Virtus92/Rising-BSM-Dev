import { NextRequest } from 'next/server';
import { getAuthService } from '@/lib/factories';
import apiResponse from '@/lib/utils/api/unified-response';

/**
 * POST /api/auth/login
 * Authentifiziert einen Benutzer mit E-Mail und Passwort
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Eingaben validieren
    if (!email || !password) {
      return apiResponse.validationError(
        'E-Mail und Passwort sind erforderlich',
        ['Bitte geben Sie eine E-Mail-Adresse und ein Passwort ein']
      );
    }
    
    // Service aus Factory holen
    const authService = getAuthService();
    
    // IP-Adresse des Clients ermitteln
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // Login durchführen
    const authResult = await authService.login(
      { email, password },
      typeof ipAddress === 'string' ? ipAddress : ipAddress[0]
    );
    
    // Erfolgsantwort zurückgeben
    return apiResponse.success(
      authResult,
      'Anmeldung erfolgreich'
    );
  } catch (error) {
    // Fehlerbehandlung
    return apiResponse.handleError(error);
  }
}