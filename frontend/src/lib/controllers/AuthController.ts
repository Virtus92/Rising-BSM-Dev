import { Request, Response } from 'express';
import { IAuthController } from '../interfaces/IAuthController.js';
import { IAuthService } from '../interfaces/IAuthService.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { BaseController } from '../core/BaseController.js';
import { AuthenticatedRequest } from '../interfaces/IAuthTypes.js';
import { 
  LoginDto, 
  RefreshTokenDto, 
  ForgotPasswordDto, 
  ResetPasswordDto 
} from '../dtos/AuthDtos.js';

export class AuthController extends BaseController<any, any, any, any> implements IAuthController {
  /**
   * Erstellt eine neue AuthController-Instanz
   * 
   * @param authService - Authentifizierungsservice
   * @param logger - Logging-Service
   * @param errorHandler - Fehlerbehandlung
   */
  constructor(
    private readonly authService: IAuthService,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    // Wir übergeben den authService als nullobjekt für IBaseService, da AuthController
    // nicht direkt mit dem Standard-Repository-Muster arbeitet
    super(null as any, logger, errorHandler);
    
    // Methoden binden, um 'this'-Kontext zu erhalten
    this.login = this.login.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.validateResetToken = this.validateResetToken.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.logout = this.logout.bind(this);
    this.getResetToken = this.getResetToken.bind(this);
    
    // Implementieren der erforderlichen IBaseController-Methoden als Stubs
    this.getAll = this.notImplemented.bind(this, 'getAll');
    this.getById = this.notImplemented.bind(this, 'getById');
    this.create = this.notImplemented.bind(this, 'create');
    this.update = this.notImplemented.bind(this, 'update');
    this.delete = this.notImplemented.bind(this, 'delete');
    this.search = this.notImplemented.bind(this, 'search');
    this.bulkUpdate = this.notImplemented.bind(this, 'bulkUpdate');
  }

  /**
   * Stub-Methode für nicht implementierte Basisfunktionen
   */
  private async notImplemented(method: string, req: Request, res: Response): Promise<void> {
    throw this.errorHandler.createError(`Methode ${method} ist für Auth-Controller nicht implementiert`, 405);
  }

  /**
   * Benutzer-Login behandeln
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData = req.body as LoginDto;
      
      // Benutzer authentifizieren
      const result = await this.authService.login(loginData, { ipAddress: req.ip });
      
      // Antwort senden
      this.sendSuccessResponse(res, result, 'Login erfolgreich');
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Token-Aktualisierung behandeln
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  public async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshTokenData = req.body as RefreshTokenDto;
      
      // Token aktualisieren
      const result = await this.authService.refreshToken(refreshTokenData, { ipAddress: req.ip });
      
      // Antwort senden
      this.sendSuccessResponse(res, result, 'Token erfolgreich aktualisiert');
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * "Passwort vergessen"-Anfrage behandeln
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  public async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const forgotPasswordData = req.body as ForgotPasswordDto;
      
      // "Passwort vergessen"-Anfrage verarbeiten
      const result = await this.authService.forgotPassword(forgotPasswordData, {
        ipAddress: req.ip,
        origin: req.headers.origin || `${req.protocol}://${req.get('host')}`
      });
      
      // Antwort senden
      this.sendSuccessResponse(res, result, 'Falls die E-Mail-Adresse in unserem System existiert, wurden Anweisungen zum Zurücksetzen des Passworts gesendet');
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Reset-Token validieren
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  public async validateResetToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      
      // Token validieren
      const isValid = await this.authService.validateResetToken(token);
      
      // Antwort senden
      this.sendSuccessResponse(
        res, 
        { valid: isValid }, 
        isValid ? 'Token ist gültig' : 'Token ist ungültig oder abgelaufen'
      );
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Passwort zurücksetzen
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  public async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const resetPasswordData = req.body as ResetPasswordDto;
      
      // Passwort zurücksetzen
      const result = await this.authService.resetPassword({
        ...resetPasswordData,
        token
      }, { ipAddress: req.ip });
      
      // Antwort senden
      this.sendSuccessResponse(res, result, 'Passwort wurde erfolgreich zurückgesetzt');
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Benutzer-Logout behandeln
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  public async logout(req: Request, res: Response): Promise<void> {
    try {
      const user = this.getAuthenticatedUser(req);
      
      if (!user) {
        throw this.errorHandler.createUnauthorizedError('Authentifizierung erforderlich');
      }
      
      // Refresh-Token aus Body holen
      const { refreshToken } = req.body;
      
      // Debug-Informationen protokollieren
      this.logger.debug('Logout-Versuch', { 
        userId: user.id, 
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken ? refreshToken.length : 0
      });
      
      // Benutzer abmelden
      const result = await this.authService.logout(user.id, refreshToken, { ipAddress: req.ip });
      
      // Antwort senden
      this.sendSuccessResponse(res, result, 'Logout erfolgreich');
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Reset-Token für Tests abrufen (nur Entwicklung)
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  public async getResetToken(req: Request, res: Response): Promise<void> {
    try {
      // Prüfen, ob wir im Entwicklungsmodus sind
      if (process.env.NODE_ENV !== 'development') {
        throw this.errorHandler.createForbiddenError('Dieser Endpunkt ist nur im Entwicklungsmodus verfügbar');
      }
      
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        throw this.errorHandler.createValidationError('Validierung fehlgeschlagen', ['E-Mail ist erforderlich']);
      }
      
      // Reset-Token für Tests abrufen
      const result = await this.authService.getResetTokenForTesting(email);
      
      // Antwort senden
      this.sendSuccessResponse(res, result, 'Reset-Token für Tests abgerufen');
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // Implementierung der IBaseController Methoden
  getAll(req: Request, res: Response): Promise<void> {
    return this.notImplemented('getAll', req, res);
  }

  getById(req: Request, res: Response): Promise<void> {
    return this.notImplemented('getById', req, res);
  }

  create(req: Request, res: Response): Promise<void> {
    return this.notImplemented('create', req, res);
  }

  update(req: Request, res: Response): Promise<void> {
    return this.notImplemented('update', req, res);
  }

  delete(req: Request, res: Response): Promise<void> {
    return this.notImplemented('delete', req, res);
  }

  search(req: Request, res: Response): Promise<void> {
    return this.notImplemented('search', req, res);
  }

  bulkUpdate(req: Request, res: Response): Promise<void> {
    return this.notImplemented('bulkUpdate', req, res);
  }

  extractQueryOptions(req: Request): any {
    return {};
  }

  extractFilterCriteria(req: Request): any {
    return {};
  }
}