import { IBaseService } from './IBaseService.js';
import { Notification } from '../entities/Notification.js';
import { 
  NotificationCreateDto, 
  NotificationResponseDto, 
  NotificationFilterDto,
  MarkNotificationReadDto,
  NotificationStatsDto,
  NotificationType
} from '../dtos/NotificationDtos.js';
import { ServiceOptions } from './IBaseService.js';

/**
 * INotificationService
 * 
 * Service interface for Notification entity operations.
 * Extends the base service interface with notification-specific methods.
 */
export interface INotificationService extends IBaseService<
  Notification, 
  NotificationCreateDto, 
  any, 
  NotificationResponseDto
> {
  /**
   * Mark notifications as read
   * 
   * @param userId - User ID
   * @param data - Mark as read data
   * @returns Promise with number of notifications marked as read
   */
  markNotificationsRead(userId: number, data: MarkNotificationReadDto): Promise<number>;
  
  /**
   * Get notification statistics for a user
   * 
   * @param userId - User ID
   * @returns Promise with notification statistics
   */
  getNotificationStats(userId: number): Promise<NotificationStatsDto>;

  /**
   * Find all notifications with filters and pagination
   * 
   * @param query - Query parameters
   * @param options - Service options
   * @returns Promise with paginated result of notification DTOs
   */
  findAll(
    query: NotificationFilterDto,
    options?: ServiceOptions
  ): Promise<any>;
  
  /**
   * Create a notification
   * 
   * @param data - Notification data
   * @returns Promise with created notification
   */
  createNotification(data: NotificationCreateDto): Promise<NotificationResponseDto>;
  
  /**
   * Delete a user's notification
   * 
   * @param userId - User ID
   * @param notificationId - Notification ID
   * @returns Promise with deleted notification
   */
  deleteUserNotification(userId: number, notificationId: number): Promise<NotificationResponseDto>;
  
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
  createBulkNotifications(
    userIds: number[],
    title: string,
    message: string,
    type: NotificationType,
    referenceId?: number,
    referenceType?: string
  ): Promise<number>;
}