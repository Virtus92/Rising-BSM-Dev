/**
 * API-Middleware-Setup für NextJS
 * 
 * Zentralisierte Konfiguration für API-Middleware und Hilfsfunktionen.
 * Diese Datei ersetzt die Express-Middleware-Konfiguration für NextJS.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLoggingService } from '../services/factory';
import config from '../config';

/**
 * Middleware-Setup für API-Routen
 * 
 * Diese Funktion stellt eine vereinfachte Version der Express-Middleware für NextJS dar.
 * Sie bietet gemeinsame Funktionalität, die in API-Route-Handlern verwendet werden kann.
 */
export function setupApiMiddleware() {
  const logger = getLoggingService();
  logger.info('API-Middleware initialisiert');
  
  return {
    /**
     * CORS-Header zu einer Antwort hinzufügen
     */
    addCorsHeaders: (response: NextResponse) => {
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return response;
    },
    
    /**
     * Rate-Limiting-Prüfung (vereinfacht)
     * In NextJS würde dies normalerweise über die Edge-Middleware implementiert
     */
    checkRateLimit: async (request: NextRequest, limitKey: string = 'default') => {
      // In einer vollständigen Implementierung würde dies Redis oder einen anderen Store verwenden
      logger.debug(`Rate-Limiting-Prüfung für Schlüssel: ${limitKey}`);
      return true; // Immer erlauben in dieser vereinfachten Version
    },
    
    /**
     * Fehlerprotokollierung
     */
    logError: (error: Error, request: NextRequest) => {
      logger.error(`API-Fehler bei ${request.method} ${request.nextUrl.pathname}: ${error.message}`, {
        stack: error.stack,
        method: request.method,
        url: request.url
      });
    },
    
    /**
     * Anfragen protokollieren
     */
    logRequest: (request: NextRequest) => {
      logger.info(`API-Anfrage: ${request.method} ${request.nextUrl.pathname}`);
    },
    
    /**
     * Aktuelle API-Konfiguration
     */
    config
  };
}

/**
 * Einfache Hilfsfunktion zum Extrahieren des Benutzers aus den Request-Headern
 */
export function extractUserFromRequest(request: NextRequest): { userId?: string, role?: string } {
  const userId = request.headers.get('x-user-id');
  const role = request.headers.get('x-user-role');
  
  return {
    userId: userId || undefined,
    role: role || undefined
  };
}