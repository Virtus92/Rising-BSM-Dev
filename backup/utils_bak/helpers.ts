/**
 * Helper utilities
 * Common utility functions used across the application
 */
import { cache } from '../services/cache.service.js';
import { prisma } from '../utils/prisma.utils.js';

/**
 * Status information with label and class name
 */
export interface StatusInfo {
  label: string;
  className: string;
}

/**
 * Notification item interface
 */
export interface NotificationItem {
  id: number;
  title: string;
  type: string;
  icon: string;
  time: string;
  link: string;
}

/**
 * Notifications result interface
 */
export interface NotificationsResult {
  items: NotificationItem[];
  unreadCount: number;
  totalCount: number;
}

/**
 * Filter options interface
 */
export interface FilterOptions {
  page?: number;
  limit?: number;
  sort?: {
    field: string;
    direction: string;
  };
  start_date?: Date;
  end_date?: Date;
  search?: string;
  status?: string;
  type?: string;
  [key: string]: any;
}

/**
 * Get status information for a request
 * @param status Status code
 * @returns Status label and class name
 */
export const getAnfrageStatusInfo = (status: string): StatusInfo => {
  const statusMap: Record<string, StatusInfo> = {
    'neu': { label: 'Neu', className: 'warning' },
    'in_bearbeitung': { label: 'In Bearbeitung', className: 'info' },
    'beantwortet': { label: 'Beantwortet', className: 'success' },
    'geschlossen': { label: 'Geschlossen', className: 'secondary' }
  };
  
  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};

/**
 * Get status information for an appointment
 * @param status Status code
 * @returns Status label and class name
 */
export const getTerminStatusInfo = (status: string): StatusInfo => {
  const statusMap: Record<string, StatusInfo> = {
    'geplant': { label: 'Geplant', className: 'warning' },
    'bestaetigt': { label: 'Bestätigt', className: 'success' },
    'abgeschlossen': { label: 'Abgeschlossen', className: 'primary' },
    'storniert': { label: 'Storniert', className: 'secondary' }
  };
  
  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};

/**
 * Get status information for a project
 * @param status Status code
 * @returns Status label and class name
 */
export const getProjektStatusInfo = (status: string): StatusInfo => {
  const statusMap: Record<string, StatusInfo> = {
    'neu': { label: 'Neu', className: 'info' },
    'in_bearbeitung': { label: 'In Bearbeitung', className: 'primary' },
    'abgeschlossen': { label: 'Abgeschlossen', className: 'success' },
    'storniert': { label: 'Storniert', className: 'secondary' }
  };
  
  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};

/**
 * Get status information for a user
 * @param status Status code
 * @returns Status label and class name
 */
export const getBenutzerStatusInfo = (status: string): StatusInfo => {
  const statusMap: Record<string, StatusInfo> = {
    'aktiv': { label: 'Aktiv', className: 'success' },
    'inaktiv': { label: 'Inaktiv', className: 'secondary' },
    'gesperrt': { label: 'Gesperrt', className: 'danger' }
  };

  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};

/**
 * Generate unique ID
 * @param length Length of ID
 * @returns Random ID
 */
export const generateId = (length = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
};

/**
 * Get notifications for current user
 * @param req Express request object
 * @returns Notifications with unread count
 */
