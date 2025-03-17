const NotificationService = require('../../services/notification.service');
const pool = require('../../services/db.service');
const { formatRelativeTime } = require('../../utils/formatters');

// Mock the db.service and utils
jest.mock('../../services/db.service', () => ({
    query: jest.fn()
}));

jest.mock('../../utils/formatters', () => ({
    formatRelativeTime: jest.fn(date => 'time ago')
}));

describe('NotificationService', () => {
    // Reset mocks between tests
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a notification successfully', async () => {
            // Mock successful query response
            pool.query.mockResolvedValue({
                rows: [{ id: 123 }]
            });

            const notificationData = {
                userId: 1,
                type: 'anfrage',
                title: 'Test Title',
                message: 'Test Message',
                referenceId: 456,
                referenceType: 'project'
            };

            const result = await NotificationService.create(notificationData);

            // Check if pool.query was called with correct parameters
            expect(pool.query).toHaveBeenCalledWith({
                text: expect.stringContaining('INSERT INTO benachrichtigungen'),
                values: [1, 'anfrage', 'Test Title', 'Test Message', 456, 'project']
            });

            // Check returned result
            expect(result).toEqual({
                id: 123,
                success: true
            });
        });

        it('should handle database errors gracefully', async () => {
            // Mock error response
            const testError = new Error('Database connection failed');
            pool.query.mockRejectedValue(testError);

            const notificationData = {
                userId: 1,
                type: 'anfrage',
                title: 'Test Title',
                message: 'Test Message'
            };

            // Mock console.error to avoid cluttering test output
            console.error = jest.fn();

            const result = await NotificationService.create(notificationData);

            // Check if error was logged
            expect(console.error).toHaveBeenCalledWith(
                'Notification creation error:',
                testError
            );

            // Check returned result
            expect(result).toEqual({
                success: false,
                error: 'Database connection failed'
            });
        });

        it('should handle optional parameters correctly', async () => {
            // Mock successful query response
            pool.query.mockResolvedValue({
                rows: [{ id: 123 }]
            });

            const notificationData = {
                userId: 1,
                type: 'system',
                title: 'System Notification',
                message: 'System is updating'
                // referenceId and referenceType are omitted
            };

            const result = await NotificationService.create(notificationData);

            // Check if pool.query was called with null for optional parameters
            expect(pool.query).toHaveBeenCalledWith({
                text: expect.stringContaining('INSERT INTO benachrichtigungen'),
                values: [1, 'system', 'System Notification', 'System is updating', null, null]
            });

            expect(result.success).toBe(true);
        });
    });

    describe('getNotifications', () => {
        it('should retrieve notifications for a user successfully', async () => {
            // Mock successful query responses
            const mockNotifications = [
                {
                    id: 123,
                    typ: 'anfrage',
                    titel: 'Notification 1',
                    nachricht: 'Message 1',
                    referenz_id: 456,
                    referenz_typ: 'project',
                    erstellt_am: new Date('2023-08-01'),
                    gelesen: false
                },
                {
                    id: 124,
                    typ: 'system',
                    titel: 'Notification 2',
                    nachricht: 'Message 2',
                    referenz_id: null,
                    referenz_typ: null,
                    erstellt_am: new Date('2023-08-02'),
                    gelesen: true
                }
            ];
            
            // Mock for notifications query
            pool.query.mockResolvedValueOnce({
                rows: mockNotifications
            });
            
            // Mock for counts query
            pool.query.mockResolvedValueOnce({
                rows: [{ total: '2', unread: '1' }]
            });

            const result = await NotificationService.getNotifications(1);

            // Check if pool.query was called with correct parameters for notifications
            expect(pool.query).toHaveBeenNthCalledWith(1, {
                text: expect.stringContaining('SELECT'),
                values: [1, 10, 0] // userId, limit, offset
            });
            
            // Check if counts query was called correctly
            expect(pool.query).toHaveBeenNthCalledWith(2, {
                text: expect.stringContaining('COUNT'),
                values: [1] // userId
            });

            // Check returned structure
            expect(result).toHaveProperty('notifications');
            expect(result).toHaveProperty('total', 2);
            expect(result).toHaveProperty('unreadCount', 1);
            expect(result.notifications).toHaveLength(2);
            
            // Check notification format
            expect(result.notifications[0]).toHaveProperty('id', 123);
            expect(result.notifications[0]).toHaveProperty('type');
            expect(result.notifications[0]).toHaveProperty('timestamp', 'time ago');
        });

        it('should filter notifications correctly', async () => {
            // Mock successful query responses
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 123,
                    typ: 'anfrage',
                    titel: 'Test',
                    nachricht: 'Test message',
                    erstellt_am: new Date(),
                    gelesen: false
                }]
            });
            
            pool.query.mockResolvedValueOnce({
                rows: [{ total: '1', unread: '1' }]
            });

            const options = {
                limit: 5,
                offset: 10,
                unreadOnly: true,
                type: 'anfrage'
            };

            await NotificationService.getNotifications(1, options);

            // Check if correct filters were applied
            expect(pool.query).toHaveBeenNthCalledWith(1, {
                text: expect.stringContaining('WHERE benutzer_id = $1 AND gelesen = false AND typ = $2'),
                values: [1, 'anfrage', 5, 10] // userId, type, limit, offset
            });
        });

        it('should handle database errors gracefully', async () => {
            // Mock error response
            const testError = new Error('Database error');
            pool.query.mockRejectedValue(testError);

            // Mock console.error
            console.error = jest.fn();

            await expect(NotificationService.getNotifications(1)).rejects.toThrow();

            // Check if error was logged
            expect(console.error).toHaveBeenCalledWith(
                'Notification retrieval error:',
                testError
            );
        });
    });

    describe('markAsRead', () => {
        it('should mark notifications as read successfully', async () => {
            // Mock successful query response
            pool.query.mockResolvedValue({
                rowCount: 2
            });

            const userId = 1;
            const notificationIds = [123, 456];

            const result = await NotificationService.markAsRead(userId, notificationIds);

            // Check if pool.query was called with correct parameters
            expect(pool.query).toHaveBeenCalledWith({
                text: expect.stringContaining('UPDATE benachrichtigungen'),
                values: [userId, notificationIds]
            });

            // Check returned result
            expect(result).toEqual({
                success: true,
                updatedCount: 2
            });
        });

        it('should mark a single notification as read', async () => {
            // Mock successful query response
            pool.query.mockResolvedValue({
                rowCount: 1
            });

            const userId = 1;
            const notificationId = 123;

            const result = await NotificationService.markAsRead(userId, notificationId);

            // Check if single ID was converted to array
            expect(pool.query).toHaveBeenCalledWith({
                text: expect.stringContaining('UPDATE benachrichtigungen'),
                values: [userId, [notificationId]]
            });

            expect(result.success).toBe(true);
            expect(result.updatedCount).toBe(1);
        });

        it('should handle database errors gracefully', async () => {
            // Mock error response
            const testError = new Error('Database update failed');
            pool.query.mockRejectedValue(testError);

            // Mock console.error to avoid cluttering test output
            console.error = jest.fn();

            const result = await NotificationService.markAsRead(1, [123]);

            // Check if error was logged
            expect(console.error).toHaveBeenCalledWith(
                'Notification mark as read error:',
                testError
            );

            // Check returned result
            expect(result).toEqual({
                success: false,
                error: 'Database update failed'
            });
        });
    });

    describe('mapNotificationType', () => {
        it('should map notification types correctly', () => {
            const requestType = NotificationService.mapNotificationType('anfrage');
            const appointmentType = NotificationService.mapNotificationType('termin');
            const projectType = NotificationService.mapNotificationType('projekt');
            const systemType = NotificationService.mapNotificationType('system');
            const unknownType = NotificationService.mapNotificationType('unknown');

            expect(requestType).toEqual({
                key: 'request',
                label: 'Anfrage',
                icon: 'envelope',
                color: 'info'
            });

            expect(appointmentType.key).toBe('appointment');
            expect(projectType.key).toBe('project');
            expect(systemType.key).toBe('system');
            expect(unknownType.key).toBe('default');
        });
    });

    describe('generateNotificationLink', () => {
        it('should generate correct links based on notification type', () => {
            const requestNotification = { typ: 'anfrage', referenz_id: 123 };
            const appointmentNotification = { typ: 'termin', referenz_id: 456 };
            const projectNotification = { typ: 'projekt', referenz_id: 789 };
            const systemNotification = { typ: 'system' };

            expect(NotificationService.generateNotificationLink(requestNotification))
                .toBe('/dashboard/requests/123');
            
            expect(NotificationService.generateNotificationLink(appointmentNotification))
                .toBe('/dashboard/termine/456');
            
            expect(NotificationService.generateNotificationLink(projectNotification))
                .toBe('/dashboard/projekte/789');
            
            expect(NotificationService.generateNotificationLink(systemNotification))
                .toBe('/dashboard/notifications');
        });
    });
});