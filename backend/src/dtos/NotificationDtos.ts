import { NotificationType } from '../entities/Notification.js';

/**
 * Base interface for notification DTOs
 */
interface BaseNotificationDto {
  /**
   * Common properties shared by all notification DTOs
   */
}

/**
 * DTO for creating a new notification
 */
export interface NotificationCreateDto extends BaseNotificationDto {
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
  message?: string;
  
  /**
   * Notification type
   */
  type: NotificationType;
  
  /**
   * Reference ID (related entity ID)
   */
  referenceId?: number;
  
  /**
   * Reference type (related entity type)
   */
  referenceType?: string;
}

/**
 * DTO for notification responses
 */
export interface NotificationResponseDto extends BaseNotificationDto {
  /**
   * Notification ID
   */
  id: number;
  
  /**
   * Notification title
   */
  title: string;
  
  /**
   * Notification message
   */
  message: string;
  
  /**
   * Notification CSS class based on type
   */
  type: string;
  
  /**
   * Notification icon based on type
   */
  icon: string;
  
  /**
   * Whether the notification has been read
   */
  read: boolean;
  
  /**
   * Relative time (e.g., "5 minutes ago")
   */
  time: string;
  
  /**
   * Creation timestamp
   */
  timestamp: Date;
  
  /**
   * Link to referenced content
   */
  link?: string;
}

/**
 * DTO for marking notifications as read
 */
export interface MarkNotificationReadDto {
  /**
   * Mark all notifications as read
   */
  markAll?: boolean;
  
  /**
   * Specific notification ID to mark as read
   */
  notificationId?: number;
}

/**
 * DTO for filtering notifications
 */
export interface NotificationFilterDto {
  /**
   * User ID who receives the notification
   */
  userId?: number;
  
  /**
   * Notification type
   */
  type?: string;
  
  /**
   * Read status
   */
  read?: boolean;
  
  /**
   * Search text
   */
  search?: string;
  
  /**
   * Pagination page number
   */
  page?: number;
  
  /**
   * Items per page
   */
  limit?: number;
}

/**
 * DTO for notification statistics
 */
export interface NotificationStatsDto {
  /**
   * Total number of notifications
   */
  totalCount: number;
  
  /**
   * Number of unread notifications
   */
  unreadCount: number;
  
  /**
   * Count by notification type
   */
  byType: Record<string, number>;
}

/**
 * Validation schema for marking notifications as read
 */
export const markNotificationReadSchema = {
  markAll: {
    type: 'boolean',
    required: false
  },
  notificationId: {
    type: 'number',
    required: false,
    integer: true,
    min: 1,
    messages: {
      integer: 'Notification ID must be an integer',
      min: 'Notification ID must be positive'
    }
  }
};

/**
 * Validation schema for notification query parameters
 */
export const notificationQuerySchema = {
  type: {
    type: 'string',
    required: false
  },
  read: {
    type: 'boolean',
    required: false
  },
  page: {
    type: 'number',
    required: false,
    integer: true,
    min: 1,
    default: 1,
    messages: {
      integer: 'Page must be an integer',
      min: 'Page must be at least 1'
    }
  },
  limit: {
    type: 'number',
    required: false,
    integer: true,
    min: 1,
    max: 100,
    default: 20,
    messages: {
      integer: 'Limit must be an integer',
      min: 'Limit must be at least 1',
      max: 'Limit cannot exceed 100'
    }
  }
};

/**
 * Get icon for notification type
 * 
 * @param type - Notification type
 * @returns Icon name
 */
export function getNotificationIcon(type: string): string {
  switch (type) {
    case NotificationType.INFO:
      return 'info-circle';
    case NotificationType.WARNING:
      return 'exclamation-triangle';
    case NotificationType.ERROR:
      return 'exclamation-circle';
    case NotificationType.SUCCESS:
      return 'check-circle';
    case NotificationType.APPOINTMENT:
      return 'calendar';
    case NotificationType.PROJECT:
      return 'folder';
    case NotificationType.MESSAGE:
      return 'envelope';
    case NotificationType.UPDATE:
      return 'sync';
    case NotificationType.SYSTEM:
    default:
      return 'bell';
  }
}

/**
 * Get CSS class for notification type
 * 
 * @param type - Notification type
 * @returns CSS class
 */
export function getNotificationClass(type: string): string {
  switch (type) {
    case NotificationType.INFO:
      return 'info';
    case NotificationType.WARNING:
      return 'warning';
    case NotificationType.ERROR:
      return 'danger';
    case NotificationType.SUCCESS:
      return 'success';
    case NotificationType.SYSTEM:
    default:
      return 'primary';
  }
}

/**
 * Get link for notification based on type and reference
 * 
 * @param type - Notification type
 * @param referenceId - Reference ID
 * @returns Link to referenced content
 */
export function getNotificationLink(type: string, referenceId?: number): string  {
  if (!referenceId) {
    return '';
  }
  
  switch (type) {
    case NotificationType.APPOINTMENT:
      return `/appointments/${referenceId}`;
    case NotificationType.PROJECT:
      return `/projects/${referenceId}`;
    case NotificationType.MESSAGE:
      return `/messages/${referenceId}`;
    default:
      return '';
  }
}

export { NotificationType };