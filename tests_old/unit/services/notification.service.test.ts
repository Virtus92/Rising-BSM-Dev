import { notificationService, getUnreadNotificationsCount } from '../../../services/notification.service';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { createTypedMock } from '../../mocks/jest-utils';

// Define notification type
interface MockNotification {
  id: number;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  createdAt: Date;
  userId: number;
  referenceId?: number | null;
  referenceType?: string | null;
}

interface CountResult {
  count: number;
}

// Mock cache service
jest.mock('../../../services/cache.service', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  }
}));

// Mock Prisma with direct jest.fn() instead of referenced variables
jest.mock('../../../utils/prisma.utils', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn()
    }
  },
  __esModule: true,
  default: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn()
    }
  }
}));

// Get references to the mocks after they've been created
const { prisma } = require('../../../utils/prisma.utils');
const mockNotificationCreate = prisma.notification.create;
const mockNotificationFindMany = prisma.notification.findMany;
const mockNotificationCount = prisma.notification.count;
const mockNotificationUpdateMany = prisma.notification.updateMany;

// Mock formatters
jest.mock('../../../utils/formatters', () => ({
  formatRelativeTime: jest.fn().mockReturnValue('5 minutes ago')
}));

describe('Notification Service', () => {
  let cache: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get a reference to the mocked cache
    cache = require('../../../services/cache.service').cache;
  });
  
  describe('create', () => {
    test('should create notification and clear cache', async () => {
      const notificationData = {
        userId: 1,
        type: 'anfrage',
        title: 'New Request',
        message: 'You have a new request'
      };
      
      // Set up the mock implementation
      mockNotificationCreate.mockResolvedValue({
        id: 123,
        ...notificationData,
        read: false,
        createdAt: new Date(),
        referenceId: null,
        referenceType: null
      });
      
      const result = await notificationService.create(notificationData);
      
      expect(mockNotificationCreate).toHaveBeenCalledWith({
        data: {
          ...notificationData,
          referenceId: null,
          referenceType: null,
          read: false
        }
      });
      
      expect(cache.delete).toHaveBeenCalledWith(`notifications_1`);
      expect(result).toEqual({
        id: 123,
        success: true
      });
    });
    
    test('should handle errors gracefully', async () => {
      const notificationData = {
        userId: 1,
        type: 'anfrage',
        title: 'New Request',
        message: 'You have a new request'
      };
      
      mockNotificationCreate.mockRejectedValue(new Error('Database error'));
      
      // Spy on console.error to suppress it
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await notificationService.create(notificationData);
      
      expect(result).toEqual({
        id: 0,
        success: false
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('getNotifications', () => {
    test('should return cached notifications if available', async () => {
      const cachedResult = {
        notifications: [{ id: 1, title: 'Test' }],
        total: 1,
        unreadCount: 0
      };
      
      cache.get.mockReturnValue(cachedResult);
      
      const result = await notificationService.getNotifications(1);
      
      expect(cache.get).toHaveBeenCalled();
      expect(mockNotificationFindMany).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });
    
    test('should fetch notifications from database if not cached', async () => {
      cache.get.mockReturnValue(null);
      
      mockNotificationFindMany.mockResolvedValue([
        {
          id: 1,
          title: 'Test Notification',
          message: 'This is a test',
          type: 'anfrage',
          read: false,
          createdAt: new Date(),
          userId: 1,
          referenceId: 123,
          referenceType: 'request'
        }
      ]);
      
      mockNotificationCount.mockResolvedValueOnce(5); // Total count
      mockNotificationCount.mockResolvedValueOnce(3); // Unread count
      
      const result = await notificationService.getNotifications(1);
      
      expect(mockNotificationFindMany).toHaveBeenCalled();
      expect(mockNotificationCount).toHaveBeenCalledTimes(2);
      expect(cache.set).toHaveBeenCalled();
      
      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(5);
      expect(result.unreadCount).toBe(3);
    });
    
    test('should handle errors gracefully', async () => {
      mockNotificationUpdateMany.mockRejectedValue(new Error('Database error'));
      
      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await notificationService.markAsRead(1, 123);
      
      expect(result).toEqual({
        success: false,
        updatedCount: 0
      });
    });

    test('should apply filter options correctly', async () => {
      cache.get.mockReturnValue(null);
      
      const options = {
        limit: 5,
        offset: 10,
        unreadOnly: true,
        type: 'termin'
      };
      
      mockNotificationFindMany.mockResolvedValue([]);
      mockNotificationCount.mockResolvedValueOnce(3); // Total count
      mockNotificationCount.mockResolvedValueOnce(2); // Unread count
      
      await notificationService.getNotifications(1, options);
      
      expect(mockNotificationFindMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          read: false,
          type: 'termin'
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        skip: 10
      });
    });
    
    test('should properly map notification types and generate links', async () => {
      cache.get.mockReturnValue(null);
      
      const mockNotifications = [
        {
          id: 1,
          title: 'Anfrage Test',
          message: 'Test message',
          type: 'anfrage',
          read: false,
          createdAt: new Date(),
          userId: 1,
          referenceId: 123,
          referenceType: 'request'
        },
        {
          id: 2,
          title: 'Termin Test',
          message: 'Test message',
          type: 'termin',
          read: true,
          createdAt: new Date(),
          userId: 1,
          referenceId: 456,
          referenceType: 'appointment'
        },
        {
          id: 3,
          title: 'Unknown Type',
          message: 'Test message',
          type: 'unknown',
          read: false,
          createdAt: new Date(),
          userId: 1,
          referenceId: null,
          referenceType: null
        }
      ];
      
      mockNotificationFindMany.mockResolvedValue(mockNotifications);
      mockNotificationCount.mockResolvedValueOnce(3); // Total count
      mockNotificationCount.mockResolvedValueOnce(2); // Unread count
      
      const result = await notificationService.getNotifications(1);
      
      // Check type mapping for 'anfrage'
      expect(result.notifications[0].type).toEqual({
        key: 'request',
        label: 'Anfrage',
        icon: 'envelope',
        color: 'info'
      });
      
      // Check type mapping for 'termin'
      expect(result.notifications[1].type).toEqual({
        key: 'appointment',
        label: 'Termin',
        icon: 'calendar',
        color: 'primary'
      });
      
      // Check type mapping for unknown type
      expect(result.notifications[2].type).toEqual({
        key: 'default',
        label: 'Benachrichtigung',
        icon: 'info-circle',
        color: 'secondary'
      });
      
      // Check links
      expect(result.notifications[0].link).toBe('/dashboard/requests/123');
      expect(result.notifications[1].link).toBe('/dashboard/termine/456');
      expect(result.notifications[2].link).toBe('/dashboard/notifications');
    });
  });
  
  describe('markAllAsRead', () => {
    test('should mark all notifications as read', async () => {
      mockNotificationUpdateMany.mockResolvedValue({ count: 5 });
      
      const result = await notificationService.markAllAsRead(1);
      
      expect(mockNotificationUpdateMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          read: false
        },
        data: {
          read: true
        }
      });
      
      expect(cache.delete).toHaveBeenCalledWith(`notifications_1`);
      expect(result).toEqual({
        success: true,
        updatedCount: 5
      });
    });

    test('should handle errors gracefully', async () => {
      mockNotificationUpdateMany.mockRejectedValue(new Error('Database error'));
      
      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await notificationService.markAllAsRead(1);
      
      expect(result).toEqual({
        success: false,
        updatedCount: 0
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('markAsRead', () => {
    test('should mark a single notification as read', async () => {
      mockNotificationUpdateMany.mockResolvedValue({ count: 1 });
      
      const result = await notificationService.markAsRead(1, 123);
      
      expect(mockNotificationUpdateMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          id: { in: [123] }
        },
        data: {
          read: true
        }
      });
      
      expect(cache.delete).toHaveBeenCalledWith(`notifications_1`);
      expect(result).toEqual({
        success: true,
        updatedCount: 1
      });
    });
    
    test('should mark multiple notifications as read', async () => {
      mockNotificationUpdateMany.mockResolvedValue({ count: 3 });
      
      const result = await notificationService.markAsRead(1, [123, 456, 789]);
      
      expect(mockNotificationUpdateMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          id: { in: [123, 456, 789] }
        },
        data: {
          read: true
        }
      });
      
      expect(cache.delete).toHaveBeenCalledWith(`notifications_1`);
      expect(result).toEqual({
        success: true,
        updatedCount: 3
      });
    });
    
    test('should handle errors gracefully', async () => {
      mockNotificationUpdateMany.mockRejectedValue(new Error('Database error'));
      
      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await notificationService.markAsRead(1, 123);
      
      expect(result).toEqual({
        success: false,
        updatedCount: 0
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('getUnreadNotificationsCount', () => {
    test('should return unread notification count', async () => {
      mockNotificationCount.mockResolvedValue(3);
      
      const count = await getUnreadNotificationsCount(1);
      
      expect(mockNotificationCount).toHaveBeenCalledWith({
        where: {
          userId: 1,
          read: false
        }
      });
      
      expect(count).toBe(3);
    });
    
    test('should handle errors gracefully', async () => {
      mockNotificationCount.mockRejectedValue(new Error('Database error'));
      
      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const count = await getUnreadNotificationsCount(1);
      
      expect(count).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
  });
});