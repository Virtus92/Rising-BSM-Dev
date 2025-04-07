/**
 * Express-Kompatibilitätshilfen für NextJS API-Routen
 * 
 * Diese Datei enthält einfache Hilfsfunktionen, um Express-ähnliche Funktionalität 
 * in NextJS API-Routen zu verwenden.
 * 
 * HINWEIS: Diese Datei wird für Kompatibilität mit altem Code beibehalten.
 * Für neue Implementierungen verwende bitte die unified-response.ts.
 * 
 * @deprecated Verwende stattdessen unified-response.ts
 */
import { NextRequest, NextResponse } from 'next/server';
import apiResponse from './unified-response';

/**
 * Extrahiert Benutzerinformationen aus den Request-Headern
 */
export function extractUserFromRequest(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');
  
  return {
    userId,
    role: userRole
  };
}

/**
 * Einfache Antwortformatierung (Express-ähnlich)
 * 
 * @deprecated Verwende stattdessen apiResponse aus unified-response.ts
 */
export const responseHelpers = {
  /**
   * Erfolgsantwort mit Daten
   */
  success: (data: any, message = 'Erfolg') => {
    return apiResponse.success(data, message);
  },
  
  /**
   * Paginierte Antwort
   */
  paginated: (data: any[], pagination: any) => {
    return apiResponse.paginated(data, pagination);
  },
  
  /**
   * Fehlerantwort
   */
  error: (message: string, statusCode = 500) => {
    return apiResponse.error(message, statusCode);
  },
  
  /**
   * Nicht-gefunden-Antwort
   */
  notFound: (message = 'Ressource nicht gefunden') => {
    return apiResponse.notFound(message);
  },
  
  /**
   * Erfolgreiche Erstellung
   */
  created: (data: any, message = 'Ressource erfolgreich erstellt') => {
    return apiResponse.created(data, message);
  }
};
