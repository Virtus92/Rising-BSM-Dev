import { IContactService } from '../interfaces/IContactService';
import { IContactRepository } from '../interfaces/IContactRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';
import { IValidationService } from '../interfaces/IValidationService';
import { INotificationService } from '../interfaces/INotificationService';

/**
 * Service für die Verwaltung von Kontaktanfragen
 */
export class ContactService implements IContactService {
  constructor(
    private contactRepository: IContactRepository,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler,
    private validationService: IValidationService,
    private notificationService: INotificationService
  ) {}

  /**
   * Erstellt eine neue Kontaktanfrage
   */
  async create(data: any) {
    try {
      this.logger.debug('ContactService.create', { name: data.name });
      
      // Validieren der Eingabedaten
      const validationResult = this.validateContactData(data);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validierungsfehler', 400, validationResult.errors);
      }
      
      // Kontaktanfrage erstellen
      const contactData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        service: data.service,
        message: data.message,
        status: 'new',
        ipAddress: data.ipAddress || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const contactRequest = await this.contactRepository.create(contactData);
      
      // Benachrichtigung für Admins und Manager erstellen
      await this.notificationService.createSystemNotification({
        title: 'Neue Kontaktanfrage',
        message: `Eine neue Kontaktanfrage von ${data.name} wurde erstellt.`,
        type: 'info'
      }, ['admin', 'manager']);
      
      return contactRequest;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ContactService.create');
    }
  }

  /**
   * Findet eine Kontaktanfrage anhand ihrer ID
   */
  async findById(id: number) {
    try {
      this.logger.debug('ContactService.findById', { id });
      
      const request = await this.contactRepository.findById(id);
      if (!request) {
        throw this.errorHandler.createError('Kontaktanfrage nicht gefunden', 404);
      }
      
      return request;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ContactService.findById');
    }
  }

  /**
   * Findet alle Kontaktanfragen mit optionaler Filterung
   */
  async findAll(filters?: any) {
    try {
      this.logger.debug('ContactService.findAll', filters);
      
      return await this.contactRepository.findAll(filters);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ContactService.findAll');
    }
  }

  /**
   * Aktualisiert eine Kontaktanfrage
   */
  async update(id: number, data: any, userId: number, userName: string) {
    try {
      this.logger.debug('ContactService.update', { id });
      
      // Überprüfen, ob die Kontaktanfrage existiert
      const existingRequest = await this.contactRepository.findById(id);
      if (!existingRequest) {
        throw this.errorHandler.createError('Kontaktanfrage nicht gefunden', 404);
      }
      
      // Metadaten aktualisieren
      const requestData = {
        ...data,
        updatedAt: new Date()
      };
      
      // Kontaktanfrage aktualisieren
      const request = await this.contactRepository.update(id, requestData);
      
      // Aktivität loggen
      await this.contactRepository.logActivity(
        id,
        userId,
        userName,
        'update',
        `Kontaktanfrage von ${request.name} wurde aktualisiert`
      );
      
      return request;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ContactService.update');
    }
  }

  /**
   * Aktualisiert den Status einer Kontaktanfrage
   */
  async updateStatus(id: number, status: string, userId: number, userName: string) {
    try {
      this.logger.debug('ContactService.updateStatus', { id, status });
      
      // Überprüfen, ob die Kontaktanfrage existiert
      const existingRequest = await this.contactRepository.findById(id);
      if (!existingRequest) {
        throw this.errorHandler.createError('Kontaktanfrage nicht gefunden', 404);
      }
      
      // Validieren des Status
      if (!['new', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        throw this.errorHandler.createError('Ungültiger Status', 400);
      }
      
      // Status aktualisieren
      const request = await this.contactRepository.update(id, {
        status,
        processorId: userId,
        updatedAt: new Date()
      });
      
      // Aktivität loggen
      await this.contactRepository.logActivity(
        id,
        userId,
        userName,
        'status_update',
        `Status der Kontaktanfrage von ${request.name} wurde auf "${status}" geändert`
      );
      
      return request;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ContactService.updateStatus');
    }
  }

  /**
   * Fügt eine Notiz zu einer Kontaktanfrage hinzu
   */
  async addNote(requestId: number, userId: number, userName: string, text: string) {
    try {
      this.logger.debug('ContactService.addNote', { requestId, userId });
      
      // Überprüfen, ob die Kontaktanfrage existiert
      const existingRequest = await this.contactRepository.findById(requestId);
      if (!existingRequest) {
        throw this.errorHandler.createError('Kontaktanfrage nicht gefunden', 404);
      }
      
      // Validierung des Notiz-Textes
      if (!text) {
        throw this.errorHandler.createError('Notiztext ist erforderlich', 400);
      }
      
      if (text.trim().length === 0) {
        throw this.errorHandler.createError('Notiztext darf nicht leer sein', 400);
      }
      
      // Notiz hinzufügen
      const note = await this.contactRepository.addNote(requestId, userId, userName, text);
      
      // Aktivität loggen
      await this.contactRepository.logActivity(
        requestId,
        userId,
        userName,
        'add_note',
        `Notiz zur Kontaktanfrage von ${existingRequest.name} hinzugefügt`
      );
      
      return note;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ContactService.addNote');
    }
  }

  /**
   * Holt Notizen für eine Kontaktanfrage
   */
  async getRequestNotes(requestId: number) {
    try {
      this.logger.debug('ContactService.getRequestNotes', { requestId });
      
      // Überprüfen, ob die Kontaktanfrage existiert
      const existingRequest = await this.contactRepository.findById(requestId);
      if (!existingRequest) {
        throw this.errorHandler.createError('Kontaktanfrage nicht gefunden', 404);
      }
      
      return await this.contactRepository.getRequestNotes(requestId);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ContactService.getRequestNotes');
    }
  }

  /**
   * Validiert Kontaktanfragedaten
   */
  validateContactData(data: any): { isValid: boolean; errors?: any } {
    const validationRules = {
      name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      email: {
        required: true,
        type: 'email'
      },
      phone: {
        type: 'string',
        maxLength: 30
      },
      service: {
        required: true,
        type: 'string',
        maxLength: 50
      },
      message: {
        required: true,
        type: 'string',
        minLength: 10
      }
    };
    
    return this.validationService.validate(data, validationRules);
  }
}
