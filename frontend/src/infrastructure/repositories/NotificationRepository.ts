import { BaseRepository } from './BaseRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { Notification } from '@/domain/entities/Notification';
import { NotificationFilterParamsDto } from '@/domain/dtos/NotificationDtos';
import { PaginationResult, QueryOptions } from '@/domain/repositories/IBaseRepository';
import { NotificationType } from '@/domain/enums/CommonEnums';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';

/**
 * Implementation of the notification repository
 */
export class NotificationRepository extends BaseRepository<Notification> implements INotificationRepository {
  /**
   * Constructor
   * 
   * @param logger - Logging service
   * @param errorHandler - Error handling service
   */
  constructor(logger: ILoggingService, errorHandler: IErrorHandler) {
    super('notifications', logger, errorHandler);
  }

  /**
   * Find notifications for a specific user
   * 
   * @param userId - The user ID
   * @param unreadOnly - Whether to return only unread notifications
   * @param limit - Maximum number of notifications to return
   * @returns Array of notifications
   */
  async findByUser(userId: number, unreadOnly: boolean = false, limit?: number): Promise<Notification[]> {
    try {
      // Build query criteria
      const criteria: Record<string, any> = { userId };
      if (unreadOnly) {
        criteria.isRead = false;
      }
      
      // Build options with sorting and limit
      const options: QueryOptions = {
        sort: { field: 'createdAt', direction: 'desc' }
      };
      
      if (limit && limit > 0) {
        options.limit = limit;
      }
      
      // Execute query
      return await this.findByCriteria(criteria, options);
    } catch (error) {
      this.logger.error('Error in NotificationRepository.findByUser', { error, userId, unreadOnly, limit });
      throw this.handleError(error);
    }
  }

  /**
   * Find notifications with filters and pagination
   * 
   * @param filters - Filter parameters
   * @returns Paginated notifications
   */
  async findNotifications(filters: NotificationFilterParamsDto): Promise<PaginationResult<Notification>> {
    try {
      // Build criteria from filters
      const criteria: Record<string, any> = {};
      
      if (filters.userId) {
        criteria.userId = filters.userId;
      }
      
      if (filters.type) {
        criteria.type = filters.type;
      }
      
      if (filters.unreadOnly) {
        criteria.isRead = false;
      }
      
      // Create options for pagination and sorting
      const options: QueryOptions = {
        page: filters.page || 1,
        limit: filters.limit || 10,
        sort: { field: 'createdAt', direction: 'desc' }
      };
      
      // Use findAll with criteria and options
      const queryOptions = this.buildQueryOptions(options);
      queryOptions.where = criteria;
      
      // Execute query
      return await this.findAll(options);
    } catch (error) {
      this.logger.error('Error in NotificationRepository.findNotifications', { error, filters });
      throw this.handleError(error);
    }
  }

