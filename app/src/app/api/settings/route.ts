/**
 * Settings API-Route
 * 
 * Diese Route bietet Zugriff auf Systemeinstellungen.
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess } from '@/core/errors/index';
import { getLogger } from '@/core/logging';

/**
 * GET /api/settings
 * Gibt die Systemeinstellungen zurück
 */
export const GET = routeHandler(
  async (request: NextRequest) => {
    const logger = getLogger();
    logger.info('Hole Systemeinstellungen');
    
    return formatSuccess({
      companyName: 'Rising BSM',
      companyLogo: '/images/logo.png',
      companyEmail: 'info@rising-bsm.com',
      companyPhone: '+43 123 456789',
      companyAddress: 'Musterstraße 1, 4020 Linz',
      companyWebsite: 'https://www.rising-bsm.com',
      dateFormat: 'dd.MM.yyyy',
      timeFormat: 'HH:mm',
      currency: 'EUR',
      language: 'de',
      theme: 'system'
    });
  },
  {
    // Optional: erfordere Authentifizierung für die Einstellungen
    requiresAuth: false,
  }
);

/**
 * PUT /api/settings
 * Aktualisiert die Systemeinstellungen
 */
export const PUT = routeHandler(
  async (request: NextRequest) => {
    const logger = getLogger();
    const data = await request.json();
    
    // Validiere die Daten
    // Hier würden wir normalerweise getValidationService().validate() verwenden
    
    logger.info('Aktualisiere Systemeinstellungen', data);
    
    // In der fertigen Implementierung würden wir hier die Einstellungen in der Datenbank aktualisieren
    // Für jetzt simulieren wir eine erfolgreiche Aktualisierung
    
    return formatSuccess(data);
  },
  {
    // Authentifizierung für das Aktualisieren von Einstellungen erfordern
    requiresAuth: true,
    // Nur Administratoren dürfen Einstellungen aktualisieren
    requiredRoles: ['admin']
  }
);

/**
 * POST /api/settings/reset
 * Setzt die Systemeinstellungen auf die Standardwerte zurück
 */
export const POST = routeHandler(
  async (request: NextRequest) => {
    const logger = getLogger();
    logger.info('Setze Systemeinstellungen zurück');
    
    // In der fertigen Implementierung würden wir hier die Einstellungen in der Datenbank zurücksetzen
    // Für jetzt simulieren wir eine erfolgreiche Zurücksetzung
    
    const defaultSettings = {
      companyName: 'Rising BSM',
      dateFormat: 'dd.MM.yyyy',
      timeFormat: 'HH:mm',
      currency: 'EUR',
      language: 'de',
      theme: 'system'
    };
    
    return formatSuccess(defaultSettings);
  },
  {
    // Authentifizierung für das Zurücksetzen von Einstellungen erfordern
    requiresAuth: true,
    // Nur Administratoren dürfen Einstellungen zurücksetzen
    requiredRoles: ['admin']
  }
);