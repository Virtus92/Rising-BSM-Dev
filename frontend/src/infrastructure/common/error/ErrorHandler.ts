import { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError, 
  BadRequestError
} from './ErrorTypes';
import { ILoggingService } from '../logging/ILoggingService';
import { ApiRequestError } from '@/infrastructure/clients/ApiClient';

// Re-export der Fehlertypen für einfachen Zugriff
export { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, BadRequestError } from './ErrorTypes';
// Direkte Definition von ErrorResponse um Importprobleme zu lösen
export interface ErrorResponse {
  success: boolean;
  message: string;
  statusCode?: number;
  errorCode?: string;
  errors?: Array<{
    message: string;
    statusCode?: number;
    validationErrors?: string[];
    stack?: string;
  }>;
  timestamp?: string;
}

/**
 * Interface für den ErrorHandler
 */
export interface IErrorHandler {
  /**
   * Erstellt einen allgemeinen Fehler
   * 
   * @param message - Fehlermeldung
   * @param statusCode - HTTP-Statuscode
   * @param code - Anwendungsspezifischer Fehlercode
   * @param details - Fehlerdetails
   */
  createError(message: string, statusCode?: number, code?: string, details?: any): AppError;
  
  /**
   * Erstellt einen Validierungsfehler
   * 
   * @param message - Fehlermeldung
   * @param errors - Validierungsfehler
   */
  createValidationError(message: string, errors?: string[]): ValidationError;
  
  /**
   * Erstellt einen "Nicht gefunden"-Fehler
   * 
   * @param message - Fehlermeldung
   * @param resource - Ressource, die nicht gefunden wurde
   */
  createNotFoundError(message: string, resource?: string): NotFoundError;
  
  /**
   * Erstellt einen nicht authentifizierten Fehler
   * 
   * @param message - Fehlermeldung
   */
  createUnauthorizedError(message?: string): UnauthorizedError;
  
  /**
   * Erstellt einen Berechtigungsfehler
   * 
   * @param message - Fehlermeldung
   */
  createForbiddenError(message?: string): ForbiddenError;
  
  /**
   * Erstellt einen Konfliktfehler
   * 
   * @param message - Fehlermeldung
   */
  createConflictError(message: string): ConflictError;
  
  /**
   * Erstellt einen ungültigen Anfragefehler
   * 
   * @param message - Fehlermeldung
   */
  createBadRequestError(message: string): BadRequestError;
  
  /**
   * Erstellt einen Datenbankfehler
   * 
   * @param message - Fehlermeldung
   * @param code - Datenbankfehlercode
   * @param details - Fehlerdetails
   */
  createDatabaseError(message: string, code?: string, details?: any): AppError;
  

  /**
   * Behandelt einen Datenbankfehler
   * 
   * @param error - Datenbankfehler
   */
  handleDatabaseError(error: any): AppError;
  
  /**
   * Wandelt einen Fehler in einen AppError um
   * 
   * @param error - Fehler
   */
  mapError(error: any): AppError;
  
  /**
   * Behandelt einen Fehler
   * 
   * @param error - Fehler
   * @param req - HTTP-Anfrage
   */
  handleError(error: any, req?: any): ErrorResponse;
  
  /**
   * Formatiert einen Fehler
   * 
   * @param error - Fehler
   */
  formatError(error: any): ErrorResponse;
  
  /**
   * Erstellt einen Datenbank-Fehler
   * 
   * @param message - Fehlermeldung
   * @param code - Datenbankfehlercode
   * @param details - Fehlerdetails
   */
  createDatabaseError(message: string, code?: string, details?: any): AppError;
  }

/**
 * Implementierung des ErrorHandlers
 */
export class ErrorHandler implements IErrorHandler {
  /**
   * Konstruktor
   * 
   * @param logger - Logging-Service
   * @param showStackTraces - Ob Stack-Traces angezeigt werden sollen
   */
  constructor(
    private readonly logger: ILoggingService,
    private readonly showStackTraces: boolean = process.env.NODE_ENV !== 'production'
  ) {}
  
  /**
   * Erstellt einen Bad Request Fehler
   * 
   * @param message - Fehlermeldung
   */
  createBadRequestError(message: string): BadRequestError {
    return new BadRequestError(message);
  }
  
  /**
   * Erstellt einen allgemeinen Fehler
   * 
   * @param message - Fehlermeldung
   * @param statusCode - HTTP-Statuscode
   * @param code - Anwendungsspezifischer Fehlercode
   * @param details - Fehlerdetails
   */
  createError(message: string, statusCode: number = 500, code: string = 'server_error', details?: any): AppError {
    const error = new AppError(message, statusCode, code, details);
    
    // Protokolliere die Fehlererstellung - using info instead of debug to avoid issues
    this.logger.info('Created application error', {
      type: error.constructor.name,
      message: error.message,
      statusCode: error.statusCode
    });
    
    return error;
  }
  
  /**
   * Erstellt einen Validierungsfehler
   * 
   * @param message - Fehlermeldung
   * @param errors - Validierungsfehler
   */
  createValidationError(message: string, errors: string[] = []): ValidationError {
    const error = new ValidationError(message, errors);
    
    // Protokolliere die Fehlererstellung - using info instead of debug to avoid issues
    this.logger.info('Created validation error', {
      message: error.message,
      errors: error.errors
    });
    
    return error;
  }
  
