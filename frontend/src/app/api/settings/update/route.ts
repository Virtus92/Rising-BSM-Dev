/**
 * Settings Update API-Route
 * 
 * Diese Route aktualisiert eine einzelne Einstellung.
 */
import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/utils/api/response';
import { ApiError, BadRequestError } from '@/lib/utils/api/error';
import { getLogger } from '@/lib/core/bootstrap';

/**
 * PUT /api/settings/update
 * Aktualisiert eine einzelne Einstellung
 */
export async function PUT(request: NextRequest) {
  const logger = getLogger();
  
  try {
    const { key, value } = await request.json();
    
    if (!key) {
      throw new BadRequestError('Schlüssel ist erforderlich');
    }
    
    logger.info(`Aktualisiere Einstellung: ${key}`, { value });
    
    // In der fertigen Implementierung würden wir hier die Einstellung in der Datenbank aktualisieren
    // Für jetzt simulieren wir eine erfolgreiche Aktualisierung
    
    return successResponse(
      { [key]: value },
      `Einstellung ${key} erfolgreich aktualisiert`
    );
  } catch (error) {
    logger.error('Fehler beim Aktualisieren der Einstellung:', error);
    return ApiError.handleError(error);
  }
}