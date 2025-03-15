const NotificationService = require('../../services/notification.service');
const pool = require('../../services/db.service');
const db = require('../../services/db.service');
const { formatRelativeTime } = require('../../utils/formatters');

// Mock dependencies
jest.mock('../../services/db.service', () => ({
  query: jest.fn()
}));

jest.mock('../utils/formatters', () => ({
  formatRelativeTime: jest.fn().mockReturnValue('3 hours ago')
}));

describe('NotificationService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should successfully create a notification', async () => {
      // Arrange
      const mockOptions = {
        userId: 1,
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test notification',
        referenceId: 123,
        referenceType: 'test'
      };

      pool.query.mockResolvedValue({
        rows: [{ id: 1 }]
      });

      // Act
      const result = await NotificationService.create(mockOptions);

      // Assert
      expect(result).toEqual({ id: 1, success: true });
      expect(pool.query).toHaveBeenCalledWith({
        text: expect.stringContaining('INSERT INTO benachrichtigungen'),
        values: [
          mockOptions.userId,
          mockOptions.type,
          mockOptions.title,
          mockOptions.message,
          mockOptions.referenceId,
          mockOptions.referenceType
        ]
      });
    });

    test('should handle database errors', async () => {
      // Arrange
      const mockOptions = {
        userId: 1,
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test notification'
      };

      const errorMessage = 'Database error';
      pool.query.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await NotificationService.create(mockOptions);

      // Assert
      expect(result).toEqual({ success: false, error: errorMessage });
    });
  });

  describe('getNotifications', () => {
    test('should retrieve notifications for a user', async () => {
      // Arrange
      const userId = 1;
      const mockNotifications = [
        {
          id: 1,
          typ: 'anfrage',
          titel: 'New Request',
          nachricht: 'You have a new request',
          referenz_id: 123,
          referenz_typ: 'request',
          erstellt_am: new Date(),
          gelesen: false
        }
      ];

      pool.query.mockResolvedValueOnce({
        rows: mockNotifications
      }).mockResolvedValueOnce({
        rows: [{ total: '5', unread: '3' }]
      });

      // Act
      const result = await NotificationService.getNotifications(userId);

      // Assert
      expect(result).toHaveProperty('notifications');
      expect(result).toHaveProperty('total', 5);
      expect(result).toHaveProperty('unreadCount', 3);
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(formatRelativeTime).toHaveBeenCalled();
    });

    test('should handle optional filtering parameters', async () => {
      // Arrange
      const userId = 1;
      const options = {
        limit: 5,
        offset: 10,
        unreadOnly: true,
        type: 'system'
      };

      pool.query.mockResolvedValueOnce({
        rows: []
      }).mockResolvedValueOnce({
        rows: [{ total: '0', unread: '0' }]
      });

      // Act
      await NotificationService.getNotifications(userId, options);

      // Assert
      expect(pool.query).toHaveBeenCalledWith({
        text: expect.stringContaining('WHERE benutzer_id = $1 AND gelesen = false AND typ = $2'),
        values: expect.arrayContaining([userId, options.type, options.limit, options.offset])
      });
    });

    test('should throw an error when database query fails', async () => {
      // Arrange
      const userId = 1;
      const errorMessage = 'Database connection error';
      pool.query.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(NotificationService.getNotifications(userId))
        .rejects.toThrow();
    });
  });

  describe('markAsRead', () => {
    test('should mark a single notification as read', async () => {
      // Arrange
      const userId = 1;
      const notificationId = 5;
      
      pool.query.mockResolvedValue({
        rowCount: 1
      });

      // Act
      const result = await NotificationService.markAsRead(userId, notificationId);

      // Assert
      expect(result).toEqual({ success: true, updatedCount: 1 });
      expect(pool.query).toHaveBeenCalledWith({
        text: expect.stringContaining('UPDATE benachrichtigungen'),
        values: [userId, [notificationId]]
      });
    });

    test('should mark multiple notifications as read', async () => {
      // Arrange
      const userId = 1;
      const notificationIds = [3, 5, 8];
      
      pool.query.mockResolvedValue({
        rowCount: 3
      });

      // Act
      const result = await NotificationService.markAsRead(userId, notificationIds);

      // Assert
      expect(result).toEqual({ success: true, updatedCount: 3 });
      expect(pool.query).toHaveBeenCalledWith({
        text: expect.stringContaining('UPDATE benachrichtigungen'),
        values: [userId, notificationIds]
      });
    });

    test('should handle database errors', async () => {
      // Arrange
      const userId = 1;
      const notificationId = 5;
      const errorMessage = 'Database error';
      
      pool.query.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await NotificationService.markAsRead(userId, notificationId);

      // Assert
      expect(result).toEqual({ success: false, error: errorMessage });
    });
  });

  describe('mapNotificationType', () => {
    test('should map known notification types', () => {
      // Act & Assert
      expect(NotificationService.mapNotificationType('anfrage')).toEqual({
        key: 'request',
        label: 'Anfrage',
        icon: 'envelope',
        color: 'info'
      });

      expect(NotificationService.mapNotificationType('termin')).toEqual({
        key: 'appointment',
        label: 'Termin',
        icon: 'calendar',
        color: 'primary'
      });
    });

    test('should return default mapping for unknown types', () => {
      // Act
      const result = NotificationService.mapNotificationType('unknown');

      // Assert
      expect(result).toEqual({
        key: 'default',
        label: 'Benachrichtigung',
        icon: 'info-circle',
        color: 'secondary'
      });
    });
  });

  describe('generateNotificationLink', () => {
    test('should generate correct links based on notification type', () => {
      // Arrange
      const notifications = [
        { typ: 'anfrage', referenz_id: 123 },
        { typ: 'termin', referenz_id: 456 },
        { typ: 'projekt', referenz_id: 789 },
        { typ: 'system' }
      ];

      // Act & Assert
      expect(NotificationService.generateNotificationLink(notifications[0])).toBe('/dashboard/requests/123');
      expect(NotificationService.generateNotificationLink(notifications[1])).toBe('/dashboard/termine/456');
      expect(NotificationService.generateNotificationLink(notifications[2])).toBe('/dashboard/projekte/789');
      expect(NotificationService.generateNotificationLink(notifications[3])).toBe('/dashboard/notifications');
    });
  });
});
