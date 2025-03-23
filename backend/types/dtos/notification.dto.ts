/**
 * Notification DTOs
 * 
 * Data Transfer Objects for Notification entity operations.
 */
import { BaseCreateDTO, BaseUpdateDTO, BaseResponseDTO, BaseFilterDTO } from './base.dto.js';

/**
 * Enum for notification types
 */
export enum NotificationType {
  REQUEST = 'anfrage',
  APPOINTMENT = 'termin',
  PROJECT = 'projekt',
  WARNING = 'warnung',
  INFO = 'info',
  SYSTEM = 'system'
}

/**
 * DTO for creating a new notification
 */
export interface NotificationCreateDTO extends BaseCreateDTO {
  /**
   * User ID to notify (null for system notifications)
   */
  userId: number | null;

  /**
   * Notification type
   */
  type: string;

  /**
   * Notification title
   */
  title: string;

  /**
   * Notification message
   */
  message: string;

  /**
   * Related entity ID (optional)
   */
  referenceId?: number | null;

  /**
   * Related entity type (optional)
   */
  referenceType?: string | null;
}

/**
 * DTO for notification response
 */
export interface NotificationResponseDTO extends BaseResponseDTO {
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
   * CSS type class (success, primary, warning, info)
   */
  type: string;

  /**
   * Notification icon
   */
  icon: string;

  /**
   * Read status
   */
  read: boolean;

  /**
   * Relative time (e.g., "2 hours ago")
   */
  time: string;

  /**
   * Timestamp
   */
  timestamp: Date;

  /**
   * Link to related content
   */
  link: string;
}

/**
 * DTO for marking notifications as read
 */
export interface MarkNotificationReadDTO {
  /**
   * Specific notification ID to mark as read (optional)
   */
  notificationId?: number;

  /**
   * Flag to mark all notifications as read
   */
  markAll?: boolean;
}

/**
 * DTO for notification filtering
 */
export interface NotificationFilterDTO extends BaseFilterDTO {
  /**
   * Filter by user ID
   */
  userId?: number | string;
  
  /**
   * Filter by type
   */
  type?: string;

  /**
   * Filter by read status
   */
  read?: boolean | string;
}

/**
 * DTO for notification statistics
 */
export interface NotificationStatsDTO {
  /**
   * Total notifications count
   */
  totalCount: number;

  /**
   * Unread notifications count
   */
  unreadCount: number;

  /**
   * Notifications by type
   */
  byType: Record<string, number>;
}

/**
 * Validation schema for notification creation
 */
export const notificationCreateSchema = {
  userId: {
    type: 'number',
    required: false,
    messages: {
      type: 'User ID must be a number'
    }
  },
  type: {
    type: 'enum',
    required: true,
    enum: Object.values(NotificationType),
    messages: {
      required: 'Notification type is required',
      enum: `Type must be one of: ${Object.values(NotificationType).join(', ')}`
    }
  },
  title: {
    type: 'string',
    required: true,
    min: 2,
    max: 100,
    messages: {
      required: 'Title is required',
      min: 'Title must be at least 2 characters long',
      max: 'Title must not exceed 100 characters'
    }
  },
  message: {
    type: 'string',
    required: true,
    min: 2,
    max: 500,
    messages: {
      required: 'Message is required',
      min: 'Message must be at least 2 characters long',
      max: 'Message must not exceed 500 characters'
    }
  },
  referenceId: {
    type: 'number',
    required: false,
    messages: {
      type: 'Reference ID must be a number'
    }
  },
  referenceType: {
    type: 'string',
    required: false,
    messages: {
      type: 'Reference type must be a string'
    }
  }
};

/**
 * Validation schema for marking notifications as read
 */
export const markNotificationReadSchema = {
  notificationId: {
    type: 'number',
    required: false,
    messages: {
      type: 'Notification ID must be a number'
    }
  },
  markAll: {
    type: 'boolean',
    required: false,
    default: false
  }
};

/**
 * Get icon for notification type
 * @param type Notification type
 * @returns Icon name
 */
export function getNotificationIcon(type: string): string {
  switch (type) {
    case NotificationType.REQUEST:
      return 'envelope';
    case NotificationType.APPOINTMENT:
      return 'calendar-check';
    case NotificationType.PROJECT:
      return 'clipboard-list';
    case NotificationType.WARNING:
      return 'exclamation-triangle';
    case NotificationType.SYSTEM:
      return 'cog';
    case NotificationType.INFO:
    default:
      return 'bell';
  }
}

/**
 * Get CSS class for notification type
 * @param type Notification type
 * @returns CSS class
 */
export function getNotificationClass(type: string): string {
  switch (type) {
    case NotificationType.REQUEST:
      return 'success';
    case NotificationType.APPOINTMENT:
      return 'primary';
    case NotificationType.PROJECT:
      return 'info';
    case NotificationType.WARNING:
      return 'warning';
    case NotificationType.SYSTEM:
      return 'dark';
    case NotificationType.INFO:
    default:
      return 'secondary';
  }
}

/**
 * Get link for notification reference
 * @param type Notification type
 * @param referenceId Reference ID
 * @returns URL path
 */
export function getNotificationLink(type: string, referenceId?: number | null): string {
  if (!referenceId) return '/dashboard/notifications';
  
  switch (type) {
    case NotificationType.REQUEST:
      return `/dashboard/requests/${referenceId}`;
    case NotificationType.APPOINTMENT:
      return `/dashboard/termine/${referenceId}`;
    case NotificationType.PROJECT:
      return `/dashboard/projekte/${referenceId}`;
    default:
      return '/dashboard/notifications';
  }
}