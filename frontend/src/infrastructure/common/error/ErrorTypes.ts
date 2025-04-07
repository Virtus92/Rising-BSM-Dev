/**
 * Schnittstelle für Fehlerantworten
 */
export interface ErrorResponse {
  /**
   * Erfolgsindikator (immer false)
   */
  success: boolean;
  
  /**
   * Fehlermeldung
   */
  message: string;
  
  /**
   * HTTP-Statuscode
   */
  statusCode?: number;
  
  /**
   * Anwendungsspezifischer Fehlercode
   */
  errorCode?: string;
  
  /**
   * Detaillierte Fehlerinformationen
   */
  errors?: Array<{
    /**
     * Fehlermeldung
     */
    message: string;
    
    /**
     * Statuscode
     */
    statusCode?: number;
    
    /**
     * Validierungsfehler
     */
    validationErrors?: string[];
    
    /**
     * Stack-Trace
     */
    stack?: string;
  }>;
  
  /**
   * Zeitstempel
   */
  timestamp?: string;
}

/**
 * Basisklasse für Anwendungsfehler
 */
export class AppError extends Error {
  /**
   * HTTP-Statuscode
   */
  statusCode: number;
  
  /**
   * Anwendungsspezifischer Fehlercode
   */
  errorCode: string;
  
  /**
   * Fehlerdetails
   */
  details?: any;
  
  /**
   * Konstruktor
   * 
   * @param message - Fehlermeldung
   * @param statusCode - HTTP-Statuscode
   * @param errorCode - Anwendungsspezifischer Fehlercode
   * @param details - Fehlerdetails
   */
  constructor(message: string, statusCode: number = 500, errorCode: string = 'server_error', details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    
    // Restore prototype chain in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validierungsfehler
 */
export class ValidationError extends AppError {
  /**
   * Validierungsfehler
   */
  errors: string[];
  
  /**
   * Konstruktor
   * 
   * @param message - Fehlermeldung
   * @param errors - Validierungsfehler
   */
  constructor(message: string, errors: string[] = []) {
    super(message, 422, 'validation_error');
    this.errors = errors;
  }
}

/**
 * "Nicht gefunden"-Fehler
 */
export class NotFoundError extends AppError {
  /**
   * Konstruktor
   * 
   * @param message - Fehlermeldung
   * @param resource - Ressource, die nicht gefunden wurde
   */
  constructor(message: string, resource?: string) {
    super(
      resource ? `${resource} not found: ${message}` : message,
      404,
      'not_found'
    );
  }
}

/**
 * Nicht authentifizierter Fehler
 */
export class UnauthorizedError extends AppError {
  /**
   * Konstruktor
   * 
   * @param message - Fehlermeldung
   */
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'unauthorized');
  }
}

/**
 * Berechtigungsfehler
 */
export class ForbiddenError extends AppError {
  /**
   * Konstruktor
   * 
   * @param message - Fehlermeldung
   */
  constructor(message: string = 'Permission denied') {
    super(message, 403, 'forbidden');
  }
}

/**
 * Konfliktfehler (z.B. Datenbank-Eindeutigkeitsverletzung)
 */
export class ConflictError extends AppError {
  /**
   * Konstruktor
   * 
   * @param message - Fehlermeldung
   */
  constructor(message: string) {
    super(message, 409, 'conflict');
  }
}

/**
 * Ungültige Anfragefehler
 */
export class BadRequestError extends AppError {
  /**
   * Konstruktor
   * 
   * @param message - Fehlermeldung
   */
  constructor(message: string) {
    super(message, 400, 'bad_request');
  }
}
