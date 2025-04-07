/**
 * Settings API-Route
 * 
 * Diese Route bietet Zugriff auf Systemeinstellungen.
 */
import { NextRequest } from 'next/server';
import { createGetHandler, createPutHandler } from '@/lib/utils/api/route-handler';
import { getLogger } from '@/lib/core/bootstrap';

/**
 * Validierungsschema für Einstellungen
 */
const settingsSchema = {
  companyName: { type: 'string', required: true },
  companyLogo: { type: 'string' },
  companyEmail: { type: 'string', format: 'email' },
  companyPhone: { type: 'string' },
  companyAddress: { type: 'string' },
  companyWebsite: { type: 'string', format: 'uri' },
  dateFormat: { type: 'string', required: true },
  timeFormat: { type: 'string', required: true },
  currency: { type: 'string', required: true },
  language: { type: 'string', required: true },
  theme: { type: 'string', enum: ['light', 'dark', 'system'], required: true }
};

/**
 * GET /api/settings
 * Gibt die Systemeinstellungen zurück
 */
export const GET = createGetHandler(
  async (request: NextRequest) => {
    const logger = getLogger();
    logger.info('Hole Systemeinstellungen');
    
    // In der fertigen Implementierung würden wir hier die Einstellungen aus der Datenbank holen
    // Für jetzt geben wir Standardeinstellungen zurück
    
    return {
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
    };
  },
  {
    // Optional: erfordere Authentifizierung für die Einstellungen
    // requireAuth: true,
    // Optional: erlaube nur bestimmte Rollen
    // allowedRoles: ['admin'],
  }
);

/**
 * PUT /api/settings
 * Aktualisiert die Systemeinstellungen
 */
export const PUT = createPutHandler(
  async (request: NextRequest, context: any) => {
    const logger = getLogger();
    const data = context.body; // Bereits validierte Daten aus dem Context
    
    logger.info('Aktualisiere Systemeinstellungen', data);
    
    // In der fertigen Implementierung würden wir hier die Einstellungen in der Datenbank aktualisieren
    // Für jetzt simulieren wir eine erfolgreiche Aktualisierung
    
    return data;
  },
  {
    // Validierungsschema für die Einstellungen
    schema: settingsSchema,
    // Authentifizierung für das Aktualisieren von Einstellungen erfordern
    requireAuth: true,
    // Nur Administratoren dürfen Einstellungen aktualisieren
    allowedRoles: ['admin']
  }
);