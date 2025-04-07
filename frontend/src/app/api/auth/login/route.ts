/**
 * API-Route für Login
 */
import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/utils/api/unified-response';
import { withOptionalAuth } from '@/lib/middleware/withAuth';
import { getAuthService } from '@/lib/factories';

/**
 * POST-Handler für die Login-Route
 */
async function POST(req: NextRequest) {
  try {
    // Request-Daten parsen
    const data = await req.json();
    const { email, password, remember } = data;
    
    // Validierung
    if (!email || !password) {
      return apiResponse.validationError('E-Mail und Passwort sind erforderlich');
    }
    
    // Auth-Service verwenden
    const authService = getAuthService();
    
    // Login-Versuch
    const result = await authService.login({
      email,
      password,
      remember: !!remember
    });
    
    if (!result.success) {
      return apiResponse.unauthorized(result.message || 'Anmeldung fehlgeschlagen');
    }
    
    // Erfolgreiche Antwort
    return apiResponse.success(result.data, 'Anmeldung erfolgreich');
  } catch (error) {
    console.error('Login-Fehler:', error);
    return apiResponse.error('Anmeldung fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
  }
}

// Mit optionaler Auth-Middleware exportieren
export { withOptionalAuth(POST) as POST };
