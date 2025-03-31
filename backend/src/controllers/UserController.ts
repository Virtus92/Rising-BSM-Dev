import { Request, Response } from 'express';
import { IUserService } from '../interfaces/IUserService.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  ChangePasswordDto,
  UpdateUserStatusDto,
  UserFilterParams,
  UserResponseDto 
} from '../dtos/UserDtos.js';
import { BaseController } from '../core/BaseController.js';
import { IUserController } from '../interfaces/IUserController.js';
import { User } from '../entities/User.js';

/**
 * UserController
 * 
 * Controller für die Bearbeitung von Benutzer-bezogenen HTTP-Anfragen.
 * Leitet Benutzeranfragen an die entsprechenden Service-Methoden weiter.
 */
export class UserController extends BaseController<User, CreateUserDto, UpdateUserDto, UserResponseDto> implements IUserController {
  /**
   * Erstellt eine neue UserController-Instanz
   * 
   * @param userService - Benutzer-Service
   * @param logger - Logging-Service
   * @param errorHandler - Fehlerbehandlung
   */
  constructor(
    private readonly userService: IUserService,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(userService, logger, errorHandler);
    
    // Spezifische Methoden binden
    this.getAllUsers = this.getAllUsers.bind(this);
    this.getUserById = this.getUserById.bind(this);
    this.createUser = this.createUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.updateUserStatus = this.updateUserStatus.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.searchUsers = this.searchUsers.bind(this);
    this.getUserStatistics = this.getUserStatistics.bind(this);
    this.bulkUpdateUsers = this.bulkUpdateUsers.bind(this);
    this.softDeleteUser = this.softDeleteUser.bind(this);
    this.hardDeleteUser = this.hardDeleteUser.bind(this);
    
    this.logger.debug('Initialisiert UserController');
  }

  /**
   * Alle Benutzer abrufen
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    return this.getAll(req, res);
  }

  /**
   * Benutzer nach ID abrufen
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Benutzerdetails vom Service abrufen
      const user = await this.userService.getUserDetails(id);
      
      if (!user) {
        throw this.errorHandler.createNotFoundError(`Benutzer mit ID ${id} nicht gefunden`);
      }
      
      // Antwort senden
      this.sendSuccessResponse(res, user, 'Benutzer erfolgreich abgerufen');
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Neuen Benutzer erstellen
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  async createUser(req: Request, res: Response): Promise<void> {
    return this.create(req, res);
  }

  /**
   * Bestehenden Benutzer aktualisieren
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    return this.update(req, res);
  }

  /**
   * Benutzer löschen
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    return this.delete(req, res);
  }

  /**
   * Benutzerstatus aktualisieren
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const statusData: UpdateUserStatusDto = req.body;
      
      // Authentifizierten Benutzer abrufen
      const user = this.getAuthenticatedUser(req);
      
      // Prüfen, ob versucht wird, eigenen Status zu aktualisieren
      if (id === user?.id) {
        throw this.errorHandler.createError('Eigener Status kann nicht aktualisiert werden', 400);
      }
      
      // Status mit Kontext aktualisieren
      const updatedUser = await this.userService.updateStatus(id, statusData, {
        context: {
          userId: user?.id,
          ipAddress: req.ip
        }
      });
      
      // Antwort senden
      this.sendSuccessResponse(res, updatedUser, 'Benutzerstatus erfolgreich aktualisiert');
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Benutzerpasswort ändern
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const passwordData: ChangePasswordDto = req.body;
      
      // Authentifizierten Benutzer abrufen
      const user = this.getAuthenticatedUser(req);
      
      // Prüfen, ob berechtigt, dieses Passwort zu ändern
      if (id !== user?.id && user?.role !== 'admin') {
        throw this.errorHandler.createForbiddenError('Nicht berechtigt, das Passwort für diesen Benutzer zu ändern');
      }
      
      // Passwort mit Kontext ändern
      const success = await this.userService.changePassword(id, passwordData, {
        context: {
          userId: user?.id,
          ipAddress: req.ip
        }
      });
      
      // Antwort senden
      this.sendSuccessResponse(
        res,
        { changed: success },
        'Passwort erfolgreich geändert'
      );
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Nach Benutzern suchen
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  async searchUsers(req: Request, res: Response): Promise<void> {
    return this.search(req, res);
  }

  /**
   * Benutzerstatistiken abrufen
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  async getUserStatistics(req: Request, res: Response): Promise<void> {
    try {
      // Statistiken vom Service abrufen
      const statistics = await this.userService.getUserStatistics();
      
      // Antwort senden
      this.sendSuccessResponse(res, statistics, 'Benutzerstatistiken erfolgreich abgerufen');
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Mehrere Benutzer gleichzeitig aktualisieren
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  async bulkUpdateUsers(req: Request, res: Response): Promise<void> {
    return this.bulkUpdate(req, res);
  }

  /**
   * Benutzer als gelöscht markieren (Soft Delete)
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  async softDeleteUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Authentifizierten Benutzer abrufen
      const user = this.getAuthenticatedUser(req);
      
      // Prüfen, ob versucht wird, sich selbst zu löschen
      if (id === user?.id) {
        throw this.errorHandler.createError('Eigenes Konto kann nicht gelöscht werden', 400);
      }
      
      // Benutzer mit Kontext als gelöscht markieren
      const success = await this.userService.softDelete(id, {
        context: {
          userId: user?.id,
          ipAddress: req.ip
        }
      });
      
      // Antwort senden
      this.sendSuccessResponse(
        res,
        { id, deleted: success },
        'Benutzer erfolgreich als gelöscht markiert'
      );
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Benutzer dauerhaft löschen (Hard Delete)
   * 
   * @param req - HTTP-Anfrage
   * @param res - HTTP-Antwort
   */
  async hardDeleteUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Authentifizierten Benutzer abrufen
      const user = this.getAuthenticatedUser(req);
      
      // Prüfen, ob versucht wird, sich selbst zu löschen
      if (id === user?.id) {
        throw this.errorHandler.createError('Eigenes Konto kann nicht gelöscht werden', 400);
      }
      
      // Nur Administratoren können Benutzer dauerhaft löschen
      if (user?.role !== 'admin') {
        throw this.errorHandler.createForbiddenError('Nur Administratoren können Benutzer dauerhaft löschen');
      }
      
      // Benutzer mit Kontext dauerhaft löschen
      const success = await this.userService.hardDelete(id, {
        context: {
          userId: user?.id,
          ipAddress: req.ip
        }
      });
      
      // Antwort senden
      this.sendSuccessResponse(
        res,
        { id, deleted: success },
        'Benutzer erfolgreich dauerhaft gelöscht'
      );
    } catch (error) {
      this.handleError(error, res);
    }
  }
}