/**
 * Unified API Response Utilities
 * 
 * Diese Datei enthält vereinheitlichte Funktionen für API-Antworten.
 * Sie integriert die bestehenden Response-Utilities und stellt
 * eine einheitliche Schnittstelle zur Verfügung.
 */
import { NextResponse } from 'next/server';
import { ApiError } from './error';

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
 * Standardisierte Paginierungsinformationen
 */
export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * API Response helpers
 */
export const apiResponse = {
  /**
   * Erfolgsantwort mit optionalen Daten
   */
  success<T = any>(
    data?: T,
    message = 'Request successful',
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
    message = 'An error occurred',
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
   * "Ressource erfolgreich erstellt"-Antwort
   */
  created<T = any>(
    data?: T,
    message = 'Resource created successfully',
  ): NextResponse<ApiResponse<T>> {
    return this.success(data, message, 201);
  },

  /**
   * "Keine Inhalte"-Antwort (für erfolgreiche Löschoperationen)
   */
  noContent(
    message = 'Operation completed successfully'
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
    message = 'Resource not found',
    errors: string[] = []
  ): NextResponse<ApiResponse<null>> {
    return this.error(message, 404, errors);
  },

  /**
   * "Nicht autorisiert"-Antwort
   */
  unauthorized(
    message = 'Authentication required',
    errors: string[] = []
  ): NextResponse<ApiResponse<null>> {
    return this.error(message, 401, errors);
  },

  /**
   * "Zugriff verweigert"-Antwort
   */
  forbidden(
    message = 'Access denied',
    errors: string[] = []
  ): NextResponse<ApiResponse<null>> {
    return this.error(message, 403, errors);
  },

  /**
   * "Validierungsfehler"-Antwort
   */
  validationError(
    message = 'Validation failed',
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
    message = 'Request successful'
  ): NextResponse<ApiResponse<T[]>> {
    return NextResponse.json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  },

  /**
   * Behandelt einen Fehler und gibt eine passende Antwort zurück
   */
  handleError(error: unknown): NextResponse {
    if (error instanceof ApiError) {
      return this.error(error.message, error.statusCode, error.errors);
    }
    
    if (error instanceof Error) {
      return this.error(error.message);
    }
    
    return this.error('An unknown error occurred');
  }
};

/**
 * Exportiere die Response-Utilities unter einem gemeinsamen Namen
 */
export default apiResponse;
