/**
 * API-Fehlerklassen und Hilfsfunktionen für Next.js
 */
import { NextResponse } from 'next/server';

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
    return NextResponse.json({
      success: false,
      message: this.message,
      errors: this.errors,
      timestamp: new Date().toISOString(),
    }, { status: this.statusCode });
  }
  
  /**
   * Fehlerbehandlung für alle Fehlertypen
   */
  static handleError(error: unknown): NextResponse {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Unbekannter Fehler',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Fehlertypen
export class BadRequestError extends ApiError {
  constructor(message = 'Ungültige Anfrage', errors: string[] = []) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Nicht autorisiert', errors: string[] = []) {
    super(message, 401, errors);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Zugriff verweigert', errors: string[] = []) {
    super(message, 403, errors);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Ressource nicht gefunden', errors: string[] = []) {
    super(message, 404, errors);
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validierungsfehler', errors: string[] = []) {
    super(message, 422, errors);
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Zu viele Anfragen', errors: string[] = []) {
    super(message, 429, errors);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Interner Serverfehler', errors: string[] = []) {
    super(message, 500, errors);
  }
}
