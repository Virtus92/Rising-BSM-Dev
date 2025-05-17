import { BaseService } from '@/core/services/BaseService';
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
import { IValidationService } from '@/core/validation/IValidationService';
import { IErrorHandler } from '@/core/errors';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { NotificationType } from '@/domain/enums/CommonEnums';

/**
 * Service for notifications
 */
export class NotificationService extends BaseService<
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationResponseDto
> implements INotificationService {
  /**
   * Constructor
   * 
   * @param repository - Repository for data access
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handling service
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
   * Finds notifications for a user
   * 
   * @param userId - User ID
   * @param unreadOnly - Only unread notifications
   * @param limit - Maximum number of results
   * @param options - Service options
   * @returns Notifications
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
   * Marks a notification as read
   * 
   * @param id - Notification ID
   * @param options - Service options
   * @returns Updated notification
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
   * Marks all notifications of a user as read
   * 
   * @param userId - User ID
   * @param options - Service options
   * @returns Result of the operation
   */
  async markAllAsRead(userId: number, options?: ServiceOptions): Promise<ReadAllNotificationsResponseDto> {
    try {
      // Check user permissions if user context is available
      if (options?.context?.userId && userId !== options.context.userId) {
        throw this.errorHandler.createForbiddenError('You do not have permission to mark notifications for this user as read');
      }
      
      // Update all notifications
      const count = await this.notificationRepository.markAllAsRead(userId);
      
      return { count };
    } catch (error) {
      this.logger.error('Error in NotificationService.markAllAsRead', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Deletes all notifications for a user
   * 
   * @param userId - User ID
   * @param options - Service options
   * @returns Result of the operation
   */
  async deleteAllForUser(userId: number, options?: ServiceOptions): Promise<DeleteAllNotificationsResponseDto> {
    try {
      // Check user permissions if user context is available
      if (options?.context?.userId && userId !== options.context.userId) {
        throw this.errorHandler.createForbiddenError('You do not have permission to delete notifications for this user');
      }
      
      // Delete all notifications
      const count = await this.notificationRepository.deleteAllForUser(userId);
      
      return { count };
    } catch (error) {
      this.logger.error('Error in NotificationService.deleteAllForUser', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Counts unread notifications for a user
   * 
   * @param userId - User ID
   * @param options - Service options
   * @returns Number of unread notifications
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
   * Creates a notification
   * 
   * @param data - Notification data
   * @param options - Service options
   * @returns Created notification
   */
  async createNotification(data: CreateNotificationDto, options?: ServiceOptions): Promise<NotificationResponseDto> {
    try {
      // Validate input data
      await this.validate(data);
      
      // Create notification via base method
      return await this.create(data, options);
    } catch (error) {
      this.logger.error('Error in NotificationService.createNotification', { error, data });
      throw this.handleError(error);
    }
  }

  /**
   * Creates notifications for multiple users
   * 
   * @param userIds - User IDs
   * @param title - Title
   * @param message - Message
   * @param type - Type
   * @param referenceData - Reference data
   * @param options - Service options
   * @returns Created notifications
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
      // Check if user IDs are present
      if (!userIds.length) {
        return [];
      }
      
      // Create a base notification object
      const baseNotification: Partial<Notification> = {
        title,
        message,
        type,
        ...referenceData
      };
      
      // Create notifications for all users
      const notifications = await this.notificationRepository.createForMultipleUsers(
        userIds,
        baseNotification
      );
      
      // Convert to DTOs
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
   * Finds notifications with advanced filtering
   * 
   * @param filters - Filter parameters
   * @param options - Service options
   * @returns Found notifications with pagination
   */
  async findNotifications(
    filters: NotificationFilterParamsDto, 
    options?: ServiceOptions
  ): Promise<PaginationResult<NotificationResponseDto>> {
    try {
      // Check user permissions if user context is available
      if (options?.context?.userId && filters.userId && 
          options.context.userId !== filters.userId) {
        // Check permission only for administrators - in a real application, more
        // detailed permission checking would occur here
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
   * Cleans up old notifications
   * 
   * @param olderThan - Date before which notifications should be deleted
   * @param options - Service options
   * @returns Number of deleted notifications
   */
  async cleanupOldNotifications(olderThan: Date, options?: ServiceOptions): Promise<number> {
    try {
      this.logger.info(`Cleaning up old notifications older than ${olderThan}`);
      
      // Check if the action is performed by an administrator
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
   * Maps an entity to a response DTO
   * 
   * @param entity - Entity to map
   * @returns Response DTO
   */
  /**
   * Converts a DTO to an entity
   * 
   * @param dto - DTO
   * @returns Entity
   */
  fromDTO(dto: CreateNotificationDto | UpdateNotificationDto): Partial<Notification> {
    if (!dto) {
      // Return an empty object instead of null
      return {};
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
      // Return a default NotificationResponseDto instead of null
      return {
        id: 0,
        userId: 0,
        title: '',
        message: '',
        content: '',
        type: NotificationType.INFO,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        formattedDate: new Date().toLocaleDateString()
      };
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
   * Maps a DTO to an entity
   * 
   * @param dto - DTO data
   * @param existingEntity - Existing entity (for updates)
   * @returns Entity data
   */
  protected toEntity(
    dto: CreateNotificationDto | UpdateNotificationDto,
    existingEntity?: Notification
  ): Partial<Notification> {
    if (existingEntity) {
      // Update case
      const updateDto = dto as UpdateNotificationDto;
      
      return {
        title: updateDto.title,
        message: updateDto.message,
        isRead: updateDto.isRead,
        updatedAt: new Date()
      };
    } else {
      // Create case
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
   * Returns the validation schema for creation
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
   * Returns the validation schema for updates
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
   * Formats a date
   * 
   * @param date - Date to format
   * @returns Formatted date
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