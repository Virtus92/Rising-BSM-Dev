/**
 * Notification entity interface
 * 
 * Domain entity representing a notification in the system.
 * Aligned with the Prisma schema.
 */
export interface INotification {
  /**
   * Notification ID
   */
  id: number;
  
  /**
   * User ID (recipient)
   */
  userId?: number;
  
  /**
   * Reference ID (e.g., project ID, customer ID)
   */
  referenceId?: number;
  
  /**
   * Reference type (e.g., "project", "customer", "appointment")
   */
  referenceType?: string;
  
  /**
   * Notification type
   */
  type: NotificationType;
  
  /**
   * Notification title
   */
  title: string;
  
  /**
   * Notification message
   */
  message?: string;
  
  /**
   * Additional description
   */
  description?: string;
  
  /**
   * Whether the notification has been read
   */
  read: boolean;
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
  
  /**
   * Last update timestamp
   */
  updatedAt: Date;
  
  /**
   * ID of user who created this notification
   */
  createdBy?: number;
  
  /**
   * ID of user who last updated this notification
   */
  updatedBy?: number;
}

/**
 * Notification type enum
 */
export enum NotificationType {
  INFO = "info",
  WARNING = "warning",
  ALERT = "alert",
  SUCCESS = "success"
}
