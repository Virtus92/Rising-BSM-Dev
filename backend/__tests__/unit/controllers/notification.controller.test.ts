/**
 * Notification Controller Tests
 * 
 * Unit tests for the notification controller.
 */
import { Request, Response } from 'express';
const { 
  getNotifications, 
  markNotificationsRead,
  getNotificationStats,
  deleteNotification
}  = require('../controller/notification.controller');
import { NotificationService } from '../../../services/notification.service';
import { NotFoundError, ForbiddenError } from '../../../utils/error.utils';
import { mockDeep, MockProxy } from 'jest-mock-extended';

// Mock dependencies
jest.mock('../config/dependency-container', () => ({
  inject: jest.fn()
}));

jest.mock('../utils/http.utils', () => ({
  processPagination: jest.fn().mockReturnValue({ 
    current: 1, 
    limit: 20,
    total: 0,
    totalRecords: 0,
    skip: 0
  }),
  ResponseFactory: {
    success: jest.fn(),
    paginated: jest.fn()
  }
}));

// Import http.utils after mocking
import { ResponseFactory, processPagination } from '../../../utils/http.utils';

describe('Notification Controller', () => {
  let req: MockProxy<Request>;
  let res: MockProxy<Response>;
  let next: jest.Mock;
  let notificationService: MockProxy<NotificationService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mocks
    req = mockDeep<Request>();
    res = mockDeep<Response>();
    next = jest.fn();
    notificationService = mockDeep<NotificationService>();
    
    // Mock authenticated user
    (req as any).user = { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' };
    
    // Mock request data
    req.query = {};
    (req as any).validatedQuery = {};
    
    // Mock service methods
    (notificationService.findAll as jest.Mock).mockResolvedValue({
      data: [],
      pagination: {
        current: 1,
        limit: 20,
        total: 0,
        totalRecords: 0
      }
    });
    
    (notificationService.markNotificationsRead as jest.Mock).mockResolvedValue(1);
    (notificationService.getNotificationStats as jest.Mock).mockResolvedValue({
      totalCount: 10,
      unreadCount: 5,
      byType: { anfrage: 2, termin: 3, projekt: 1, warnung: 0, info: 4, system: 0 }
    });
    (notificationService.deleteUserNotification as jest.Mock).mockResolvedValue({
      id: 1,
      title: 'Test Notification',
      message: 'Test Message',
      type: 'success',
      icon: 'bell',
      read: false,
      time: '2 hours ago',
      timestamp: new Date(),
      link: '/dashboard'
    });
    
    // Replace the service instance in the controller
    (getNotifications as any).notificationService = notificationService;
    (markNotificationsRead as any).notificationService = notificationService;
    (getNotificationStats as any).notificationService = notificationService;
    (deleteNotification as any).notificationService = notificationService;
  });

  describe('getNotifications', () => {
    it('should get notifications successfully', async () => {
      // Act
      await getNotifications(req as any, res, next);
      
      // Assert
      expect(processPagination).toHaveBeenCalled();
      expect(notificationService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1 }),
        expect.objectContaining({ page: 1, limit: 20 })
      );
      expect(ResponseFactory.paginated).toHaveBeenCalledWith(
        res,
        [],
        expect.any(Object),
        'Notifications retrieved successfully'
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Test error');
      (notificationService.findAll as jest.Mock).mockRejectedValue(error);
      
      // Act
      await getNotifications(req as any, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('markNotificationsRead', () => {
    it('should mark all notifications as read', async () => {
      // Arrange
      (req as any).validatedData = { markAll: true };
      
      // Act
      await markNotificationsRead(req as any, res, next);
      
      // Assert
      expect(notificationService.markNotificationsRead).toHaveBeenCalledWith(
        1,
        { markAll: true }
      );
      expect(ResponseFactory.success).toHaveBeenCalledWith(
        res,
        { count: 1 },
        'Notifications marked as read'
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should mark specific notification as read', async () => {
      // Arrange
      (req as any).validatedData = { notificationId: 5 };
      
      // Act
      await markNotificationsRead(req as any, res, next);
      
      // Assert
      expect(notificationService.markNotificationsRead).toHaveBeenCalledWith(
        1,
        { notificationId: 5 }
      );
      expect(ResponseFactory.success).toHaveBeenCalledWith(
        res,
        { count: 1 },
        'Notifications marked as read'
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should handle NotFoundError', async () => {
      // Arrange
      (req as any).validatedData = { notificationId: 999 };
      const error = new NotFoundError('Notification not found');
      (notificationService.markNotificationsRead as jest.Mock).mockRejectedValue(error);
      
      // Act
      await markNotificationsRead(req as any, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
    
    it('should handle ForbiddenError', async () => {
      // Arrange
      (req as any).validatedData = { notificationId: 5 };
      const error = new ForbiddenError('You do not have permission to access this notification');
      (notificationService.markNotificationsRead as jest.Mock).mockRejectedValue(error);
      
      // Act
      await markNotificationsRead(req as any, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('getNotificationStats', () => {
    it('should get notification statistics successfully', async () => {
      // Act
      await getNotificationStats(req as any, res, next);
      
      // Assert
      expect(notificationService.getNotificationStats).toHaveBeenCalledWith(1);
      expect(ResponseFactory.success).toHaveBeenCalledWith(
        res,
        {
          totalCount: 10,
          unreadCount: 5,
          byType: { anfrage: 2, termin: 3, projekt: 1, warnung: 0, info: 4, system: 0 }
        },
        'Notification statistics retrieved successfully'
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Test error');
      (notificationService.getNotificationStats as jest.Mock).mockRejectedValue(error);
      
      // Act
      await getNotificationStats(req as any, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      // Arrange
      req.params = { id: '1' };
      
      // Act
      await deleteNotification(req as any, res, next);
      
      // Assert
      expect(notificationService.deleteUserNotification).toHaveBeenCalledWith(1, 1);
      expect(ResponseFactory.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({ id: 1 }),
        'Notification deleted successfully'
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should handle NotFoundError', async () => {
      // Arrange
      req.params = { id: '999' };
      const error = new NotFoundError('Notification not found');
      (notificationService.deleteUserNotification as jest.Mock).mockRejectedValue(error);
      
      // Act
      await deleteNotification(req as any, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
    
    it('should handle ForbiddenError', async () => {
      // Arrange
      req.params = { id: '1' };
      const error = new ForbiddenError('You do not have permission to delete this notification');
      (notificationService.deleteUserNotification as jest.Mock).mockRejectedValue(error);
      
      // Act
      await deleteNotification(req as any, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});