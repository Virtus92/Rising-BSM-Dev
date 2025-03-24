/**
 * Notification Repository
 * 
 * Data access layer for notification operations.
 * Implements database operations for notification entity.
 * @module repositories/notification
 */
import { PrismaClient, Notification, Prisma } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository.js';
import { FindManyOptions } from '../types/repository.types.js';
import { NotificationFilterDTO } from '../types/dtos/notification.dto.js';
import { QueryBuilder } from '../utils/data.utils.js';
import { logger } from '../utils/common.utils.js';

/**
 * Repository for notification operations
 */
export class NotificationRepository extends BaseRepository<Notification, NotificationFilterDTO> {
  /**
   * Creates a new NotificationRepository instance
   * @param prisma PrismaClient instance
   */
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.notification);
  }

  /**
   * Build Prisma where conditions from filter parameters
   * @param filters Filter criteria
   * @returns Prisma-compatible where conditions
   */
  protected buildFilterConditions(filters: NotificationFilterDTO): any {
    const queryBuilder = new QueryBuilder();

    // Add user ID filter
    if (filters.userId) {
      queryBuilder.addFilter('userId', Number(filters.userId));
    }

    // Add notification type filter
    if (filters.type) {
      queryBuilder.addFilter('type', filters.type);
    }

    // Add read status filter
    if (filters.read !== undefined) {
      const readStatus = typeof filters.read === 'string' 
        ? filters.read === 'true' 
        : Boolean(filters.read);
      
      queryBuilder.addFilter('read', readStatus);
    }

    // Add search filter if provided
    if (filters.search) {
      queryBuilder.addSearch(filters.search, ['title', 'message']);
    }

    return queryBuilder.build();
  }

  /**
   * Mark notifications as read
   * @param userId User ID
   * @param notificationId Optional specific notification ID
   * @returns Number of notifications marked as read
   */
  async markAsRead(userId: number, notificationId?: number): Promise<number> {
    try {
      const where: Prisma.NotificationWhereInput = { 
        userId,
        read: false
      };

      // Add notification ID if provided
      if (notificationId) {
        where.id = notificationId;
      }

      // Update notifications
      const result = await this.prisma.notification.updateMany({
        where,
        data: { read: true }
      });

      return result.count;
    } catch (error) {
      logger.error('Error marking notifications as read', { error, userId, notificationId });
      throw error;
    }
  }

  /**
   * Create multiple notifications
   * @param data Array of notification data
   * @returns Created notifications
   */
  async createBulk(data: Prisma.NotificationCreateInput[]): Promise<Notification[]> {
    try {
      // Create notifications in a transaction
      return await this.prisma.$transaction(
        data.map(item => 
          this.prisma.notification.create({ data: item })
        )
      );
    } catch (error) {
      logger.error('Error creating bulk notifications', { error, count: data.length });
      throw error;
    }
  }

  /**
   * Get notification counts by type
   * @param userId User ID
   * @returns Array of type counts
   */
  async getCountsByType(userId: number): Promise<Array<{type: string, count: number}>> {
    try {
      const result = await this.prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: { type: true }
      });

      return result.map(item => ({
        type: item.type,
        count: item._count.type
      }));
    } catch (error) {
      logger.error('Error getting notification counts by type', { error, userId });
      throw error;
    }
  }

  /**
   * Delete all read notifications for a user
   * @param userId User ID
   * @returns Number of notifications deleted
   */
  async deleteAllRead(userId: number): Promise<number> {
    try {
      const result = await this.prisma.notification.deleteMany({
        where: {
          userId,
          read: true
        }
      });

      return result.count;
    } catch (error) {
      logger.error('Error deleting read notifications', { error, userId });
      throw error;
    }
  }

  /**
   * Delete notifications older than a specific date
   * @param userId User ID
   * @param olderThan Date threshold
   * @param onlyRead Whether to delete only read notifications
   * @returns Number of notifications deleted
   */
  async deleteOld(
    userId: number, 
    olderThan: Date,
    onlyRead: boolean = true
  ): Promise<number> {
    try {
      const where: Prisma.NotificationWhereInput = {
        userId,
        createdAt: { lt: olderThan }
      };

      // Add read condition if needed
      if (onlyRead) {
        where.read = true;
      }

      const result = await this.prisma.notification.deleteMany({ where });
      return result.count;
    } catch (error) {
      logger.error('Error deleting old notifications', { 
        error, 
        userId, 
        olderThan, 
        onlyRead 
      });
      throw error;
    }
  }
}