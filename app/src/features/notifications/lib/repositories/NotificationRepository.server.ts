/**
 * Notification Repository - Server-side implementation
 * Manages notification persistence with Prisma ORM
 */
import { PrismaClient } from '@prisma/client';
import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { Notification } from '@/domain/entities/Notification';
import { NotificationFilterParamsDto } from '@/domain/dtos/NotificationDtos';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors/';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { NotificationType, CommonStatus } from '@/domain/enums/CommonEnums';
import { NotificationPaginationResult } from '../types/pagination';

export class NotificationRepository extends PrismaRepository<Notification, number> implements INotificationRepository {
  /**
   * Constructor
   * 
   * @param prisma - Prisma client
   * @param logger - Logging service
   * @param errorHandler - Error handling service
   */
  constructor(
    prisma: PrismaClient,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(prisma, 'notification', logger, errorHandler);
    this.logger.debug('Initialized NotificationRepository');
  }

  /**
   * Find notifications for a user
   */
  async findByUser(userId: number, unreadOnly: boolean = false, limit?: number): Promise<Notification[]> {
    try {
      const where: any = { userId };
      
      if (unreadOnly) {
        where.read = false;
      }
      
      const notifications = await this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      
      return notifications.map(n => this.mapToDomainEntity(n));
    } catch (error) {
      this.logger.error('Error in NotificationRepository.findByUser', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: number): Promise<Notification> {
    try {
      const updated = await this.prisma.notification.update({
        where: { id },
        data: { read: true }
      });
      
      return this.mapToDomainEntity(updated);
    } catch (error) {
      this.logger.error('Error in NotificationRepository.markAsRead', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: number): Promise<number> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          userId,
          read: false
        },
        data: { read: true }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in NotificationRepository.markAllAsRead', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllForUser(userId: number): Promise<number> {
    try {
      const result = await this.prisma.notification.deleteMany({
        where: { userId }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in NotificationRepository.deleteAllForUser', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Count unread notifications
   */
  async countUnread(userId: number): Promise<number> {
    try {
      return await this.prisma.notification.count({
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
   */
  async createForMultipleUsers(userIds: number[], notificationData: Partial<Notification>): Promise<Notification[]> {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        title: notificationData.title || 'New Notification',
        message: notificationData.message || '',
        type: notificationData.type || NotificationType.INFO,
        read: false,
        ...(notificationData.customerId && { customerId: notificationData.customerId }),
        ...(notificationData.appointmentId && { appointmentId: notificationData.appointmentId }),
        ...(notificationData.contactRequestId && { contactRequestId: notificationData.contactRequestId }),
        ...(notificationData.link && { link: notificationData.link })
      }));
      
      const created = await this.prisma.notification.createMany({
        data: notifications
      });
      
      // Fetch the created notifications
      const result = await this.prisma.notification.findMany({
        where: {
          userId: { in: userIds },
          createdAt: {
            gte: new Date(Date.now() - 1000) // Created in the last second
          }
        }
      });
      
      return result.map(n => this.mapToDomainEntity(n));
    } catch (error) {
      this.logger.error('Error in NotificationRepository.createForMultipleUsers', { error, userIds });
      throw this.handleError(error);
    }
  }

  /**
   * Find notifications with advanced filtering and cursor-based pagination
   * @param filters Filter and pagination parameters
   * @returns Paginated result with notifications
   */
  async findNotifications(filters: NotificationFilterParamsDto): Promise<NotificationPaginationResult> {
    try {
      const where: any = {};
      
      // Build the where clause based on filters
      if (filters.userId) {
        where.userId = filters.userId;
      }
      
      if (filters.type) {
        where.type = filters.type;
      }
      
      if (filters.unreadOnly) {
        where.read = false;
      }
      
      // Handle cursor-based pagination if cursor is provided
      if (filters.cursor) {
        try {
          const cursorId = parseInt(filters.cursor);
          if (!isNaN(cursorId)) {
            where.id = { lt: cursorId };
          }
        } catch (e) {
          this.logger.warn('Invalid cursor provided', { cursor: filters.cursor });
        }
      }
      
      // Determine sorting
      const sortField = filters.sortField || 'createdAt';
      const sortDirection = filters.sortDirection || 'desc';
      const orderBy: Record<string, 'asc' | 'desc'> = {
        [sortField]: sortDirection
      };
      
      // Support traditional pagination for backward compatibility
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      
      // If we're using cursor-based pagination, we don't need skip
      const skip = filters.cursor ? 0 : (page - 1) * limit;
      
      // Make database queries in parallel
      const [total, notifications] = await Promise.all([
        this.prisma.notification.count({ where }),
        this.prisma.notification.findMany({
          where,
          orderBy,
          skip,
          take: limit + 1 // Fetch one extra for cursor
        })
      ]);
      
      // Determine if there are more results
      const hasMore = notifications.length > limit;
      const items = hasMore ? notifications.slice(0, limit) : notifications;
      
      // Get the cursor for the next page
      const nextCursor = hasMore && items.length > 0 
        ? String(items[items.length - 1].id) 
        : null;
      
      // Map to domain entities
      const domainItems = items.map(n => this.mapToDomainEntity(n));
      
      // Return with enhanced pagination information
      return {
        data: domainItems,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        hasMore,
        nextCursor
      };
    } catch (error) {
      this.logger.error('Error in NotificationRepository.findNotifications', { error, filters });
      throw this.handleError(error);
    }
  }

  /**
   * Delete old notifications
   */
  async deleteOldNotifications(olderThan: Date): Promise<number> {
    try {
      const result = await this.prisma.notification.deleteMany({
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

  /**
   * Checks if a notification exists by ID
   * 
   * @param id - Notification ID
   * @returns Whether the notification exists
   */
  async exists(id: number): Promise<boolean> {
    try {
      const result = await this.prisma.notification.findUnique({
        where: { id },
        select: { id: true }
      });
      return !!result;
    } catch (error) {
      this.logger.error('Error in NotificationRepository.exists', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Checks if any notifications exist matching certain criteria
   * 
   * @param criteria - Search criteria
   * @returns Whether any notifications exist matching the criteria
   */
  async existsByCriteria(criteria: Record<string, any>): Promise<boolean> {
    try {
      const count = await this.count(criteria);
      return count > 0;
    } catch (error) {
      this.logger.error('Error in NotificationRepository.existsByCriteria', { error, criteria });
      throw this.handleError(error);
    }
  }

  /**
   * Search for notifications with specific criteria
   * 
   * @param criteria - Search criteria
   * @returns Found notifications
   */
  async search(criteria: Record<string, any>): Promise<Notification[]> {
    try {
      const processedCriteria = this.processCriteria(criteria);
      const results = await this.prisma.notification.findMany({
        where: processedCriteria,
        orderBy: { createdAt: 'desc' }
      });
      return results.map(n => this.mapToDomainEntity(n));
    } catch (error) {
      this.logger.error('Error in NotificationRepository.search', { error, criteria });
      throw this.handleError(error);
    }
  }

  /**
   * Process criteria for the ORM
   * 
   * @param criteria - Filter criteria
   * @returns ORM-specific criteria
   */
  protected processCriteria(criteria: Record<string, any>): any {
    const processed: any = {};
    
    for (const [key, value] of Object.entries(criteria)) {
      // Handle special fields
      if (key === 'isRead' && value !== undefined) {
        processed.read = value;
      } else if (key === 'read' && value !== undefined) {
        processed.read = value;
      } else if (key === 'search' && value) {
        // Handle text search
        processed.OR = [
          { title: { contains: value, mode: 'insensitive' } },
          { message: { contains: value, mode: 'insensitive' } }
        ];
      } else if (value !== undefined) {
        processed[key] = value;
      }
    }
    
    return processed;
  }

  /**
   * Implementation of activity logging
   */
  protected async logActivityImplementation(
    userId: number, 
    actionType: string, 
    details?: string,
    ipAddress?: string
  ): Promise<any> {
    // Not implemented for notifications
    return null;
  }

  /**
   * Map ORM entity to domain entity
   */
  protected mapToDomainEntity(ormEntity: any): Notification {
    if (!ormEntity) {
      throw new Error('Cannot map null entity to Notification');
    }
    
    return new Notification({
      id: ormEntity.id,
      userId: ormEntity.userId,
      title: ormEntity.title,
      message: ormEntity.message,
      type: ormEntity.type || NotificationType.INFO,
      isRead: ormEntity.read || false,
      customerId: ormEntity.customerId,
      appointmentId: ormEntity.appointmentId,
      contactRequestId: ormEntity.contactRequestId,
      link: ormEntity.link,
      createdAt: ormEntity.createdAt ? new Date(ormEntity.createdAt) : new Date(),
      updatedAt: ormEntity.updatedAt ? new Date(ormEntity.updatedAt) : new Date()
    });
  }

  /**
   * Map domain entity to ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<Notification>): any {
    const result: Record<string, any> = {};
    
    if (domainEntity.userId !== undefined) result.userId = domainEntity.userId;
    if (domainEntity.title !== undefined) result.title = domainEntity.title;
    if (domainEntity.message !== undefined) result.message = domainEntity.message;
    if (domainEntity.type !== undefined) result.type = domainEntity.type;
    if (domainEntity.isRead !== undefined) result.read = domainEntity.isRead;
    if (domainEntity.customerId !== undefined) result.customerId = domainEntity.customerId;
    if (domainEntity.appointmentId !== undefined) result.appointmentId = domainEntity.appointmentId;
    if (domainEntity.contactRequestId !== undefined) result.contactRequestId = domainEntity.contactRequestId;
    if (domainEntity.link !== undefined) result.link = domainEntity.link;
    
    if (!result.createdAt && !domainEntity.id) {
      result.createdAt = new Date();
    }
    
    result.updatedAt = new Date();
    
    return result;
  }
}
