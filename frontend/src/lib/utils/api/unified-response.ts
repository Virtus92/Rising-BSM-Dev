/**
 * Einheitliche API-Antwortfunktionen für Next.js
 */
import { NextResponse } from 'next/server';
import { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from '@/types/interfaces/IErrorHandler';
import { IErrorHandler } from '@/types/interfaces/IErrorHandler';
import { getErrorHandler } from '@/lib/core/bootstrap';

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
  },
  
  /**
   * Einheitliches Fehlerhandling für API-Endpunkte
   */
  handleError(error: unknown, req?: any): NextResponse<ApiResponse<null>> {
    const errorHandler = getErrorHandler();
    
    // Fehler durch ErrorHandler aufbereiten lassen
    const errorResponse = errorHandler.formatError(error);
    
    // Fehlerinformationen extrahieren
    const firstError = errorResponse.errors && errorResponse.errors[0];
    const statusCode = firstError?.statusCode || 500;
    const message = firstError?.message || 'Ein unerwarteter Fehler ist aufgetreten';
    const validationErrors = firstError?.validationErrors || [];
    
    // Typbasierte Antwort generieren
    if (error instanceof ValidationError) {
      return this.validationError(message, validationErrors);
    }
    
    if (error instanceof NotFoundError) {
      return this.notFound(message);
    }
    
    if (error instanceof UnauthorizedError) {
      return this.unauthorized(message);
    }
    
    if (error instanceof ForbiddenError) {
      return this.forbidden(message);
    }
    
    // Allgemeiner Fehler
    return this.error(message, statusCode, validationErrors.length ? validationErrors : []);
  },
  
  /**
   * Standardantwort für API-Handler mit Try-Catch
   */
  async tryRequest<T>(
    requestHandler: () => Promise<T>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      statusCode?: number;
    }
  ): Promise<NextResponse<ApiResponse<T>>> {
    try {
      const result = await requestHandler();
      return this.success(result, options?.successMessage);
    } catch (error) {
      return this.handleError(error) as NextResponse<ApiResponse<T>>;
    }
  }
};

export default apiResponse;