export const getNotifications = async (req: any): Promise<NotificationsResult> => {
  if (!req.session || !req.session.user) {
    return { items: [], unreadCount: 0, totalCount: 0 };
  }
  
  try {
    const userId = req.session.user.id;
    const cacheKey = `notifications_${userId}`;
    
    // Try to get from cache first
    return await cache.getOrExecute(cacheKey, async () => {
      // Get notifications using Prisma
      const notifications = await prisma.notification.findMany({
        where: {
          userId: Number(userId)
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });
      
      // Get unread count
      const unreadCount = await prisma.notification.count({
        where: {
          userId: Number(userId),
          read: false
        }
      });
      
      // Get total count
      const totalCount = await prisma.notification.count({
        where: {
          userId: Number(userId)
        }
      });
      
      interface NotificationData {
        id: number;
        title: string;
        type: string;
        createdAt: Date;
        referenceId: number | null;
      }

      // Format notifications
      const items = notifications.map((n: NotificationData) => {
        const { formatRelativeTime } = require('./formatters');
        
        return {
          id: n.id,
          title: n.title,
          type: n.type === 'anfrage' ? 'success' : 
                n.type === 'termin' ? 'primary' : 
                n.type === 'warnung' ? 'warning' : 'info',
          icon: n.type === 'anfrage' ? 'envelope' : 
                n.type === 'termin' ? 'calendar-check' : 
                n.type === 'warnung' ? 'exclamation-triangle' : 'bell',
          time: formatRelativeTime(n.createdAt),
          link: n.type === 'anfrage' ? `/dashboard/requests/${n.referenceId}` :
                n.type === 'termin' ? `/dashboard/termine/${n.referenceId}` :
                n.type === 'projekt' ? `/dashboard/projekte/${n.referenceId}` :
                '/dashboard/notifications'
        };
      });

      return {
        items,
        unreadCount,
        totalCount
      };
    }, 30); // Cache for 30 seconds
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { items: [], unreadCount: 0, totalCount: 0 };
  }
};

/**
 * Count new requests
 * @returns Count of new requests
 */
export const getNewRequestsCount = async (): Promise<number> => {
  try {
    const cacheKey = 'new_requests_count';
    
    return await cache.getOrExecute(cacheKey, async () => {
      const count = await prisma.contactRequest.count({
        where: { status: 'neu' }
      });
      
      return count;
    }, 60); // Cache for 1 minute
  } catch (error) {
    console.error('Error counting new requests:', error);
    return 0;
  }
};

/**
 * Parse query filters
 * @param query Express req.query object
 * @param defaults Default filter values
 * @returns Parsed filters
 */
export const parseFilters = (query: Record<string, any>, defaults: FilterOptions = {}): FilterOptions => {
  const filters: FilterOptions = { ...defaults };
  
  // Add pagination
  filters.page = parseInt(query.page as string) || 1;
  filters.limit = parseInt(query.limit as string) || 20;
  
  // Add sorting
  if (query.sort) {
    const [field, direction] = (query.sort as string).split(':');
    filters.sort = {
      field: field || 'id',
      direction: (direction || 'asc').toUpperCase()
    };
  }
  
  // Add date range
  if (query.start_date) {
    filters.start_date = new Date(query.start_date as string);
    
    // Default end_date to today if not provided
    if (!query.end_date) {
      filters.end_date = new Date();
    }
  }
  
  if (query.end_date) {
    filters.end_date = new Date(query.end_date as string);
  }
  
  // Add search term
  if (query.search) {
    filters.search = (query.search as string).trim();
  }
  
  // Add status
  if (query.status) {
    filters.status = query.status as string;
  }
  
  // Add type
  if (query.type) {
    filters.type = query.type as string;
  }
  
  return filters;
};

/**
 * Sanitize a string for use in SQL LIKE clause
 * @param str String to sanitize
 * @returns Sanitized string
 */
export const sanitizeLikeString = (str: string | null | undefined): string => {
  if (!str) return '';
  
  // Escape special characters in LIKE pattern
  return str.replace(/[%_\\]/g, '\\$&');
};

/**
 * Truncate HTML string and close any open tags
 * @param html HTML string to truncate
 * @param maxLength Maximum length
 * @returns Truncated HTML with closed tags
 */
export const truncateHtml = (html: string | null | undefined, maxLength: number): string => {
  if (!html || html.length <= maxLength) {
    return html || '';
  }
  
  // Simple truncation for now
  // A more complex version would properly close HTML tags
  return html.substring(0, maxLength) + '...';
};

/**
 * Group array by key
 * @param array Array to group
 * @param key Property to group by
 * @returns Grouped object
 */
export const groupBy = <T extends Record<string, any>>(
  array: T[], 
  key: keyof T
): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    result[groupKey] = result[groupKey] || [];
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};