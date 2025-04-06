/**
 * Express-Kompatibilitätshilfen für NextJS API-Routen
 * 
 * Diese Datei enthält einfache Hilfsfunktionen, um Express-ähnliche Funktionalität 
 * in NextJS API-Routen zu verwenden.
 */
import { NextRequest, NextResponse } from 'next/server';

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
 */
export const responseHelpers = {
  /**
   * Erfolgsantwort mit Daten
   */
  success: (data: any, message = 'Erfolg') => {
    return NextResponse.json({
      success: true,
      message,
      data
    });
  },
  
  /**
   * Paginierte Antwort
   */
  paginated: (data: any[], pagination: any) => {
    return NextResponse.json({
      success: true,
      data,
      pagination
    });
  },
  
  /**
   * Fehlerantwort
   */
  error: (message: string, statusCode = 500) => {
    return NextResponse.json({
      success: false,
      error: message
    }, { status: statusCode });
  },
  
  /**
   * Nicht-gefunden-Antwort
   */
  notFound: (message = 'Ressource nicht gefunden') => {
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 404 });
  },
  
  /**
   * Erfolgreiche Erstellung
   */
  created: (data: any, message = 'Ressource erfolgreich erstellt') => {
    return NextResponse.json({
      success: true,
      message,
      data
    }, { status: 201 });
  }
};