  /**
   * Mark a notification as read
   * 
   * @param id - The notification ID
   * @returns The updated notification
   */
  async markAsRead(id: number): Promise<Notification> {
    try {
      const notification = await this.findById(id);
      
      if (!notification) {
        throw new Error(`Notification with ID ${id} not found`);
      }
      
      // Mark as read using the entity method
      notification.markAsRead();
      
      // Update in database
      return await this.update(id, notification);
    } catch (error) {
      this.logger.error('Error in NotificationRepository.markAsRead', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Mark all notifications as read for a user
   * 
   * @param userId - The user ID
   * @returns The number of notifications marked as read
   */
  async markAllAsRead(userId: number): Promise<number> {
    try {
      // Find all unread notifications for the user
      const unreadNotifications = await this.findByCriteria({
        userId,
        isRead: false
      });
      
      // Mark each notification as read
      const updatePromises = unreadNotifications.map(notification => {
        notification.markAsRead();
        return this.update(notification.id, notification);
      });
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      return unreadNotifications.length;
    } catch (error) {
      this.logger.error('Error in NotificationRepository.markAllAsRead', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Delete all notifications for a user
   * 
   * @param userId - The user ID
   * @returns The number of notifications deleted
   */
  async deleteAllForUser(userId: number): Promise<number> {
    try {
      // Find all notifications for the user
      const notifications = await this.findByCriteria({ userId });
      
      // Delete each notification
      const deletePromises = notifications.map(notification => 
        this.delete(notification.id)
      );
      
      // Wait for all deletions to complete
      await Promise.all(deletePromises);
      
      return notifications.length;
    } catch (error) {
      this.logger.error('Error in NotificationRepository.deleteAllForUser', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Count unread notifications for a user
   * 
   * @param userId - The user ID
   * @returns The number of unread notifications
   */
  async countUnread(userId: number): Promise<number> {
    try {
      return await this.count({
        userId,
        isRead: false
      });
    } catch (error) {
      this.logger.error('Error in NotificationRepository.countUnread', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Create notifications for multiple users
   * 
   * @param userIds - Array of user IDs
   * @param baseNotification - Base notification data
   * @returns Array of created notifications
   */
  async createForMultipleUsers(
    userIds: number[], 
    baseNotification: Partial<Notification>
  ): Promise<Notification[]> {
    try {
      const createdNotifications: Notification[] = [];
      
      // Create a notification for each user
      for (const userId of userIds) {
        // Create a new notification entity
        const notificationData = {
          ...baseNotification,
          userId,
          isRead: false
        };
        
        // Create notification in database
        const notification = await this.create(notificationData);
        createdNotifications.push(notification);
      }
      
      return createdNotifications;
    } catch (error) {
      this.logger.error('Error in NotificationRepository.createForMultipleUsers', { error, userIds });
      throw this.handleError(error);
    }
  }

  /**
   * Delete old notifications
   * 
   * @param olderThan - Date threshold
   * @returns Number of deleted notifications
   */
  async deleteOldNotifications(olderThan: Date): Promise<number> {
    try {
      // Find notifications older than the specified date
      const oldNotifications = await this.executeQuery('findMany', {
        where: {
          createdAt: {
            lt: olderThan
          }
        }
      });
      
      // Delete each notification
      const deletePromises: Promise<Notification>[] = oldNotifications.map((notification: Notification) => 
        this.delete(notification.id)
      );
      
      // Wait for all deletions to complete
      await Promise.all(deletePromises);
      
      return oldNotifications.length;
    } catch (error) {
      this.logger.error('Error in NotificationRepository.deleteOldNotifications', { error, olderThan });
      throw this.handleError(error);
    }
  }
  
  // Required implementations for abstract methods from BaseRepository
  
  /**
   * Begin a database transaction
   */
  protected async beginTransaction(): Promise<void> {
    // Implementation of transaction start
    await this.executeQuery('beginTransaction');
  }

  /**
   * Commit a database transaction
   */
  protected async commitTransaction(): Promise<void> {
    // Implementation of transaction commit
    await this.executeQuery('commitTransaction');
  }

  /**
   * Rollback a database transaction
   */
  protected async rollbackTransaction(): Promise<void> {
    // Implementation of transaction rollback
    await this.executeQuery('rollbackTransaction');
  }

  /**
   * Execute a database query
   * 
   * @param operation - Operation name
   * @param args - Query arguments
   * @returns Query result
   */
  protected async executeQuery(operation: string, ...args: any[]): Promise<any> {
    // Implementation of query execution
    try {
      // Access Prisma client through model name
      const prisma = (global as any).prisma;
      if (!prisma) {
        throw new Error('Prisma client not available');
      }
      
      // Dynamically call the operation on the model
      const model = prisma[this.model];
      if (!model || typeof model[operation] !== 'function') {
        throw new Error(`Operation ${operation} not available on model ${this.model}`);
      }
      
      return await model[operation](...args);
    } catch (error) {
      this.logger.error(`Error executing query ${operation} on ${this.model}`, { error, args });
      throw error;
    }
  }

  /**
   * Build ORM-specific query options
   * 
   * @param options - Query options
   * @returns ORM-specific options
   */
  protected buildQueryOptions(options?: QueryOptions): any {
    const queryOptions: any = {};
    
    if (!options) {
      return queryOptions;
    }
    
    // Pagination
    if (options.page && options.limit) {
      queryOptions.skip = (options.page - 1) * options.limit;
      queryOptions.take = options.limit;
    } else if (options.limit) {
      queryOptions.take = options.limit;
    }
    
    // Field selection
    if (options.select && options.select.length > 0) {
      queryOptions.select = options.select.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    // Relations
    if (options.relations && options.relations.length > 0) {
      queryOptions.include = options.relations.reduce((acc, relation) => {
        acc[relation] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    // Sorting
    if (options.sort) {
      queryOptions.orderBy = {
        [options.sort.field]: options.sort.direction
      };
    }
    
    return queryOptions;
  }

  /**
   * Process criteria for the ORM
   * 
   * @param criteria - Filter criteria
   * @returns ORM-specific criteria
   */
  protected processCriteria(criteria: Record<string, any>): any {
    // Convert criteria to Prisma format
    return { where: criteria };
  }

  /**
   * Map ORM entity to domain entity
   * 
   * @param ormEntity - ORM entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(ormEntity: any): Notification {
    if (!ormEntity) {
      return null as any;
    }
    
    // Create a new Notification instance
    const notification = new Notification({
      id: ormEntity.id,
      userId: ormEntity.userId,
      title: ormEntity.title,
      message: ormEntity.message,
      type: ormEntity.type,
      isRead: ormEntity.isRead,
      customerId: ormEntity.customerId,
      appointmentId: ormEntity.appointmentId,
      contactRequestId: ormEntity.contactRequestId,
      link: ormEntity.link,
      createdAt: new Date(ormEntity.createdAt),
      updatedAt: new Date(ormEntity.updatedAt),
      createdBy: ormEntity.createdBy,
      updatedBy: ormEntity.updatedBy
    });
    
    return notification;
  }

  /**
   * Map domain entity to ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<Notification>): any {
    if (!domainEntity) {
      return null;
    }
    
    // Create a data object for Prisma
    const data: Record<string, any> = {};
    
    // Map properties
    if (domainEntity.userId !== undefined) data.userId = domainEntity.userId;
    if (domainEntity.title !== undefined) data.title = domainEntity.title;
    if (domainEntity.message !== undefined) data.message = domainEntity.message;
    if (domainEntity.type !== undefined) data.type = domainEntity.type;
    if (domainEntity.isRead !== undefined) data.isRead = domainEntity.isRead;
    if (domainEntity.customerId !== undefined) data.customerId = domainEntity.customerId;
    if (domainEntity.appointmentId !== undefined) data.appointmentId = domainEntity.appointmentId;
    if (domainEntity.contactRequestId !== undefined) data.contactRequestId = domainEntity.contactRequestId;
    if (domainEntity.link !== undefined) data.link = domainEntity.link;
    if (domainEntity.createdAt !== undefined) data.createdAt = domainEntity.createdAt;
    if (domainEntity.updatedAt !== undefined) data.updatedAt = domainEntity.updatedAt;
    if (domainEntity.createdBy !== undefined) data.createdBy = domainEntity.createdBy;
    if (domainEntity.updatedBy !== undefined) data.updatedBy = domainEntity.updatedBy;
    
    return data;
  }

  /**
   * Check if an error is a database error
   * 
   * @param error - Error to check
   * @returns Whether the error is a database error
   */
  protected isDatabaseError(error: any): boolean {
    return (
      error &&
      typeof error === 'object' &&
      (error.code !== undefined || error.name === 'PrismaClientKnownRequestError')
    );
  }

  /**
   * Check if an error violates a unique constraint
   * 
   * @param error - Error to check
   * @returns Whether the error violates a unique constraint
   */
  protected isUniqueConstraintError(error: any): boolean {
    return (
      this.isDatabaseError(error) &&
      (error.code === 'P2002' || // Prisma unique constraint error
       (typeof error.message === 'string' && error.message.includes('unique constraint')))
    );
  }

  /**
   * Check if an error violates a foreign key constraint
   * 
   * @param error - Error to check
   * @returns Whether the error violates a foreign key constraint
   */
  protected isForeignKeyConstraintError(error: any): boolean {
    return (
      this.isDatabaseError(error) &&
      (error.code === 'P2003' || // Prisma foreign key constraint error
       (typeof error.message === 'string' && error.message.includes('foreign key constraint')))
    );
  }
}
