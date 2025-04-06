/**
 * Interface für den Error-Handler
 */
export interface IErrorHandler {
  /**
   * Behandelt einen Fehler mit einem benutzerdefinierten Kontext
   */
  handleError(error: unknown, context: string): Error;
  
  /**
   * Konvertiert einen Fehler in ein benutzerfreundliches Fehlerobjekt
   */
  formatError(error: unknown): {
    message: string;
    statusCode: number;
    details?: any;
  };
  
  /**
   * Erzeugt einen neuen Error mit Statuscode
   */
  createError(message: string, statusCode?: number, details?: any): Error & { statusCode?: number; details?: any };
}
