/**
 * Settings Update API-Route
 * 
 * Diese Route ermöglicht das Aktualisieren einzelner Systemeinstellungen.
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * PUT /api/settings/update
 * Aktualisiert eine einzelne Systemeinstellung (key/value)
 */
export const PUT = apiRouteHandler(
  async (request: NextRequest) => {
    const logger = getLogger();
    const data = await request.json();
    
    // Validiere die Eingabe
    if (!data.key || data.value === undefined) {
      return formatError('Key and value are required', 400);
    }
    
    logger.info('Aktualisiere Systemeinstellung', { key: data.key, value: data.value });
    
    // In der fertigen Implementierung würden wir hier die Einstellung in der Datenbank aktualisieren
    // Für jetzt simulieren wir eine erfolgreiche Aktualisierung
    
    return formatSuccess({
      key: data.key,
      value: data.value,
      updatedAt: new Date().toISOString()
    });
  },
  {
    // Authentifizierung für das Aktualisieren von Einstellungen erfordern
    requiresAuth: true,
    // Nur Administratoren dürfen Einstellungen aktualisieren
    requiresRole: ['admin']
  }
);