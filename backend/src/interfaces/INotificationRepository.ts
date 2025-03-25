import { IBaseRepository } from './IBaseRepository.js';
import { Notification } from '../entities/Notification.js';
import { NotificationFilterDto } from '../dtos/NotificationDtos.js';

/**
 * INotificationRepository
 * 
 * Repository interface for Notification entity operations.
 * Extends the base repository interface with notification-specific methods.
 */
export interface INotificationRepository extends IBaseRepository<Notification, number> {
  /**
   * Mark notifications as read
   * 
   * @param userId - User ID
   * @param notificationId - Optional specific notification ID
   * @returns Promise with number of notifications marked as read
   */
  markAsRead(userId: number, notificationId?: number): Promise<number>;
  
  /**
   * Create multiple notifications
   * 
   * @param data - Array of notification data
   * @returns Promise with created notifications
   */
  createBulk(data: any[]): Promise<Notification[]>;
  
  /**
   * Get notification counts by type
   * 
   * @param userId - User ID
   * @returns Promise with array of type counts
   */
  getCountsByType(userId: number): Promise<Array<{type: string, count: number}>>;
  
  /**
   * Delete all read notifications for a user
   * 
   * @param userId - User ID
   * @returns Promise with number of notifications deleted
   */
  deleteAllRead(userId: number): Promise<number>;
  
  /**
   * Delete notifications older than a specific date
   * 
   * @param userId - User ID
   * @param olderThan - Date threshold
   * @param onlyRead - Whether to delete only read notifications
   * @returns Promise with number of notifications deleted
   */
  deleteOld(userId: number, olderThan: Date, onlyRead?: boolean): Promise<number>;
}