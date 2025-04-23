import { BaseRepository } from './BaseRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { Notification } from '@/domain/entities/Notification';
import { NotificationFilterParamsDto } from '@/domain/dtos/NotificationDtos';
import { PaginationResult, QueryOptions } from '@/domain/repositories/IBaseRepository';
import { NotificationType } from '@/domain/enums/CommonEnums';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { PrismaClient } from '@prisma/client';

/**
 * Implementation of the notification repository
 */
export class NotificationRepository extends BaseRepository<Notification> implements INotificationRepository {
  protected prismaClient: PrismaClient;

  constructor(
    prismaClient: PrismaClient,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    // Note: Changed model name from 'notifications' to 'notification' to match Prisma model name convention
    super('notification', logger, errorHandler);
    this.prismaClient = prismaClient;
  }

  /**
   * Override findById to use a server-safe implementation
   * 
   * @param id - The notification ID
   * @param options - Query options
   * @returns The notification or null
   */
  async findById(id: number, options?: QueryOptions): Promise<Notification | null> {
    try {
      // Use the injected prismaClient instance to avoid Symbol exports error
      if (!this.prismaClient) {
        throw new Error('Prisma client not available');
      }
      
      // Direct access to the notification model to avoid Symbol exports error
      const model = this.prismaClient.notification;
      if (!model) {
        throw new Error('Notification model not found in Prisma client');
      }
      
      // Build query options including any relations needed
      const queryOptions = this.buildQueryOptions(options) || {};
      
      // Execute the findUnique query with proper id query
      const result = await model.findUnique({
        ...queryOptions,
        where: { id }
      });
      
      // Map to domain entity or return null
      return result ? this.mapToDomainEntity(result) : null;
    } catch (error) {
      this.logger.error('Error in NotificationRepository.findById', { error, id, options });
      throw this.handleError(error);
    }
  }

