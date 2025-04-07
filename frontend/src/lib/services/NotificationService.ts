import { BaseService } from '../core/BaseService.js';
import { INotificationService } from '../lib/interfaces/INotificationService.js';
import { INotificationRepository } from '../lib/interfaces/INotificationRepository.js';
import { ILoggingService } from '../lib/interfaces/ILoggingService.js';
import { IValidationService } from '../lib/interfaces/IValidationService.js';
import { IErrorHandler } from '../lib/interfaces/IErrorHandler.js';
import { Notification, NotificationType } from '../entities/Notification.js';
import { 
  NotificationCreateDto, 
  NotificationResponseDto, 
  MarkNotificationReadDto,
  NotificationFilterDto,
  NotificationStatsDto,
  getNotificationIcon,
  getNotificationClass,
  getNotificationLink
} from '../dtos/NotificationDtos.js';
import { NotFoundError, ForbiddenError } from '../lib/interfaces/IErrorHandler.js';
import { ServiceOptions } from '../interfaces/IBaseService.js';
import { NotificationEventManager, NotificationEventType } from '../events/NotificationEventManager.js';

/**
 * Implementation of INotificationService
 */
export class NotificationService extends BaseService<
  Notification,
  NotificationCreateDto,
  any,
  NotificationResponseDto