  /**
   * Erstellt einen "Nicht gefunden"-Fehler
   * 
   * @param message - Fehlermeldung
   * @param resource - Ressource, die nicht gefunden wurde
   */
  createNotFoundError(message: string, resource?: string): NotFoundError {
    return new NotFoundError(message, resource);
  }
  
  /**
   * Erstellt einen nicht authentifizierten Fehler
   * 
   * @param message - Fehlermeldung
   */
  createUnauthorizedError(message: string = 'Authentication required'): UnauthorizedError {
    return new UnauthorizedError(message);
  }
  
  /**
   * Erstellt einen Berechtigungsfehler
   * 
   * @param message - Fehlermeldung
   */
  createForbiddenError(message: string = 'Permission denied'): ForbiddenError {
    return new ForbiddenError(message);
  }
  
  /**
   * Erstellt einen Konfliktfehler
   * 
   * @param message - Fehlermeldung
   */
  createConflictError(message: string): ConflictError {
    return new ConflictError(message);
  }
  
  /**
   * Erstellt einen Datenbank-Fehler
   * 
   * @param message - Fehlermeldung
   * @param code - Datenbankfehlercode
   * @param details - Fehlerdetails
   */
  createDatabaseError(message: string, code: string = 'database_error', details?: any): AppError {
    return this.createError(message, 500, code, details);
  }
  
  /**
   * Behandelt einen Fehler
   * 
   * @param error - Fehler
   * @param req - HTTP-Anfrage
   */
  handleError(error: any, req?: any): ErrorResponse {
    // Wandle den Fehler in einen AppError um
    const appError = this.mapError(error);
    
    // Protokolliere den Fehler mit Kontext
    const logContext = {
      statusCode: appError.statusCode,
      path: req?.path || 'unknown',
      method: req?.method || 'unknown',
      ...(this.showStackTraces && appError.stack ? { stack: appError.stack } : {})
    };
    
    this.logger.error(appError.message, logContext);
    
    // Formatiere und gib die Fehlerantwort zurück
    return this.formatError(appError);
  }
  
  /**
   * Formatiert einen Fehler
   * 
   * @param error - Fehler
   */
  formatError(error: any): ErrorResponse {
    const appError = error instanceof AppError ? error : this.mapError(error);
    
    const timestamp = new Date().toISOString();
    
    // Standardfehlerantwort
    const response: ErrorResponse = {
      success: false,
      message: appError.message,
      statusCode: appError.statusCode,
      errorCode: appError.errorCode,
      timestamp,
      errors: [{
        message: appError.message,
        statusCode: appError.statusCode,
        ...(appError instanceof ValidationError ? { validationErrors: appError.errors } : {}),
        ...(this.showStackTraces && appError.stack ? { stack: appError.stack } : {})
      }]
    };
    
    return response;
  }
  
  /**
   * Wandelt einen Fehler in einen AppError um
   * 
   * @param error - Fehler
   */
  mapError(error: any): AppError {
    // Bereits ein AppError
    if (error instanceof AppError) {
      return error;
    }
    
    // ApiRequestError aus ApiClient in entsprechenden AppError umwandeln
    if (error instanceof ApiRequestError) {
      switch (error.statusCode) {
        case 400:
          return this.createBadRequestError(error.message);
        case 401:
          return this.createUnauthorizedError(error.message);
        case 403:
          return this.createForbiddenError(error.message);
        case 404:
          return this.createNotFoundError(error.message);
        case 409:
          return this.createConflictError(error.message);
        case 422:
          return this.createValidationError(error.message, error.errors);
        default:
          return this.createError(
            error.message,
            error.statusCode || 500,
            'api_error',
            this.showStackTraces ? { errors: error.errors } : undefined
          );
      }
    }
    
    // Nativer Error
    if (error instanceof Error) {
      return this.createError(
        error.message,
        500,
        'server_error',
        this.showStackTraces ? { stack: error.stack } : undefined
      );
    }
    
    // Andere Werte
    return this.createError(
      typeof error === 'string' ? error : 'Ein unerwarteter Fehler ist aufgetreten',
      500,
      'server_error',
      this.showStackTraces && typeof error === 'object' ? error : undefined
    );
  }
  
  /**
   * Behandelt einen Datenbankfehler
   * 
   * @param error - Datenbankfehler
   */
  handleDatabaseError(error: any): AppError {
    // Protokolliere den Datenbankfehler
    this.logger.error('Database error', { error });
    
    // Prüfe auf spezifische Prisma-Fehler
    if (error && typeof error === 'object' && 'code' in error) {
      const code = error.code as string;
      
      // Einzigartigkeit verletzt (z.B. doppelte E-Mail)
      if (code === 'P2002') {
        const target = error.meta?.target && Array.isArray(error.meta.target) 
          ? error.meta.target.join(', ')
          : 'field';
          
        return this.createConflictError(`Duplicate value for ${target}`);
      }
      
      // Fremdschlüssel-Einschränkung verletzt
      if (code === 'P2003') {
        return this.createConflictError('Cannot delete record due to existing references');
      }
      
      // Datensatz nicht gefunden
      if (code === 'P2001' || code === 'P2025') {
        return this.createNotFoundError('Record not found');
      }
    }
    
    // Allgemeiner Datenbankfehler
    return this.createError(
      'A database error occurred',
      500,
      'database_error',
      this.showStackTraces ? error : undefined
    );
  }
}
