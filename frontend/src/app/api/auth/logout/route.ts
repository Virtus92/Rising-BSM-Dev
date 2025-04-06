/**
 * Logout API-Route
 * 
 * Diese Route ermöglicht das Abmelden eines Benutzers.
 */
import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/utils/api/response';
import { ApiError, BadRequestError } from '@/lib/utils/api/error';
import { getLogger } from '@/lib/core/bootstrap';

/**
 * POST /api/auth/logout
 * Meldet einen Benutzer ab
 */
export async function POST(request: NextRequest) {
  const logger = getLogger();
  
  try {
    const { refreshToken } = await request.json();
    
    // In einer realen Anwendung würden wir hier das Refresh Token in der Datenbank invalidieren
    // Für die Demo geben wir nur eine Erfolgsmeldung zurück
    
    logger.info('Benutzer abgemeldet');
    
    return successResponse(
      { success: true },
      'Abmeldung erfolgreich'
    );
  } catch (error) {
    logger.error('Fehler bei Abmeldung:', error);
    return ApiError.handleError(error);
  }
}
