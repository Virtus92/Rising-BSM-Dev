/**
 * Notification entity
 * 
 * Domain entity representing a notification in the system.
 * Aligned with the Prisma schema.
 */
export class Notification {
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
  message?: string;
  
  /**
   * Description (additional details)
   */
  description?: string;
  
  /**
   * Notification type
   */
  type: NotificationType;
  
  /**
   * Whether the notification has been read
   */
  read: boolean;
  
  /**
   * Reference ID (related entity ID)
   */
  referenceId?: number;
  
  /**
   * Reference type (related entity type)
   */
  referenceType?: string;
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
  
  /**
   * Last update timestamp
   */
  updatedAt: Date;

  /**
   * Creates a new Notification instance
   * 
   * @param data - Notification data
   */
  constructor(data: Partial<Notification> = {}) {
    this.id = data.id || 0;
    this.userId = data.userId || 0;
    this.title = data.title || '';
    this.message = data.message;
    this.description = data.description;
    this.type = data.type || NotificationType.SYSTEM;
    this.read = data.read || false;
    this.referenceId = data.referenceId;
    this.referenceType = data.referenceType;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Mark notification as read
   */
  markAsRead(): void {
    this.read = true;
    this.updatedAt = new Date();
  }

  /**
   * Get time elapsed since notification was created
   * 
   * @returns Time elapsed in milliseconds
   */
  getTimeElapsed(): number {
    return Date.now() - this.createdAt.getTime();
  }

  /**
   * Get formatted time ago (e.g., "5 minutes ago")
   * 
   * @returns Formatted time ago
   */
  getTimeAgo(): string {
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    
    const elapsed = this.getTimeElapsed();
    
    if (elapsed < msPerMinute) {
      return 'Just now';
    } else if (elapsed < msPerHour) {
      const minutes = Math.round(elapsed / msPerMinute);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (elapsed < msPerDay) {
      const hours = Math.round(elapsed / msPerHour);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.round(elapsed / msPerDay);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }
}

/**
 * Notification type enum
 * Aligned with Prisma schema
 */
export enum NotificationType {
  SYSTEM = "system",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  SUCCESS = "success",
  APPOINTMENT = "appointment",
  PROJECT = "project",
  MESSAGE = "message",
  UPDATE = "update"
}