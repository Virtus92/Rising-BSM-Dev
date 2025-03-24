/**
 * Notification Service
 * 
 * Service for Notification entity operations providing business logic and validation.
 */
import { format } from 'date-fns';
import { formatRelativeTime } from '../utils_bak/formatters.js';
import { BaseService } from '../../backend/utils/base.service.js';
import { NotificationRepository, Notification, notificationRepository } from '../repositories/notification.repository.js';
import { 
  NotificationResponseDTO,
  MarkNotificationReadDTO
} from '../../backend/types/dtos/notification.dto.js';
import { 
  NotFoundError, 
  ValidationError,
  BadRequestError
} from '../utils_bak/errors.js';
import { cache } from './cache.service.js';
import logger from '../../backend/utils/logger.js';

/**
 * Service for Notification entity operations
 */
export class NotificationService extends BaseService<Notification, NotificationRepository> {
  /**
   * Creates a new NotificationService instance
   * @param repository - NotificationRepository instance
   */
  constructor(repository: NotificationRepository = notificationRepository) {
    super(repository);
  }

  /**
   * Create a new notification
   * @param options - Notification options
   * @returns Created notification ID and success status
   */
  async create(options: {
    userId: number | null;
    type: string;
    title: string;
    message: string;
    referenceId?: number | null;
    referenceType?: string | null;
  }): Promise<{ id: number; success: boolean }> {
    try {
      const { 
        userId, 
        type, 
        title, 
        message, 
        referenceId = null, 
        referenceType = null 
      } = options;

      // Validate inputs
      if (!title) {
        throw new ValidationError('Notification title is required');
      }

      if (!type) {
        throw new ValidationError('Notification type is required');
      }

      // Insert notification
      const notification = await this.repository.create({
        userId,
        type,
        title,
        message,
        referenceId,
        referenceType,
        read: false
      });

      // Clear cache for this user if needed
      if (userId) {
        cache.delete(`notifications_${userId}`);
      }

      return {
        id: notification.id,
        success: true
      };
    } catch (error) {
      logger.error('Notification creation error:', error);
      
      // Use a more generic error to avoid exposing internal details
      throw new BadRequestError('Failed to create notification');
    }
  }

  /**
   * Get notifications for a user
   * @param userId - User ID
   * @param options - Query options like limit and unreadOnly
   * @returns Notifications and metadata
   */
  async getNotifications(
    userId: number,
    options: { limit?: number; unreadOnly?: boolean } = {}
  ): Promise<{ notifications: NotificationResponseDTO[]; unreadCount: number; totalCount: number }> {
    try {
      // Generate cache key
      const cacheKey = `notifications_${userId}_${options.limit || 10}_${options.unreadOnly ? 'unread' : 'all'}`;
      
      // Try to get from cache
      const cachedResult = cache.get<{ notifications: NotificationResponseDTO[]; unreadCount: number; totalCount: number }>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Execute queries for notifications
      const [notifications, unreadCount, totalCount] = await Promise.all([
        // Get notifications
        this.repository.getUserNotifications(userId, {
          limit: options.limit || 10,
          unreadOnly: options.unreadOnly || false
        }),
        
        // Get unread count
        this.repository.countUnreadNotifications(userId),
        
        // Get total count
        this.repository.count({
          userId: userId
        })
      ]);
      
      // Format notifications
      const formattedNotifications = this.formatNotifications(notifications);
      
      const result = {
        notifications: formattedNotifications,
        unreadCount,
        totalCount
      };
      
      // Cache the result
      cache.set(cacheKey, result, 30); // Cache for 30 seconds
      
      return result;
    } catch (error) {
      logger.error('Error retrieving notifications:', error);
      throw new BadRequestError('Failed to retrieve notifications');
    }
  }

  /**
   * Mark notifications as read
   * @param userId - User ID
   * @param data - Notification read data (either notificationId or markAll)
   * @returns Success status and count of updated notifications
   */
  async markNotificationsRead(
    userId: number,
    data: MarkNotificationReadDTO
  ): Promise<{ success: boolean; count: number }> {
    try {
      const { notificationId, markAll } = data;
      let updatedCount = 0;
      
      if (markAll) {
        // Mark all notifications as read
        updatedCount = await this.repository.markAsRead(userId);
      } else if (notificationId) {
        // Mark specific notification as read
        updatedCount = await this.repository.markAsRead(userId, notificationId);
      } else {
        throw new ValidationError('Either notification ID or mark all flag is required');
      }
      
      // Clear cache
      cache.delete(`notifications_${userId}`);
      
      return {
        success: true,
        count: updatedCount
      };
    } catch (error) {
      logger.error('Error marking notifications as read:', error);
      throw new BadRequestError('Failed to mark notifications as read');
    }
  }

  /**
 * Count unread notifications for a user
 * @param userId - User ID
 * @returns Count of unread notifications
 */
async countUnreadNotifications(userId: number): Promise<number> {
  try {
    return this.repository.countUnreadNotifications(userId);
  } catch (error) {
    logger.error('Error counting unread notifications:', error);
    throw new BadRequestError('Failed to count unread notifications');
  }
}


  /**
   * Format notifications for response
   * @param notifications - Raw notification data
   * @returns Formatted notification DTOs
   */
  private formatNotifications(notifications: any[]): NotificationResponseDTO[] {
    return notifications.map((notification: any) => {
      // Determine type and icon
      let type: string;
      let icon: string;
      
      switch (notification.type) {
        case 'anfrage':
          type = 'success';
          icon = 'envelope';
          break;
        case 'termin':
          type = 'primary';
          icon = 'calendar-check';
          break;
        case 'warnung':
          type = 'warning';
          icon = 'exclamation-triangle';
          break;
        default:
          type = 'info';
          icon = 'bell';
      }
      
      // Determine link based on type and reference
      let link: string;
      switch (notification.type) {
        case 'anfrage':
          link = `/dashboard/requests/${notification.referenceId}`;
          break;
        case 'termin':
          link = `/dashboard/termine/${notification.referenceId}`;
          break;
        case 'projekt':
          link = `/dashboard/projekte/${notification.referenceId}`;
          break;
        default:
          link = '/dashboard/notifications';
      }
      
      return {
        id: notification.id,
        title: notification.title,
        message: notification.message || '',
        type,
        icon,
        read: notification.read,
        time: formatRelativeTime(notification.createdAt),
        timestamp: notification.createdAt,
        link
      };
    });
  }

  /**
   * Map entity to DTO - not used for this service
   */
  protected mapEntityToDTO(entity: Notification): any {
    // No standard DTO mapping needed
    return entity;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;