/**
 * Notification Service
 * Manages notification creation, sending, and tracking
 */
import prisma from '../utils/prisma.utils';
import { formatRelativeTime } from '../utils/formatters';
import { cache } from './cache.service';
import config from '../config';

/**
 * Interface for notification creation options
 */
export interface NotificationOptions {
  userId: number | null;
  type: string;
  title: string;
  message: string;
  referenceId?: number | null;
  referenceType?: string | null;
}

/**
 * Interface for notification item in response
 */
export interface NotificationItem {
  id: number;
  type: {
    key: string;
    label: string;
    icon: string;
    color: string;
  };
  title: string;
  message: string | null;
  referenceId: number | null;
  referenceType: string | null;
  timestamp: string;
  isRead: boolean;
  link: string;
}

/**
 * Interface for notification retrieval options
 */
export interface NotificationQueryOptions {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  type?: string | null;
}

/**
 * Interface for notification results
 */
export interface NotificationResults {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
}

/**
 * Class that manages creation and retrieval of notifications
 */
class NotificationService {
  /**
   * Create a new notification
   * @param options Notification details
   * @returns Created notification
   */
  async create(options: NotificationOptions): Promise<{ id: number; success: boolean }> {
    try {
      const {
        userId,
        type,
        title,
        message,
        referenceId = null,
        referenceType = null
      } = options;

      // Insert notification into database
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          referenceId,
          referenceType,
          read: false
        }
      });

      // Clear cache for this user
      if (userId) {
        cache.delete(`notifications_${userId}`);
      }

      return {
        id: notification.id,
        success: true
      };
    } catch (error) {
      console.error('Notification creation error:', error);
      return { id: 0, success: false };
    }
  }

  /**
   * Get notifications for a user
   * @param userId User ID
   * @param options Filtering and pagination options
   * @returns Notifications and metadata
   */
  async getNotifications(
    userId: number, 
    options: NotificationQueryOptions = {}
  ): Promise<NotificationResults> {
    try {
      const {
        limit = 10,
        offset = 0,
        unreadOnly = false,
        type = null
      } = options;

      // Try to get from cache
      const cacheKey = `notifications_${userId}_${limit}_${offset}_${unreadOnly}_${type || 'all'}`;
      
      if (config.CACHE_ENABLED) {
        const cachedResult = cache.get<NotificationResults>(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }

      // Build Prisma where clause
      const where = {
        userId,
        ...(unreadOnly ? { read: false } : {}),
        ...(type ? { type } : {})
      };

      // Execute queries in parallel
      const [notifications, totalCount] = await Promise.all([
        // Get notifications
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        
        // Get count directly instead of using groupBy
        prisma.notification.count({ where })
      ]);

      // Get unread count
      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          read: false
        }
      });

      interface NotificationData {
        id: number;
        title: string;
        message: string | null;
        type: string;
        read: boolean;
        createdAt: Date;
        referenceId: number | null;
        referenceType: string | null;
      }
      
      // Format notifications
      const formattedNotifications = notifications.map((notification: NotificationData) => ({
        id: notification.id,
        type: this.mapNotificationType(notification.type),
        title: notification.title,
        message: notification.message,
        referenceId: notification.referenceId,
        referenceType: notification.referenceType,
        timestamp: formatRelativeTime(notification.createdAt),
        isRead: notification.read,
        link: this.generateNotificationLink(notification)
      }));
      

      const result = {
        notifications: formattedNotifications,
        total: totalCount,
        unreadCount
      };

      // Cache the result
      if (config.CACHE_ENABLED) {
        cache.set(cacheKey, result, 30); // Cache for 30 seconds
      }

      return result;
    } catch (error) {
      console.error('Notification retrieval error:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   * @param userId User ID
   * @param notificationIds Notification ID(s)
   * @returns Update result
   */
  async markAsRead(
    userId: number, 
    notificationIds: number | number[]
  ): Promise<{ success: boolean; updatedCount: number }> {
    try {
      // Normalize to array
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

      // Update notifications
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          id: { in: ids }
        },
        data: {
          read: true
        }
      });

      // Clear cache for this user
      cache.delete(`notifications_${userId}`);

      return {
        success: true,
        updatedCount: result.count
      };
    } catch (error) {
      console.error('Notification mark as read error:', error);
      return { success: false, updatedCount: 0 };
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param userId User ID
   * @returns Update result
   */
  async markAllAsRead(
    userId: number
  ): Promise<{ success: boolean; updatedCount: number }> {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          read: false
        },
        data: {
          read: true
        }
      });

      // Clear cache for this user
      cache.delete(`notifications_${userId}`);

      return {
        success: true,
        updatedCount: result.count
      };
    } catch (error) {
      console.error('Notification mark all as read error:', error);
      return { success: false, updatedCount: 0 };
    }
  }

  /**
   * Map notification type to user-friendly representation
   * @param type Notification type
   * @returns Mapped notification type
   */
  private mapNotificationType(type: string): {
    key: string;
    label: string;
    icon: string;
    color: string;
  } {
    const typeMap: Record<string, { key: string; label: string; icon: string; color: string }> = {
      'anfrage': { 
        key: 'request', 
        label: 'Anfrage', 
        icon: 'envelope', 
        color: 'info' 
      },
      'termin': { 
        key: 'appointment', 
        label: 'Termin', 
        icon: 'calendar', 
        color: 'primary' 
      },
      'projekt': { 
        key: 'project', 
        label: 'Projekt', 
        icon: 'briefcase', 
        color: 'success' 
      },
      'system': { 
        key: 'system', 
        label: 'System', 
        icon: 'bell', 
        color: 'warning' 
      },
      'contact_confirmation': { 
        key: 'contact_confirmation', 
        label: 'Kontaktanfrage', 
        icon: 'envelope-open', 
        color: 'success' 
      }
    };

    return typeMap[type] || { 
      key: 'default', 
      label: 'Benachrichtigung', 
      icon: 'info-circle', 
      color: 'secondary' 
    };
  }

  /**
   * Generate notification link based on type
   * @param notification Notification object
   * @returns Notification link
   */
  private generateNotificationLink(notification: {
    type: string;
    referenceId: number | null;
  }): string {
    switch (notification.type) {
      case 'anfrage':
        return `/dashboard/requests/${notification.referenceId}`;
      case 'termin':
        return `/dashboard/termine/${notification.referenceId}`;
      case 'projekt':
        return `/dashboard/projekte/${notification.referenceId}`;
      case 'contact_confirmation':
        return `/dashboard/requests/${notification.referenceId}`;
      default:
        return '/dashboard/notifications';
    }
  }
}

// Fix the _count property issue
export async function getUnreadNotificationsCount(userId: number): Promise<number> {
  try {
    // Use count directly instead of groupBy for simplicity
    return await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;