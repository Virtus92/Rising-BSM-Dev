import { IErrorHandler } from '../interfaces/IErrorHandler';
import { ILoggingService } from '../interfaces/ILoggingService';

/**
 * Standard-Error-Handler-Implementierung
 */
export class ErrorHandler implements IErrorHandler {
  constructor(
    private logger: ILoggingService,
    private showDetails: boolean = false
  ) {}
  
  /**
   * Behandelt einen Fehler mit einem benutzerdefinierten Kontext
   */
  handleError(error: unknown, context: string): Error {
    const formattedError = this.formatError(error);
    
    this.logger.error(
      `${context}: ${formattedError.message}`,
      error instanceof Error ? error : new Error(String(error)),
      { statusCode: formattedError.statusCode, details: formattedError.details }
    );
    
    return this.createError(
      this.showDetails ? formattedError.message : 'Ein interner Fehler ist aufgetreten',
      formattedError.statusCode,
      this.showDetails ? formattedError.details : undefined
    );
  }
  
  /**
   * Konvertiert einen Fehler in ein benutzerfreundliches Fehlerobjekt
   */
  formatError(error: unknown): {
    message: string;
    statusCode: number;
    details?: any;
  } {
    if (error instanceof Error) {
      const statusCode = (error as any).statusCode || 500;
      const details = (error as any).details || undefined;
      return {
        message: error.message,
        statusCode,
        details
      };
    }
    
    return {
      message: String(error),
      statusCode: 500
    };
  }
  
  /**
   * Erzeugt einen neuen Error mit Statuscode
   */
  createError(message: string, statusCode: number = 500, details?: any): Error & { statusCode?: number; details?: any } {
    const error = new Error(message) as Error & { statusCode?: number; details?: any };
    error.statusCode = statusCode;
    
    if (details) {
      error.details = details;
    }
    
    return error;
  }
}
