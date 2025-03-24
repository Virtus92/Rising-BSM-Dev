/**
 * Notification Service
 * 
 * Service layer for notification operations.
 * Implements business logic for notification management.
 * @module services/notification
 */
import { BaseService } from '../utils/base.service.js';
import { Notification } from '@prisma/client';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { 
  NotificationCreateDTO, 
  NotificationResponseDTO, 
  NotificationFilterDTO,
  MarkNotificationReadDTO,
  NotificationStatsDTO,
  NotificationType,
  getNotificationIcon,
  getNotificationClass,
  getNotificationLink
} from '../types/dtos/notification.dto.js';
import { NotFoundError, ForbiddenError } from '../utils/error.utils.js';
import { formatRelativeTime } from '../utils/format.utils.js';

/**
 * Service for notification operations
 */
export class NotificationService extends BaseService<
  Notification, 
  NotificationRepository, 
  NotificationFilterDTO,
  NotificationCreateDTO,
  any, 
  NotificationResponseDTO
> {
  /**
   * Creates a new NotificationService instance
   * @param repository Notification repository instance
   */
  constructor(repository: NotificationRepository) {
    super(repository);
  }

  /**
   * Map notification entity to response DTO
   * @param entity Notification entity
   * @returns Notification response DTO
   */
  protected mapEntityToDTO(entity: Notification): NotificationResponseDTO {
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
      time: formatRelativeTime(entity.createdAt),
      timestamp: entity.createdAt,
      link: link
    };
  }

  /**
   * Mark notifications as read
   * @param userId User ID
   * @param data Mark as read options
   * @returns Number of notifications marked as read
   */
  async markNotificationsRead(
    userId: number, 
    data: MarkNotificationReadDTO
  ): Promise<number> {
    if (data.markAll) {
      return this.repository.markAsRead(userId);
    }

    if (data.notificationId) {
      // Verify notification belongs to user
      const notification = await this.repository.findById(data.notificationId);
      if (!notification) {
        throw new NotFoundError('Notification not found');
      }
      
      if (notification.userId !== userId) {
        throw new ForbiddenError('You do not have permission to access this notification');
      }

      return this.repository.markAsRead(userId, data.notificationId);
    }

    throw new NotFoundError('No notifications specified');
  }

  /**
   * Get notification statistics for a user
   * @param userId User ID
   * @returns Notification statistics
   */
  async getNotificationStats(userId: number): Promise<NotificationStatsDTO> {
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
    const typeCounts = await this.repository.getCountsByType(userId);
    
    // Populate the byType object with actual counts
    typeCounts.forEach(item => {
      byType[item.type] = item.count;
    });

    return {
      totalCount,
      unreadCount,
      byType
    };
  }

  /**
   * Create a new notification
   * @param data Notification data
   * @returns Created notification
   */
  async createNotification(data: NotificationCreateDTO): Promise<NotificationResponseDTO> {
    const notification = await this.create(data);
    return notification;
  }

  /**
   * Delete a user's notification
   * @param userId User ID
   * @param notificationId Notification ID
   * @returns Deleted notification
   */
  async deleteUserNotification(userId: number, notificationId: number): Promise<NotificationResponseDTO> {
    // Verify notification belongs to user
    const notification = await this.repository.findById(notificationId);
    
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    
    if (notification.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this notification');
    }

    // Delete notification
    const deleted = await this.repository.delete(notificationId);
    
    return this.mapEntityToDTO(deleted);
  }

  /**
   * Create a system notification for multiple users
   * @param userIds Array of user IDs
   * @param title Notification title
   * @param message Notification message
   * @param type Notification type
   * @param referenceId Reference ID (optional)
   * @param referenceType Reference type (optional)
   * @returns Number of notifications created
   */
  async createBulkNotifications(
    userIds: number[],
    title: string,
    message: string,
    type: NotificationType,
    referenceId?: number,
    referenceType?: string
  ): Promise<number> {
    const notifications = await this.repository.createBulk(
      userIds.map(userId => ({
        userId,
        title,
        message,
        type,
        referenceId,
        referenceType,
        read: false
      }))
    );
    
    return notifications.length;
  }
}