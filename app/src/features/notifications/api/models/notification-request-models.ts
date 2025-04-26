/**
 * Notification API Request Models
 */
import { NotificationType } from '@/domain/enums/CommonEnums';
import { CreateNotificationDto, UpdateNotificationDto } from '@/domain/dtos/NotificationDtos';

/**
 * Request model for creating a notification
 */
export interface CreateNotificationRequest extends CreateNotificationDto {
  /**
   * User ID to send notification to
   */
  userId: number;
  
  /**
   * Notification title
   */
  title: string;
  
  /**
   * Notification message content
   */
  message: string;
  
  /**
   * Notification type
   */
  type: NotificationType;
  
  /**
   * Optional customer ID reference
   */
  customerId?: number;
  
  /**
   * Optional appointment ID reference
   */
  appointmentId?: number;
  
  /**
   * Optional contact request ID reference
   */
  contactRequestId?: number;
  
  /**
   * Optional link for further action
   */
  link?: string;
}

/**
 * Request model for updating a notification
 */
export interface UpdateNotificationRequest extends UpdateNotificationDto {
  /**
   * Optional notification title
   */
  title?: string;
  
  /**
   * Optional notification message
   */
  message?: string;
  
  /**
   * Whether the notification has been read
   */
  isRead?: boolean;
}

/**
 * Request model for notification filter parameters
 */
export interface NotificationFilterParams {
  /**
   * Page number for pagination
   */
  page: number;
  
  /**
   * Results per page
   */
  limit: number;
  
  /**
   * Optional user ID filter
   */
  userId?: number;
  
  /**
   * Optional notification type filter
   */
  type?: NotificationType;
  
  /**
   * Whether to return only unread notifications
   */
  unreadOnly?: boolean;
  
  /**
   * Optional search term
   */
  search?: string;
  
  /**
   * Sort field
   */
  sortBy?: string;
  
  /**
   * Sort direction
   */
  sortDirection?: 'asc' | 'desc';
}
