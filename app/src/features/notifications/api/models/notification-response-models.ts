/**
 * Notification API Response Models
 */
import { 
  NotificationResponseDto, 
  ReadAllNotificationsResponseDto, 
  DeleteAllNotificationsResponseDto 
} from '@/domain/dtos/NotificationDtos';
import { NotificationType } from '@/domain/enums/CommonEnums';

/**
 * Response model for a notification
 */
export interface NotificationResponse extends NotificationResponseDto {
  /**
   * Notification ID
   */
  id: number;
  
  /**
   * User ID who receives the notification
   */
  userId: number;
  
  /**
   * Notification title
   */
  title: string;
  
  /**
   * Notification message
   */
  message: string;
  
  /**
   * Alternative content (if message is not available)
   */
  content: string;
  
  /**
   * Notification type
   */
  type: NotificationType;
  
  /**
   * Whether the notification has been read
   */
  isRead: boolean;
  
  /**
   * When the notification was created
   */
  createdAt: string;
  
  /**
   * When the notification was last updated
   */
  updatedAt: string;
  
  /**
   * Formatted date for display
   */
  formattedDate?: string;
  
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
 * Response model for paginated notification results
 */
export interface NotificationPaginatedResponse {
  /**
   * Array of notifications
   */
  data: NotificationResponse[];
  
  /**
   * Pagination metadata
   */
  pagination: {
    /**
     * Current page number
     */
    page: number;
    
    /**
     * Results per page
     */
    limit: number;
    
    /**
     * Total number of results
     */
    total: number;
    
    /**
     * Total number of pages
     */
    totalPages: number;
  };
}

/**
 * Response model for marking all notifications as read
 */
export interface ReadAllNotificationsResponse extends ReadAllNotificationsResponseDto {
  /**
   * Number of notifications marked as read
   */
  count: number;
}

/**
 * Response model for notification deletion
 */
export interface DeleteNotificationResponse {
  /**
   * Whether the deletion was successful
   */
  success: boolean;
  
  /**
   * Optional message
   */
  message?: string;
}

/**
 * Response model for deleting all notifications
 */
export interface DeleteAllNotificationsResponse extends DeleteAllNotificationsResponseDto {
  /**
   * Number of notifications deleted
   */
  count: number;
}
