import { BaseService } from './BaseService';
import { INotificationService } from '@/domain/services/INotificationService';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { Notification } from '@/domain/entities/Notification';
import { 
  CreateNotificationDto, 
  UpdateNotificationDto, 
  NotificationResponseDto,
  NotificationFilterParamsDto,
  ReadAllNotificationsResponseDto,
  DeleteAllNotificationsResponseDto
} from '@/domain/dtos/NotificationDtos';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { NotificationType } from '@/domain/enums/CommonEnums';

/**
 * Service für Benachrichtigungen
 */
export class NotificationService extends BaseService<
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationResponseDto
> implements INotificationService {
  /**
   * Konstruktor
   * 
   * @param repository - Repository für den Datenzugriff
   * @param logger - Logging-Dienst
   * @param validator - Validierungsdienst
   * @param errorHandler - Fehlerbehandlungsdienst
   */
  constructor(
    protected readonly notificationRepository: INotificationRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    super(notificationRepository, logger, validator, errorHandler);
    
    this.logger.debug('Initialized NotificationService');
  }

  /**
   * Count notifications with optional filtering
   * 
   * @param options Options with filters
   * @returns Number of notifications matching criteria
   */
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    try {
      const criteria: Record<string, any> = {};
      
      if (options?.filters) {
        if (options.filters.userId) {
          criteria.userId = options.filters.userId;
        }
        
        if (options.filters.type) {
          criteria.type = options.filters.type;
        }
        
        if (options.filters.isRead !== undefined) {
          criteria.isRead = options.filters.isRead;
        }
        
        if (options.filters.customerId) {
          criteria.customerId = options.filters.customerId;
        }
        
        if (options.filters.appointmentId) {
          criteria.appointmentId = options.filters.appointmentId;
        }
        
        if (options.filters.contactRequestId) {
          criteria.contactRequestId = options.filters.contactRequestId;
        }
        
        if (options.filters.startDate && options.filters.endDate) {
          criteria.createdAtRange = {
            start: options.filters.startDate,
            end: options.filters.endDate
          };
        }
      }
      
      return await this.repository.count(criteria);
    } catch (error) {
      this.logger.error('Error in NotificationService.count', { 
        error, 
        filters: options?.filters 
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Find all notifications with pagination and filtering
   * 
   * @param options Service options including pagination and filters
   * @returns Paginated results
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<NotificationResponseDto>> {
    try {
      // Convert service options to repository options
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Add filter criteria if provided in options
      if (options?.filters) {
        repoOptions.criteria = {};
        
        if (options.filters.userId) {
          repoOptions.criteria.userId = options.filters.userId;
        }
        
        if (options.filters.type) {
          repoOptions.criteria.type = options.filters.type;
        }
        
        if (options.filters.isRead !== undefined) {
          repoOptions.criteria.isRead = options.filters.isRead;
        }
        
        if (options.filters.customerId) {
          repoOptions.criteria.customerId = options.filters.customerId;
        }
        
        if (options.filters.appointmentId) {
          repoOptions.criteria.appointmentId = options.filters.appointmentId;
        }
        
        if (options.filters.contactRequestId) {
          repoOptions.criteria.contactRequestId = options.filters.contactRequestId;
        }
        
        // Use direct date comparison instead of complex objects for date filtering
        if (options.filters.startDate) {
          repoOptions.criteria.createdAt = repoOptions.criteria.createdAt || {};
          repoOptions.criteria.createdAt.gte = options.filters.startDate;
        }
        
        if (options.filters.endDate) {
          repoOptions.criteria.createdAt = repoOptions.criteria.createdAt || {};
          repoOptions.criteria.createdAt.lte = options.filters.endDate;
        }
      }
      
      // Get notifications using the repository findNotifications method
      // This avoids the Symbol exports error by using a specific method optimized for Next.js server components
      const result = options?.filters && 'userId' in options.filters 
        ? await this.notificationRepository.findNotifications({
            userId: options.filters.userId as number,
            page: repoOptions.page || 1,
            limit: repoOptions.limit || 10,
            type: options.filters.type as NotificationType,
            unreadOnly: options.filters.isRead === false
          })
        : await this.repository.findAll(repoOptions);
      
      // Map entities to DTOs
      return {
        data: result.data.map(notification => this.toDTO(notification)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findAll`, { 
        error: error instanceof Error ? error.message : String(error),
        options 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Benachrichtigungen für einen Benutzer
   * 
   * @param userId - Benutzer-ID
   * @param unreadOnly - Nur ungelesene Benachrichtigungen
   * @param limit - Maximale Anzahl der Ergebnisse
   * @param options - Service-Optionen
   * @returns Benachrichtigungen
   */
  async findByUser(
    userId: number, 
    unreadOnly?: boolean, 
    limit?: number, 
    options?: ServiceOptions
  ): Promise<NotificationResponseDto[]> {
    try {
      this.logger.debug(`Finding notifications for user ${userId}`, { 
        unreadOnly, 
        limit 
      });
      
      const notifications = await this.notificationRepository.findByUser(
        userId, 
        unreadOnly || false, 
        limit
      );
      
      return notifications.map(notification => this.toDTO(notification));
    } catch (error) {
      this.logger.error('Error in NotificationService.findByUser', { 
        error, 
        userId, 
        unreadOnly 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Markiert eine Benachrichtigung als gelesen
   * 
   * @param id - Benachrichtigungs-ID
   * @param options - Service-Optionen
   * @returns Aktualisierte Benachrichtigung
   */
  async markAsRead(id: number, options?: ServiceOptions): Promise<NotificationResponseDto> {
    try {
      // Skip checking if the notification exists and go directly to mark as read
      // NotificationRepository.markAsRead already checks for existence and permissions
      const updatedNotification = await this.notificationRepository.markAsRead(id);
      
      return this.toDTO(updatedNotification);
    } catch (error) {
      this.logger.error('Error in NotificationService.markAsRead', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Markiert alle Benachrichtigungen eines Benutzers als gelesen
   * 
   * @param userId - Benutzer-ID
   * @param options - Service-Optionen
   * @returns Ergebnis der Operation
   */
  async markAllAsRead(userId: number, options?: ServiceOptions): Promise<ReadAllNotificationsResponseDto> {
    try {
      // Prüfe Benutzerberechtigungen, falls Benutzerkontext vorhanden
      if (options?.context?.userId && userId !== options.context.userId) {
        throw this.errorHandler.createForbiddenError('You do not have permission to mark notifications for this user as read');
      }
      
      // Aktualisiere alle Benachrichtigungen
      const count = await this.notificationRepository.markAllAsRead(userId);
      
      return { count };
    } catch (error) {
      this.logger.error('Error in NotificationService.markAllAsRead', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Löscht alle Benachrichtigungen eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @param options - Service-Optionen
   * @returns Ergebnis der Operation
   */
  async deleteAllForUser(userId: number, options?: ServiceOptions): Promise<DeleteAllNotificationsResponseDto> {
    try {
      // Prüfe Benutzerberechtigungen, falls Benutzerkontext vorhanden
      if (options?.context?.userId && userId !== options.context.userId) {
        throw this.errorHandler.createForbiddenError('You do not have permission to delete notifications for this user');
      }
      
      // Lösche alle Benachrichtigungen
      const count = await this.notificationRepository.deleteAllForUser(userId);
      
      return { count };
    } catch (error) {
      this.logger.error('Error in NotificationService.deleteAllForUser', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Zählt ungelesene Benachrichtigungen für einen Benutzer
   * 
   * @param userId - Benutzer-ID
   * @param options - Service-Optionen
   * @returns Anzahl ungelesener Benachrichtigungen
   */
  async countUnread(userId: number, options?: ServiceOptions): Promise<number> {
    try {
      return await this.notificationRepository.countUnread(userId);
    } catch (error) {
      this.logger.error('Error in NotificationService.countUnread', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Erstellt eine Benachrichtigung
   * 
   * @param data - Benachrichtigungsdaten
   * @param options - Service-Optionen
   * @returns Erstellte Benachrichtigung
   */
  async createNotification(data: CreateNotificationDto, options?: ServiceOptions): Promise<NotificationResponseDto> {
    try {
      // Validiere die Eingabedaten
      await this.validate(data);
      
      // Erstelle die Benachrichtigung über die Basis-Methode
      return await this.create(data, options);
    } catch (error) {
      this.logger.error('Error in NotificationService.createNotification', { error, data });
      throw this.handleError(error);
    }
  }

  /**
   * Erstellt Benachrichtigungen für mehrere Benutzer
   * 
   * @param userIds - Benutzer-IDs
   * @param title - Titel
   * @param message - Nachricht
   * @param type - Typ
   * @param referenceData - Referenzdaten
   * @param options - Service-Optionen
   * @returns Erstellte Benachrichtigungen
   */
  async createNotificationForMultipleUsers(
    userIds: number[],
    title: string,
    message: string,
    type: NotificationType,
    referenceData?: {
      customerId?: number;
      appointmentId?: number;
      contactRequestId?: number;
      link?: string;
    },
    options?: ServiceOptions
  ): Promise<NotificationResponseDto[]> {
    try {
      // Prüfe, ob Benutzer-IDs vorhanden sind
      if (!userIds.length) {
        return [];
      }
      
      // Erstelle ein Basis-Benachrichtigungsobjekt
      const baseNotification: Partial<Notification> = {
        title,
        message,
        type,
        ...referenceData
      };
      
      // Erstelle Benachrichtigungen für alle Benutzer
      const notifications = await this.notificationRepository.createForMultipleUsers(
        userIds,
        baseNotification
      );
      
      // Konvertiere zu DTOs
      return notifications.map(notification => this.toDTO(notification));
    } catch (error) {
      this.logger.error('Error in NotificationService.createNotificationForMultipleUsers', { 
        error, 
        userIds, 
        title 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Benachrichtigungen mit erweiterten Filteroptionen
   * 
   * @param filters - Filterparameter
   * @param options - Service-Optionen
   * @returns Gefundene Benachrichtigungen mit Paginierung
   */
  async findNotifications(
    filters: NotificationFilterParamsDto, 
    options?: ServiceOptions
  ): Promise<PaginationResult<NotificationResponseDto>> {
    try {
      // Prüfe Benutzerberechtigungen, falls Benutzerkontext vorhanden
      if (options?.context?.userId && filters.userId && 
          options.context.userId !== filters.userId) {
        // Erlaubnis nur für Administratoren prüfen - in einer realen Anwendung würde hier
        // eine ausführlichere Berechtigungsprüfung stattfinden
        const isAdmin = options?.context?.role === 'admin';
        
        if (!isAdmin) {
          throw this.errorHandler.createForbiddenError('You do not have permission to view notifications for this user');
        }
      }
      
      const result = await this.notificationRepository.findNotifications(filters);
      
      return {
        data: result.data.map(notification => this.toDTO(notification)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error in NotificationService.findNotifications', { error, filters });
      throw this.handleError(error);
    }
  }

  /**
   * Bereinigt alte Benachrichtigungen
   * 
   * @param olderThan - Datum, vor dem Benachrichtigungen gelöscht werden sollen
   * @param options - Service-Optionen
   * @returns Anzahl der gelöschten Benachrichtigungen
   */
  async cleanupOldNotifications(olderThan: Date, options?: ServiceOptions): Promise<number> {
    try {
      this.logger.info(`Cleaning up old notifications older than ${olderThan}`);
      
      // Prüfe, ob die Aktion von einem Administrator ausgeführt wird
      if (options?.context?.role !== 'admin') {
        throw this.errorHandler.createForbiddenError('Only administrators can clean up old notifications');
      }
      
      return await this.notificationRepository.deleteOldNotifications(olderThan);
    } catch (error) {
      this.logger.error('Error in NotificationService.cleanupOldNotifications', { error, olderThan });
      throw this.handleError(error);
    }
  }

  /**
   * Mappt eine Entität auf eine Response DTO
   * 
   * @param entity - Zu mappende Entität
   * @returns Response DTO
   */
  /**
   * Konvertiert eine DTO in eine Entität
   * 
   * @param dto - DTO
   * @returns Entität
   */
  fromDTO(dto: CreateNotificationDto | UpdateNotificationDto): Partial<Notification> {
    if (!dto) {
      return null as any;
    }
    
    if ('isRead' in dto) {
      // Update DTO
      const updateDto = dto as UpdateNotificationDto;
      return {
        title: updateDto.title,
        message: updateDto.message,
        isRead: updateDto.isRead,
        updatedAt: new Date()
      };
    } else {
      // Create DTO
      const createDto = dto as CreateNotificationDto;
      return {
        userId: createDto.userId,
        title: createDto.title,
        message: createDto.message,
        type: createDto.type,
        isRead: false,
        customerId: createDto.customerId,
        appointmentId: createDto.appointmentId,
        contactRequestId: createDto.contactRequestId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }
  
  toDTO(entity: Notification): NotificationResponseDto {
    if (!entity) {
      return null as any;
    }
    
    // Convert dates to ISO strings first to ensure they're valid
    const createdAt = entity.createdAt instanceof Date ? entity.createdAt.toISOString() : 
                      typeof entity.createdAt === 'string' ? entity.createdAt : 
                      new Date().toISOString();
    
    const updatedAt = entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : 
                      typeof entity.updatedAt === 'string' ? entity.updatedAt : 
                      createdAt;
    
    // Create the formatted date string from the createdAt value
    const formattedDate = entity.createdAt instanceof Date ? 
                         this.formatDate(entity.createdAt) : 
                         createdAt.substring(0, 10).split('-').reverse().join('.');
    
    return {
      id: entity.id,
      userId: entity.userId || 0,
      title: entity.title,
      message: entity.message || '',
      // Ensure content matches message for compatibility
      content: entity.message || '',
      type: entity.type,
      isRead: entity.isRead,
      customerId: entity.customerId,
      appointmentId: entity.appointmentId,
      contactRequestId: entity.contactRequestId,
      createdAt: createdAt,
      updatedAt: updatedAt,
      formattedDate: formattedDate
    };
  }

  /**
   * Mappt eine DTO auf eine Entität
   * 
   * @param dto - DTO-Daten
   * @param existingEntity - Vorhandene Entität (für Updates)
   * @returns Entitätsdaten
   */
  protected toEntity(
    dto: CreateNotificationDto | UpdateNotificationDto,
    existingEntity?: Notification
  ): Partial<Notification> {
    if (existingEntity) {
      // Update-Fall
      const updateDto = dto as UpdateNotificationDto;
      
      return {
        title: updateDto.title,
        message: updateDto.message,
        isRead: updateDto.isRead,
        updatedAt: new Date()
      };
    } else {
      // Create-Fall
      const createDto = dto as CreateNotificationDto;
      
      return {
        userId: createDto.userId,
        title: createDto.title,
        message: createDto.message,
        type: createDto.type,
        isRead: false,
        customerId: createDto.customerId,
        appointmentId: createDto.appointmentId,
        contactRequestId: createDto.contactRequestId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  /**
   * Gibt das Validierungsschema für die Erstellung zurück
   */
  protected getCreateValidationSchema(): any {
    return {
      type: 'object',
      required: ['userId', 'title', 'type'],
      properties: {
        userId: { type: 'number', minimum: 1 },
        title: { type: 'string', minLength: 1, maxLength: 200 },
        message: { type: 'string', maxLength: 1000 },
        type: { 
          type: 'string', 
          enum: Object.values(NotificationType) 
        },
        customerId: { type: 'number', minimum: 1 },
        appointmentId: { type: 'number', minimum: 1 },
        contactRequestId: { type: 'number', minimum: 1 },
        link: { type: 'string', maxLength: 500 }
      }
    };
  }

  /**
   * Gibt das Validierungsschema für die Aktualisierung zurück
   */
  protected getUpdateValidationSchema(): any {
    return {
      type: 'object',
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 200 },
        message: { type: 'string', maxLength: 1000 },
        isRead: { type: 'boolean' }
      }
    };
  }

  /**
   * Formatiert ein Datum
   * 
   * @param date - Zu formatierendes Datum
   * @returns Formatiertes Datum
   */
  private formatDate(date: Date): string {
    // Use ISO string formatting instead of locale-specific formatting that causes client/server mismatch
    try {
      // Format: DD.MM.YYYY HH:MM
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch (error) {
      this.logger.error('Error formatting date', { error, date });
      return date.toISOString();
    }
  }
}
