/**
 * API-Error-Utilities
 * Hilfsfunktionen für die Fehlerbehandlung in API-Routen
 */
import { NextResponse } from 'next/server';
import { errorResponse } from './response';

/**
 * Basisklasse für API-Fehler
 */
export class ApiError extends Error {
  statusCode: number;
  errors: string[];
  
  constructor(message: string, statusCode = 500, errors: string[] = []) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
  }
  
  /**
   * Konvertiert den Fehler in eine NextResponse
   */
  toResponse(): NextResponse {
    return errorResponse(this.message, this.statusCode, this.errors);
  }
  
  /**
   * Behandelt alle Fehlertypen und gibt eine einheitliche NextResponse zurück
   */
  static handleError(error: unknown): NextResponse {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    
    if (error instanceof Error) {
      return errorResponse(error.message);
    }
    
    return errorResponse('Ein unbekannter Fehler ist aufgetreten');
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends ApiError {
  constructor(message = 'Ungültige Anfrage', errors: string[] = []) {
    super(message, 400, errors);
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Nicht autorisiert', errors: string[] = []) {
    super(message, 401, errors);
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Zugriff verweigert', errors: string[] = []) {
    super(message, 403, errors);
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends ApiError {
  constructor(message = 'Ressource nicht gefunden', errors: string[] = []) {
    super(message, 404, errors);
  }
}

/**
 * 422 Unprocessable Entity (Validation Error)
 */
export class ValidationError extends ApiError {
  constructor(message = 'Validierungsfehler', errors: string[] = []) {
    super(message, 422, errors);
  }
}

/**
 * 429 Too Many Requests
 */
export class RateLimitError extends ApiError {
  constructor(message = 'Zu viele Anfragen', errors: string[] = []) {
    super(message, 429, errors);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends ApiError {
  constructor(message = 'Interner Serverfehler', errors: string[] = []) {
    super(message, 500, errors);
  }
}

/**
 * 503 Service Unavailable
 */
export class ServiceUnavailableError extends ApiError {
  constructor(message = 'Dienst nicht verfügbar', errors: string[] = []) {
    super(message, 503, errors);
  }
}