> implements INotificationService {
  /**
   * Creates a new NotificationService instance
   * 
   * @param notificationRepository - Notification repository
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly notificationRepository: INotificationRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    super(notificationRepository, logger, validator, errorHandler);
    
    // Set logger for event manager
    NotificationEventManager.getInstance().setLogger(logger);
    
    // Register event listeners
    this.registerEventListeners();
    
    this.logger.debug('Initialized NotificationService with event listeners');
  }
  
  /**
   * Register event listeners for notifications
   */
  private registerEventListeners(): void {
    const eventManager = NotificationEventManager.getInstance();
    
    // Contact request events
    eventManager.on(NotificationEventType.CONTACT_REQUEST_CREATED, async (data: any) => {
      try {
        await this.createNotification({
          userId: data.recipientId,
          title: 'New Contact Request',
          message: `${data.senderName} has sent you a contact request`,
          type: NotificationType.MESSAGE,
          referenceId: data.requestId,
          referenceType: 'contact_request'
        });
      } catch (error) {
        this.logger.error('Error creating contact request notification', error instanceof Error ? error : String(error));
      }
    });
    
    eventManager.on(NotificationEventType.CONTACT_REQUEST_ACCEPTED, async (data: any) => {
      try {
        await this.createNotification({
          userId: data.senderId,
          title: 'Contact Request Accepted',
          message: `${data.recipientName} has accepted your contact request`,
          type: NotificationType.SUCCESS,
          referenceId: data.requestId,
          referenceType: 'contact_request'
        });
      } catch (error) {
        this.logger.error('Error creating contact request accepted notification', error instanceof Error ? error : String(error));
      }
    });
    
    // User events
    eventManager.on(NotificationEventType.USER_STATUS_CHANGED, async (data: any) => {
      try {
        await this.createNotification({
          userId: data.userId,
          title: 'Account Status Changed',
          message: `Your account status has been changed to ${data.newStatus}`,
          type: data.newStatus === 'active' ? NotificationType.SUCCESS : NotificationType.WARNING,
          referenceType: 'user'
        });
      } catch (error) {
        this.logger.error('Error creating user status notification', error instanceof Error ? error : String(error));
      }
    });
    
    // System events
    eventManager.on(NotificationEventType.SYSTEM_MAINTENANCE, async (data: any) => {
      try {
        // Create notification for all affected users
        const userIds = data.userIds || [];
        if (userIds.length > 0) {
          await this.createBulkNotifications(
            userIds,
            'Scheduled Maintenance',
            data.message || 'The system will undergo maintenance soon',
            NotificationType.INFO
          );
        }
      } catch (error) {
        this.logger.error('Error creating system maintenance notification', error instanceof Error ? error : String(error));
      }
    });
    
    // Add more event listeners as needed
  }

  /**
   * Mark notifications as read
   * 
   * @param userId - User ID
   * @param data - Mark as read data
   * @returns Promise with number of notifications marked as read
   */
  async markNotificationsRead(userId: number, data: MarkNotificationReadDto): Promise<number> {
    try {
      if (data.markAll) {
        return this.notificationRepository.markAsRead(userId);
      }

      if (data.notificationId) {
        // Verify notification belongs to user
        const notification = await this.repository.findById(data.notificationId);
        if (!notification) {
          throw this.errorHandler.createNotFoundError('Notification not found');
        }
        
        if (notification.userId !== userId) {
          throw this.errorHandler.createForbiddenError('You do not have permission to access this notification');
        }

        return this.notificationRepository.markAsRead(userId, data.notificationId);
      }

      throw this.errorHandler.createNotFoundError('No notifications specified');
    } catch (error) {
      this.logger.error('Error marking notifications as read', error instanceof Error ? error : String(error), { userId, data });
      throw this.handleError(error);
    }
  }

  /**
   * Get notification statistics for a user
   * 
   * @param userId - User ID
   * @returns Promise with notification statistics
   */
  async getNotificationStats(userId: number): Promise<NotificationStatsDto> {
    try {
      // Get total count
      const totalCount = await this.repository.count({
        userId
      });

      // Get unread count
      const unreadCount = await this.repository.count({
        userId,
        read: false
      });

      // Get counts by type
      const byType: Record<string, number> = {};
      
      // Initialize with zeros for all notification types
      Object.values(NotificationType).forEach(type => {
        byType[type] = 0;
      });

      // Get counts for each type from repository
      const typeCounts = await this.notificationRepository.getCountsByType(userId);
      
      // Populate the byType object with actual counts
      typeCounts.forEach(item => {
        byType[item.type] = item.count;
      });

      return {
        totalCount,
        unreadCount,
        byType
      };
    } catch (error) {
      this.logger.error('Error getting notification statistics', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Create a new notification
   * 
   * @param data - Notification data
   * @returns Promise with created notification
   */
  async createNotification(data: NotificationCreateDto): Promise<NotificationResponseDto> {
    try {
      return await this.create(data);
    } catch (error) {
      this.logger.error('Error creating notification', error instanceof Error ? error : String(error), { data });
      throw this.handleError(error);
    }
  }

  /**
   * Delete a user's notification
   * 
   * @param userId - User ID
   * @param notificationId - Notification ID
   * @returns Promise with deleted notification
   */
  async deleteUserNotification(userId: number, notificationId: number): Promise<NotificationResponseDto> {
    try {
      // Verify notification belongs to user
      const notification = await this.repository.findById(notificationId);
      
      if (!notification) {
        throw this.errorHandler.createNotFoundError('Notification not found');
      }
      
      if (notification.userId !== userId) {
        throw this.errorHandler.createForbiddenError('You do not have permission to delete this notification');
      }

      // Delete notification
      const deleted = await this.repository.delete(notificationId);
      
      // If delete returns a boolean, get the notification data first
      if (typeof deleted === 'boolean') {
        return this.toDTO(notification);
      }
      
      return this.toDTO(deleted as Notification);
    } catch (error) {
      this.logger.error('Error deleting notification', error instanceof Error ? error : String(error), { userId, notificationId });
      throw this.handleError(error);
    }
  }

  
  /**
   * Find all notifications with filters and pagination
   * 
   * @param query - Query parameters
   * @param options - Service options
   * @returns Promise with paginated result of notification DTOs
   */
  async findAll(
    query: NotificationFilterDto,
    options?: ServiceOptions
  ): Promise<any> {
    try {
      // Build filter criteria
      const criteria: any = {};
      if (query.userId) {
        criteria.userId = query.userId;
      }
      if (query.type) {
        criteria.type = query.type;
      }
      if (query.read !== undefined) {
        criteria.read = typeof query.read === 'string' ? query.read === 'true' : Boolean(query.read);
      }
      if (query.search) {
        criteria.title = { $like: `%${query.search}%` };
      }

      // Build pagination options
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;
      const offset = (page - 1) * limit;

      // Find all notifications with pagination and filters
      const result = await this.repository.findAll({
        criteria,
        offset,
        limit
      });

      // Map entities to DTOs
      const items = result.data.map(entity => this.toDTO(entity));

      return {
        ...result,
        data: items
      };
    } catch (error) {
      this.logger.error('Error finding all notifications', error instanceof Error ? error : String(error), { query });
      throw this.handleError(error);
    }
  }

  /**
   * Create notifications for multiple users
   * 
   * @param userIds - Array of user IDs
   * @param title - Notification title
   * @param message - Notification message
   * @param type - Notification type
   * @param referenceId - Reference ID (optional)
   * @param referenceType - Reference type (optional)
   * @returns Promise with number of notifications created
   */
  async createBulkNotifications(
    userIds: number[],
    title: string,
    message: string,
    type: NotificationType,
    referenceId?: number,
    referenceType?: string
  ): Promise<number> {
    try {
      // Create notification data for each user
      const notificationsData = userIds.map(userId => ({
        userId,
        title,
        message,
        type,
        referenceId,
        referenceType,
        read: false
      }));
      
      // Create notifications in bulk
      const notifications = await this.notificationRepository.createBulk(notificationsData);
      
      return notifications.length;
    } catch (error) {
      this.logger.error('Error creating bulk notifications', error instanceof Error ? error : String(error), { 
        userCount: userIds.length,
        title,
        type 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Map entity to response DTO
   * 
   * @param entity - Notification entity
   * @returns Notification response DTO
   */
  toDTO(entity: Notification): NotificationResponseDto {
    // Get notification type properties
    const type = entity.type;
    const icon = getNotificationIcon(type);
    const cssClass = getNotificationClass(type);
    const link = getNotificationLink(type, entity.referenceId);

    return {
      id: entity.id,
      title: entity.title,
      message: entity.message || '',
      type: cssClass,
      icon: icon,
      read: entity.read,
      time: this.formatRelativeTime(entity.createdAt),
      timestamp: entity.createdAt,
      link: link
    };
  }

  /**
   * Get validation schema for create operation
   * 
   * @returns Validation schema
   */
  protected getCreateValidationSchema(): any {
    return {
      userId: {
        type: 'number',
        required: true,
        integer: true,
        min: 1,
        messages: {
          required: 'User ID is required',
          integer: 'User ID must be an integer',
          min: 'User ID must be positive'
        }
      },
      title: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 255,
        messages: {
          required: 'Title is required',
          minLength: 'Title cannot be empty',
          maxLength: 'Title cannot exceed 255 characters'
        }
      },
      message: {
        type: 'string',
        required: false,
        maxLength: 1000,
        messages: {
          maxLength: 'Message cannot exceed 1000 characters'
        }
      },
      type: {
        type: 'enum',
        required: true,
        enum: Object.values(NotificationType),
        messages: {
          required: 'Type is required',
          enum: `Type must be one of: ${Object.values(NotificationType).join(', ')}`
        }
      },
      referenceId: {
        type: 'number',
        required: false,
        integer: true,
        min: 1,
        messages: {
          integer: 'Reference ID must be an integer',
          min: 'Reference ID must be positive'
        }
      },
      referenceType: {
        type: 'string',
        required: false,
        maxLength: 50,
        messages: {
          maxLength: 'Reference type cannot exceed 50 characters'
        }
      }
    };
  }

  /**
   * Get validation schema for update operation
   * 
   * @returns Validation schema
   */
  protected getUpdateValidationSchema(): any {
    return {
      read: {
        type: 'boolean',
        required: false
      }
    };
  }

  /**
   * Map DTO to entity
   * 
   * @param dto - DTO data
   * @param existingEntity - Existing entity (for updates)
   * @returns Entity data
   */
  protected toEntity(dto: NotificationCreateDto | any, existingEntity?: Notification): Partial<Notification> {
    if (existingEntity) {
      // Update operation
      return dto;
    }
    
    // Create operation
    return {
      ...dto,
      read: false
    };
  }

  /**
   * Format relative time
   * 
   * @param date - Date to format
   * @returns Formatted relative time
   */
  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  }
}