import { Request, Response } from 'express';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { AuthenticatedRequest } from '../interfaces/IAuthTypes.js';

/**
 * BaseController
 * 
 * Basisklasse für alle Controller mit Standardmethoden und Fehlerbehandlung
 */
export abstract class BaseController {
  /**
   * Erstellt eine neue BaseController-Instanz
   * 
   * @param logger - Logging-Service
   * @param errorHandler - Fehlerbehandlung
   */
  constructor(
    protected readonly logger: ILoggingService,
    protected readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug(`Initialisiert ${this.constructor.name}`);
  }

  /**
   * Behandelt und formatiert Fehler einheitlich
   * 
   * @param error - Fehlerobjekt
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  protected handleError(error: any, req: Request, res: Response): void {
    // Mit passendem Kontext protokollieren
    this.logger.error(
      `Fehler in ${this.constructor.name}`,
      error instanceof Error ? error : String(error),
      { path: req.path, method: req.method, userId: this.getAuthenticatedUser(req)?.id }
    );
    
    // Fehlerbehandlung verwenden
    this.errorHandler.handleError(error, req, res);
  }
  
  /**
   * Erfolgsantwort senden
   * 
   * @param res - HTTP-Antwort
   * @param data - Antwortdaten
   * @param message - Erfolgsmeldung
   * @param statusCode - HTTP-Statuscode
   */
  protected sendSuccessResponse(
    res: Response, 
    data: any, 
    message: string = 'Operation erfolgreich',
    statusCode: number = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      data,
      message
    });
  }
  
  /**
   * "Erstellt"-Antwort senden
   * 
   * @param res - HTTP-Antwort
   * @param data - Antwortdaten
   * @param message - Erfolgsmeldung
   */
  protected sendCreatedResponse(
    res: Response, 
    data: any, 
    message: string = 'Ressource erfolgreich erstellt'
  ): void {
    this.sendSuccessResponse(res, data, message, 201);
  }
  
  /**
   * Paginierte Antwort senden
   * 
   * @param res - HTTP-Antwort
   * @param data - Antwortdaten
   * @param pagination - Paginierungsinformationen
   * @param message - Erfolgsmeldung
   */
  protected sendPaginatedResponse(
    res: Response, 
    data: any[], 
    pagination: any,
    message: string = 'Operation erfolgreich'
  ): void {
    res.status(200).json({
      success: true,
      data,
      meta: {
        pagination
      },
      message
    });
  }
  
  /**
   * Authentifizierten Benutzer aus der Anfrage erhalten
   * 
   * @param req - HTTP-Anfrage
   * @returns Authentifizierter Benutzer oder null
   */
  protected getAuthenticatedUser(req: Request): AuthenticatedRequest['user'] | null {
    return (req as AuthenticatedRequest).user || null;
  }
  
  /**
   * Paginierungsparameter aus der Anfrage extrahieren
   * 
   * @param req - HTTP-Anfrage
   * @returns Paginierungsparameter
   */
  protected getPaginationParams(req: Request): { page: number; limit: number } {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    return { page, limit };
  }
}