import { BaseRepository } from '../core/BaseRepository.js';
import { INotificationRepository } from '../../types/interfaces/INotificationRepository.js';
import { Notification } from '../entities/Notification.js';
import { NotificationFilterDto } from '../dtos/NotificationDtos.js';
import { QueryOptions } from '../../types/interfaces/IBaseRepository.js';
import { ILoggingService } from '../../types/interfaces/ILoggingService.js';
import { IErrorHandler } from '../../types/interfaces/IErrorHandler.js';
import { PrismaClient } from '@prisma/client';
import Item from 'mock-fs/lib/item.js';

/**
 * Implementation of INotificationRepository for database operations.
 */
export class NotificationRepository extends BaseRepository<Notification, number> implements INotificationRepository {
  /**
 * Begin a transaction
 */
protected async beginTransaction(): Promise<void> {
  try {
    // Prisma handles transactions differently, so we initiate the transaction context
    // but don't need to do anything specific here since actual transactions are executed
    // within a callback in Prisma
    this.logger.debug('Beginning transaction in NotificationRepository');
  } catch (error) {
    this.logger.error('Error beginning transaction', error instanceof Error ? error : String(error));
    throw this.handleError(error);
  }
}

/**
 * Commit a transaction
 */
protected async commitTransaction(): Promise<void> {
  try {
    // Prisma automatically commits the transaction when the callback completes successfully
    this.logger.debug('Transaction committed in NotificationRepository');
  } catch (error) {
    this.logger.error('Error committing transaction', error instanceof Error ? error : String(error));
    throw this.handleError(error);
  }
}

/**
 * Rollback a transaction
 */
protected async rollbackTransaction(): Promise<void> {
  try {
    // Prisma automatically rolls back the transaction if an error occurs in the callback
    this.logger.debug('Transaction rolled back in NotificationRepository');
  } catch (error) {
    this.logger.error('Error rolling back transaction', error instanceof Error ? error : String(error));
    throw this.handleError(error);
  }
}

/**
 * Execute a query
 * 
 * @param operation - Operation name
 * @param args - Query arguments
 * @returns Promise with query result
 */
protected async executeQuery(operation: string, ...args: any[]): Promise<any> {
  try {
    switch (operation) {
      case 'findAll':
        return await this.prisma.notification.findMany(args[0]);
        
      case 'findById':
        return await this.prisma.notification.findUnique({
          where: { id: args[0] },
          ...(args[1] || {})
        });
        
      case 'findByCriteria':
        return await this.prisma.notification.findMany({
          where: args[0],
          ...(args[1] || {})
        });
        
      case 'findOneByCriteria':
        return await this.prisma.notification.findFirst({
          where: args[0],
          ...(args[1] || {})
        });
        
      case 'create':
        return await this.prisma.notification.create({
          data: args[0]
        });
        
      case 'update':
        return await this.prisma.notification.update({
          where: { id: args[0] },
          data: args[1]
        });
        
      case 'delete':
        return await this.prisma.notification.delete({
          where: { id: args[0] }
        });
        
      case 'count':
        return await this.prisma.notification.count({
          where: args[0]
        });
        
      case 'bulkUpdate':
        return await this.bulkUpdate(args[0], args[1]);
        
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    this.logger.error(`Error executing query: ${operation}`, error instanceof Error ? error : String(error));
    throw error;
  }
}
  /**
   * Creates a new NotificationRepository instance
   * 
   * @param prisma - Prisma client
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly prisma: PrismaClient,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    // Pass model reference to BaseRepository
    super(prisma.notification, logger, errorHandler);
  }
  /**
   * Log notification-related user activity
   * 
   * @param userId - User ID
   * @param actionType - Type of action performed
   * @param details - Optional activity details
   * @param ipAddress - Optional IP address
   * @returns Promise with created activity record or null if logging failed
   */
  async logActivity(
    userId: number, 
    actionType: string, 
    details?: string,
    ipAddress?: string
  ): Promise<any> {
    try {
      this.logger.info(`User activity: ${actionType}`, {
        userId,
        actionType,
        details,
        ipAddress,
        entity: 'Notification'
      });
      
      return await this.prisma.userActivity.create({
        data: {
          userId,
          activity: actionType, 
          ipAddress
        }
      });
    } catch (error) {
      this.logger.error('Error logging notification activity', error instanceof Error ? error : String(error), { 
        userId, 
        actionType 
      });
      return null;
    }
  }

  /**
   * Mark notifications as read
   * 
   * @param userId - User ID
   * @param notificationId - Optional specific notification ID
   * @returns Promise with number of notifications marked as read
   */
  async markAsRead(userId: number, notificationId?: number): Promise<number> {
    try {
      const where: any = { 
        userId,
        read: false
      };

      // Add notification ID if provided
      if (notificationId) {
        where.id = notificationId;
      }

      // Update notifications
      const result = await this.model.updateMany({
        where,
        data: { 
          read: true,
          readAt: new Date()
        }
      });

      return result.count;
    } catch (error) {
      this.logger.error('Error marking notifications as read', error instanceof Error ? error : String(error), { userId, notificationId });
      throw this.handleError(error);
    }
  }

  /**
   * Create multiple notifications
   * 
   * @param data - Array of notification data
   * @returns Promise with created notifications
   */
  async createBulk(data: any[]): Promise<Notification[]> {
    try {
      // Create notifications in a transaction
      const notifications = await this.prisma.$transaction(
        data.map(item => 
          this.model.create({ data: item })
        )
      );
      
      // Map to domain entities
      return notifications.map(notification => this.mapToDomainEntity(notification));
    } catch (error) {
      this.logger.error('Error creating bulk notifications', error instanceof Error ? error : String(error), { count: data.length });
      throw this.handleError(error);
    }
  }

  /**
   * Get notification counts by type
   * 
   * @param userId - User ID
   * @returns Promise with array of type counts
   */
  async getCountsByType(userId: number): Promise<Array<{type: string, count: number}>> {
    try {
      const result = await this.model.groupBy({
        by: ['type'],
        where: { userId },
        _count: { type: true }
      });

      return result.map((item: { type: string; _count: { type: number } }) => ({
        type: item.type,
        count: item._count.type
      }));
    } catch (error) {
      this.logger.error('Error getting notification counts by type', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Delete all read notifications for a user
   * 
   * @param userId - User ID
   * @returns Promise with number of notifications deleted
   */
  async deleteAllRead(userId: number): Promise<number> {
    try {
      const result = await this.model.deleteMany({
        where: {
          userId,
          read: true
        }
      });

      return result.count;
    } catch (error) {
      this.logger.error('Error deleting read notifications', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Delete notifications older than a specific date
   * 
   * @param userId - User ID
   * @param olderThan - Date threshold
   * @param onlyRead - Whether to delete only read notifications
   * @returns Promise with number of notifications deleted
   */
  async deleteOld(
    userId: number, 
    olderThan: Date,
    onlyRead: boolean = true
  ): Promise<number> {
    try {
      const where: any = {
        userId,
        createdAt: { lt: olderThan }
      };

      // Add read condition if needed
      if (onlyRead) {
        where.read = true;
      }

      const result = await this.model.deleteMany({ where });
      return result.count;
    } catch (error) {
      this.logger.error('Error deleting old notifications', error instanceof Error ? error : String(error), { 
        userId, 
        olderThan, 
        onlyRead 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Process criteria for ORM
   * 
   * @param criteria - Filter criteria
   * @returns ORM-specific criteria
   */
  protected processCriteria(criteria: NotificationFilterDto): any {
    const where: any = {};
    
    // User ID filter
    if (criteria.userId) {
      where.userId = Number(criteria.userId);
    }

    // Type filter
    if (criteria.type) {
      where.type = criteria.type;
    }

    // Read status filter
    if (criteria.read !== undefined) {
      where.read = typeof criteria.read === 'string' 
        ? criteria.read === 'true' 
        : Boolean(criteria.read);
    }

    // Search filter
    if (criteria.search) {
      where.OR = [
        { title: { contains: criteria.search, mode: 'insensitive' } },
        { message: { contains: criteria.search, mode: 'insensitive' } }
      ];
    }
    
    return where;
  }

  /**
   * Build query options for ORM
   * 
   * @param options - Query options
   * @returns ORM-specific query options
   */
  protected buildQueryOptions(options?: QueryOptions): any {
    if (!options) {
      return {};
    }
    
    const result: any = {};
    
    // Add pagination
    if (options.page !== undefined && options.limit !== undefined) {
      result.skip = (options.page - 1) * options.limit;
      result.take = options.limit;
    }
    
    // Add select fields
    if (options.select && options.select.length > 0) {
      result.select = options.select.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    // Add relations
    if (options.relations && options.relations.length > 0) {
      result.include = options.relations.reduce((acc, relation) => {
        acc[relation] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    // Add sorting
    if (options.sort) {
      result.orderBy = {
        [options.sort.field]: options.sort.direction.toLowerCase()
      };
    } else {
      // Default sorting
      result.orderBy = { createdAt: 'desc' };
    }
    
    return result;
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
    
    return new Notification({
      id: ormEntity.id,
      userId: ormEntity.userId,
      title: ormEntity.title,
      message: ormEntity.message,
      type: ormEntity.type,
      read: ormEntity.read,
      referenceId: ormEntity.referenceId,
      referenceType: ormEntity.referenceType,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt
    });
  }

  /**
   * Map domain entity to ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<Notification>): any {
    // Remove undefined properties
    const result: Record<string, any> = {};
    
    Object.entries(domainEntity).forEach(([key, value]) => {
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    return result;
  }

  /**
   * Check if error is a unique constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a unique constraint violation
   */
  protected isUniqueConstraintError(error: any): boolean {
    // Prisma-specific unique constraint error code
    return error.code === 'P2002';
  }

  /**
   * Check if error is a foreign key constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a foreign key constraint violation
   */
  protected isForeignKeyConstraintError(error: any): boolean {
    // Prisma-specific foreign key constraint error code
    return error.code === 'P2003';
  }

  /**
   * Update multiple notifications at once
   * 
   * @param ids - Array of notification IDs to update
   * @param data - Data to update for all notifications
   * @returns Promise with number of notifications updated
   */
  async bulkUpdate(ids: number[], data: Partial<Notification>): Promise<number> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          id: {
            in: ids
          }
        },
        data: this.mapToORMEntity(data)
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error updating notifications in bulk', error instanceof Error ? error : String(error), { ids, data });
      throw this.handleError(error);
    }
  }
}

