import { BaseRepository } from '../core/BaseRepository.js';
import { INotificationRepository } from '../interfaces/INotificationRepository.js';
import { Notification } from '../entities/Notification.js';
import { NotificationFilterDto } from '../dtos/NotificationDtos.js';
import { QueryOptions } from '../interfaces/IBaseRepository.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { PrismaClient } from '@prisma/client';

/**
 * Implementation of INotificationRepository for database operations.
 */
export class NotificationRepository extends BaseRepository<Notification, number> implements INotificationRepository {
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

      return result.map(item => ({
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
      readAt: ormEntity.readAt
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
}