/**
 * Einheitliche API-Antwortfunktionen für Next.js
 */
import { NextResponse } from 'next/server';

/**
 * Standardisierte API-Antwortstruktur
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: ApiPagination;
  timestamp: string;
}

/**
 * Paginierungsinformationen
 */
export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * API-Antwort-Hilfsfunktionen
 */
export const apiResponse = {
  /**
   * Erfolgsantwort
   */
  success<T = any>(
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
  },

  /**
   * Fehlerantwort
   */
  error(
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
  },

  /**
   * "Ressource erstellt"-Antwort
   */
  created<T = any>(
    data?: T,
    message = 'Ressource erfolgreich erstellt',
  ): NextResponse<ApiResponse<T>> {
    return this.success(data, message, 201);
  },

  /**
   * "Keine Inhalte"-Antwort
   */
  noContent(
    message = 'Operation erfolgreich abgeschlossen'
  ): NextResponse<ApiResponse<null>> {
    return NextResponse.json({
      success: true,
      message,
      timestamp: new Date().toISOString(),
    }, { status: 204 });
  },

  /**
   * "Nicht gefunden"-Antwort
   */
  notFound(
    message = 'Ressource nicht gefunden',
    errors: string[] = []
  ): NextResponse<ApiResponse<null>> {
    return this.error(message, 404, errors);
  },

  /**
   * "Nicht autorisiert"-Antwort
   */
  unauthorized(
    message = 'Authentifizierung erforderlich',
    errors: string[] = []
  ): NextResponse<ApiResponse<null>> {
    return this.error(message, 401, errors);
  },

  /**
   * "Zugriff verweigert"-Antwort
   */
  forbidden(
    message = 'Zugriff verweigert',
    errors: string[] = []
  ): NextResponse<ApiResponse<null>> {
    return this.error(message, 403, errors);
  },

  /**
   * "Validierungsfehler"-Antwort
   */
  validationError(
    message = 'Validierung fehlgeschlagen',
    errors: string[] = []
  ): NextResponse<ApiResponse<null>> {
    return this.error(message, 422, errors);
  },

  /**
   * Paginierte Antwort
   */
  paginated<T = any>(
    data: T[],
    pagination: ApiPagination,
    message = 'Anfrage erfolgreich'
  ): NextResponse<ApiResponse<T[]>> {
    return NextResponse.json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  }
};

export default apiResponse;