  /**
   * Override findAll to use a server-safe implementation
   * 
   * @param options - Query options
   * @returns Paginated notifications
   */
  async findAll(options?: QueryOptions): Promise<PaginationResult<Notification>> {
    try {
      const queryOptions = this.buildQueryOptions(options);
      
      // Use the injected prismaClient instance to avoid Symbol exports error
      if (!this.prismaClient) {
        throw new Error('Prisma client not available');
      }
      
      // Direct access to the notification model to avoid Symbol exports error
      const model = this.prismaClient.notification;
      if (!model) {
        throw new Error('Notification model not found in Prisma client');
      }
      
      // Apply additional criteria if available (outside of QueryOptions)
      const additionalCriteria = (options as any)?.criteria;
      if (additionalCriteria) {
        queryOptions.where = { ...queryOptions.where, ...additionalCriteria };
      }
      
      // Execute the findMany query with proper type assertion
      const findOptions = { ...queryOptions };
      const results = await model.findMany(findOptions);
      
      // Count total using a simpler approach to avoid Symbol exports error
      let total = 0;
      try {
        const countWhere = queryOptions.where || {};
        // Use a direct count method to avoid Symbol exports error
        const result = await model.count({ where: countWhere });
        total = typeof result === 'number' ? result : 0;
      } catch (countError) {
        this.logger.error('Error counting notifications, using result length instead', { countError });
        total = results.length;
      }
      
      // Calculate pagination
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const totalPages = Math.ceil(total / limit) || 1;
      
      // Map to domain entities
      const data = Array.isArray(results) ? results.map(entity => this.mapToDomainEntity(entity)) : [];
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error('Error in NotificationRepository.findAll', { error, options });
      throw this.handleError(error);
    }
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
      // Use direct query to avoid Symbol exports issues
      if (!this.prismaClient) {
        throw new Error('Prisma client not available');
      }
      
      // Direct model access
      const model = this.prismaClient.notification;
      
      // Build where conditions
      const where: Record<string, any> = { userId };
      if (unreadOnly) {
        where.read = false;
      }
      
      // Build query options
      const queryOptions: any = {
        where,
        orderBy: { createdAt: 'desc' }
      };
      
      if (limit && limit > 0) {
        queryOptions.take = limit;
      }
      
      // Execute query directly
      const results = await model.findMany(queryOptions);
      
      // Map to domain entities
      return results.map(entity => this.mapToDomainEntity(entity));
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
      // Build where conditions directly from filters
      const where: Record<string, any> = {};
      
      if (filters.userId) {
        where.userId = filters.userId;
      }
      
      if (filters.type) {
        where.type = filters.type;
      }
      
      if (filters.unreadOnly) {
        where.read = false;
      }
      
      // Prepare pagination parameters
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;
      
      // Execute direct query to avoid Symbol exports issue
      if (!this.prismaClient) {
        throw new Error('Prisma client not available');
      }
      
      // Use direct model reference instead of dynamic access
      const model = this.prismaClient.notification;
      
      // Execute queries directly against the model
      const results = await model.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
      
      // Count total records
      const total = await model.count({ where });
      
      // Calculate total pages
      const totalPages = Math.ceil(total / limit) || 1;
      
      // Map to domain entities
      const data = results.map(entity => this.mapToDomainEntity(entity));
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
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
      // Get direct reference to Prisma model
      if (!this.prismaClient) {
        throw new Error('Prisma client not available');
      }
      
      const model = this.prismaClient.notification;
      
      // Find the notification
      const notificationData = await model.findUnique({
        where: { id }
      });
      
      if (!notificationData) {
        throw new Error(`Notification with ID ${id} not found`);
      }
      
      // Create domain entity and mark as read
      const notification = this.mapToDomainEntity(notificationData);
      notification.markAsRead();
      
      // Extract update data
      const updateData = this.mapToORMEntity(notification);
      
      // Update directly with Prisma
      const updatedData = await model.update({
        where: { id },
        data: { read: true, updatedAt: new Date() }
      });
      
      // Return updated entity
      return this.mapToDomainEntity(updatedData);
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
      // Get direct reference to Prisma model
      if (!this.prismaClient) {
        throw new Error('Prisma client not available');
      }
      
      const model = this.prismaClient.notification;
      
      // Update all unread notifications for the user
      const result = await model.updateMany({
        where: {
          userId,
          read: false
        },
        data: {
          read: true,
          updatedAt: new Date()
        }
      });
      
      return result.count;
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
      // Get direct reference to Prisma model
      if (!this.prismaClient) {
        throw new Error('Prisma client not available');
      }
      
      const model = this.prismaClient.notification;
      
      // Delete all notifications for the user
      const result = await model.deleteMany({
        where: { userId }
      });
      
      return result.count;
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
      // Get direct reference to Prisma model
      if (!this.prismaClient) {
        throw new Error('Prisma client not available');
      }
      
      const model = this.prismaClient.notification;
      
      // Count unread notifications
      return await model.count({
        where: {
          userId,
          read: false
        }
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
      // Get direct reference to Prisma model
      if (!this.prismaClient) {
        throw new Error('Prisma client not available');
      }
      
      const model = this.prismaClient.notification;
      const createdNotifications: Notification[] = [];
      
      // Create a notification for each user
      for (const userId of userIds) {
        // Create entity data
        const entityData = this.mapToORMEntity({
          ...baseNotification,
          userId,
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Create directly with Prisma
        const result = await model.create({
          data: entityData
        });
        
        createdNotifications.push(this.mapToDomainEntity(result));
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
      // Get direct reference to Prisma model
      if (!this.prismaClient) {
        throw new Error('Prisma client not available');
      }
      
      const model = this.prismaClient.notification;
      
      // Delete notifications older than the specified date
      const result = await model.deleteMany({
        where: {
          createdAt: {
            lt: olderThan
          }
        }
      });
      
      return result.count;
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
    // Prisma transactions are handled differently
    // This is just a placeholder to satisfy the interface
  }

  /**
   * Commit a database transaction
   */
  protected async commitTransaction(): Promise<void> {
    // Prisma transactions are handled differently
    // This is just a placeholder to satisfy the interface
  }

  /**
   * Rollback a database transaction
   */
  protected async rollbackTransaction(): Promise<void> {
    // Prisma transactions are handled differently
    // This is just a placeholder to satisfy the interface
  }

  /**
   * Execute a database query
   * 
   * @param operation - Operation name
   * @param args - Query arguments
   * @returns Query result
   */
  protected async executeQuery(operation: string, ...args: any[]): Promise<any> {
    try {
      // Use the injected prismaClient instance
      if (!this.prismaClient) {
        throw new Error('Prisma client not available');
      }
      
      // Direct access to the notifications model instead of dynamic property access
      // This avoids the Symbol exports error by using static property access
      const model = this.prismaClient.notification;
      if (!model) {
        throw new Error('Notification model not found in Prisma client');
      }
      
      // Handle operations directly to avoid Symbol exports issues
      if (operation === 'count') {
        const where = args[0]?.where || {};
        return await model.count({ where });
      }
      
      if (operation === 'findAll') {
        return await model.findMany(args[0] || {});
      }
      
      if (operation === 'findById') {
        const id = args[0];
        const options = args[1] || {};
        return await model.findUnique({
          ...options,
          where: { id }
        });
      }
      
      if (operation === 'findByCriteria') {
        const criteria = args[0].where || {};
        const options = args[1] || {};
        return await model.findMany({
          ...options,
          where: criteria
        });
      }
      
      if (operation === 'findOneByCriteria') {
        const criteria = args[0].where || {};
        const options = args[1] || {};
        return await model.findFirst({
          ...options,
          where: criteria
        });
      }
      
      if (operation === 'create') {
        return await model.create({
          data: args[0]
        });
      }
      
      if (operation === 'update') {
        const id = args[0];
        const data = args[1];
        return await model.update({
          where: { id },
          data
        });
      }
      
      if (operation === 'delete') {
        const id = args[0];
        return await model.delete({
          where: { id }
        });
      }
      
      if (operation === 'bulkUpdate') {
        const ids = args[0];
        const data = args[1];
        return await model.updateMany({
          where: {
            id: { in: ids }
          },
          data
        });
      }
      
      throw new Error(`Operation ${operation} is not directly supported in the repository`);
    } catch (error) {
      this.logger.error(`Error executing query ${operation} on notification model`, { error, args });
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
      isRead: ormEntity.read, // Map from Prisma 'read' to domain 'isRead'
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