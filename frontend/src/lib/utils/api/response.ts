/**
 * API-Response-Utilities
 * Hilfsfunktionen für die Formatierung von API-Antworten
 */
import { NextResponse } from 'next/server';

/**
 * Standard-Antwortstruktur
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  timestamp?: string;
}

/**
 * Gibt eine Erfolgsantwort zurück
 */
export function successResponse<T = any>(
  data?: T,
  message = 'Anfrage erfolgreich',
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  }, { status });
}

/**
 * Gibt eine Fehlerantwort zurück
 */
export function errorResponse(
  message = 'Ein Fehler ist aufgetreten',
  status = 500,
  errors: string[] = []
): NextResponse<ApiResponse<null>> {
  return NextResponse.json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  }, { status });
}

/**
 * Gibt eine "Nicht gefunden"-Antwort zurück
 */
export function notFoundResponse(
  message = 'Ressource nicht gefunden',
  errors: string[] = []
): NextResponse<ApiResponse<null>> {
  return errorResponse(message, 404, errors);
}

/**
 * Gibt eine "Nicht autorisiert"-Antwort zurück
 */
export function unauthorizedResponse(
  message = 'Nicht autorisiert',
  errors: string[] = []
): NextResponse<ApiResponse<null>> {
  return errorResponse(message, 401, errors);
}

/**
 * Gibt eine "Verboten"-Antwort zurück
 */
export function forbiddenResponse(
  message = 'Zugriff verweigert',
  errors: string[] = []
): NextResponse<ApiResponse<null>> {
  return errorResponse(message, 403, errors);
}

/**
 * Gibt eine "Validierungsfehler"-Antwort zurück
 */
export function validationErrorResponse(
  message = 'Validierungsfehler',
  errors: string[] = []
): NextResponse<ApiResponse<null>> {
  return errorResponse(message, 422, errors);
}
