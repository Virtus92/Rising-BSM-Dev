import { notificationService, getUnreadNotificationsCount } from '../../../services/notification.service';
import { cache } from '../../../services/cache.service';
import { prisma } from '../../../utils/prisma.utils';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

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

// Mock cache service
jest.mock('../../../services/cache.service', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  }
}));

// Mock Prisma
jest.mock('../../../utils/prisma.utils', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn()
    }
  }
}));

// Mock formatters
jest.mock('../../../utils/formatters', () => ({
  formatRelativeTime: jest.fn().mockReturnValue('5 minutes ago')
}));

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('create', () => {
    test('should create notification and clear cache', async () => {
      const notificationData = {
        userId: 1,
        type: 'anfrage',
        title: 'New Request',
        message: 'You have a new request'
      };
      
      // Type the mock implementation with the correct return type
      (prisma.notification.create as jest.Mock).mockImplementation(() => Promise.resolve({
        id: 123,
        ...notificationData,
        read: false,
        createdAt: new Date()
      }));
      
      const result = await notificationService.create(notificationData);
      
      expect(prisma.notification.create).toHaveBeenCalledWith({
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
      
      (prisma.notification.create as jest.Mock).mockImplementation(() => Promise.reject(new Error('Database error')));
      
      // Spy on console.error to silence it
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
      
      (cache.get as jest.Mock).mockReturnValue(cachedResult);
      
      const result = await notificationService.getNotifications(1);
      
      expect(cache.get).toHaveBeenCalled();
      expect(prisma.notification.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });
    
    test('should fetch notifications from database if not cached', async () => {
      (cache.get as jest.Mock).mockReturnValue(null);
      
      (prisma.notification.findMany as jest.Mock).mockImplementation(() => Promise.resolve([
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
      ]));
      
      (prisma.notification.count as jest.Mock)
        .mockImplementationOnce(() => Promise.resolve(5)) // Total count
        .mockImplementationOnce(() => Promise.resolve(3)); // Unread count
      
      const result = await notificationService.getNotifications(1);
      
      expect(prisma.notification.findMany).toHaveBeenCalled();
      expect(prisma.notification.count).toHaveBeenCalledTimes(2);
      expect(cache.set).toHaveBeenCalled();
      
      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(5);
      expect(result.unreadCount).toBe(3);
    });
    
    test('should apply filters correctly', async () => {
      (cache.get as jest.Mock).mockReturnValue(null);
      
      (prisma.notification.findMany as jest.Mock).mockImplementation(() => Promise.resolve([]));
      (prisma.notification.count as jest.Mock)
        .mockImplementationOnce(() => Promise.resolve(0))
        .mockImplementationOnce(() => Promise.resolve(0));
      
      await notificationService.getNotifications(1, {
        limit: 5,
        offset: 10,
        unreadOnly: true,
        type: 'anfrage'
      });
      
      expect(prisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          userId: 1,
          read: false,
          type: 'anfrage'
        },
        take: 5,
        skip: 10
      }));
    });
    
    test('should handle errors gracefully', async () => {
      (cache.get as jest.Mock).mockReturnValue(null);
      (prisma.notification.findMany as jest.Mock).mockImplementation(() => Promise.reject(new Error('Database error')));
      
      // Spy on console.error to silence it
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(notificationService.getNotifications(1)).rejects.toThrow('Database error');
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('markAsRead', () => {
    test('should mark single notification as read', async () => {
      (prisma.notification.updateMany as jest.Mock).mockImplementation(() => Promise.resolve({ count: 1 }));
      
      const result = await notificationService.markAsRead(1, 123);
      
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
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
      (prisma.notification.updateMany as jest.Mock).mockImplementation(() => Promise.resolve({ count: 3 }));
      
      const result = await notificationService.markAsRead(1, [123, 456, 789]);
      
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          id: { in: [123, 456, 789] }
        },
        data: {
          read: true
        }
      });
      
      expect(result.updatedCount).toBe(3);
    });
    
    test('should handle errors gracefully', async () => {
      (prisma.notification.updateMany as jest.Mock).mockImplementation(() => Promise.reject(new Error('Database error')));
      
      // Spy on console.error to silence it
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await notificationService.markAsRead(1, 123);
      
      expect(result).toEqual({
        success: false,
        updatedCount: 0
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('markAllAsRead', () => {
    test('should mark all notifications as read', async () => {
      (prisma.notification.updateMany as jest.Mock).mockImplementation(() => Promise.resolve({ count: 5 }));
      
      const result = await notificationService.markAllAsRead(1);
      
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
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
      (prisma.notification.updateMany as jest.Mock).mockImplementation(() => Promise.reject(new Error('Database error')));
      
      // Spy on console.error to silence it
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await notificationService.markAllAsRead(1);
      
      expect(result).toEqual({
        success: false,
        updatedCount: 0
      });
    });
  });
  
  describe('getUnreadNotificationsCount', () => {
    test('should return unread notification count', async () => {
      (prisma.notification.count as jest.Mock).mockImplementation(() => Promise.resolve(3));
      
      const count = await getUnreadNotificationsCount(1);
      
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 1,
          read: false
        }
      });
      
      expect(count).toBe(3);
    });
    
    test('should handle errors gracefully', async () => {
      (prisma.notification.count as jest.Mock).mockImplementation(() => Promise.reject(new Error('Database error')));
      
      // Spy on console.error to silence it
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const count = await getUnreadNotificationsCount(1);
      
      expect(count).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
  });
});