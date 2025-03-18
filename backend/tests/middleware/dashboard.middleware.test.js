const dashboardMiddleware = require('../../middleware/dashboard.middleware');
const pool = require('../../services/db.service');
const NotificationService = require('../../services/notification.service');

// Mock dependencies
jest.mock('../../services/db.service');
jest.mock('../../services/notification.service');

describe('Dashboard Middleware', () => {
    let req, res, next;
    
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        
        // Setup default request, response, and next function
        req = {
            session: {
                user: { id: 1 }
            },
            path: '/dashboard',
            ip: '127.0.0.1'
        };
        res = {};
        next = jest.fn();
    });

    afterAll(() => {
        consoleSpy.mockRestore();
    });

    describe('getNewRequestsCountMiddleware', () => {
        it('should attach newRequestsCount to req object on success', async () => {
            pool.query.mockResolvedValueOnce({
                rows: [{ count: '5' }]
            });

            await dashboardMiddleware.getNewRequestsCountMiddleware(req, res, next);

            expect(req.newRequestsCount).toBe(5);
            expect(next).toHaveBeenCalled();
            expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT COUNT(*) FROM kontaktanfragen'));
        });

        it('should set newRequestsCount to 0 when no results', async () => {
            pool.query.mockResolvedValueOnce({
                rows: [{ count: null }]
            });

            await dashboardMiddleware.getNewRequestsCountMiddleware(req, res, next);

            expect(req.newRequestsCount).toBe(0);
            expect(next).toHaveBeenCalled();
        });

        it('should handle database errors and set count to 0', async () => {
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            await dashboardMiddleware.getNewRequestsCountMiddleware(req, res, next);

            expect(req.newRequestsCount).toBe(0);
            expect(next).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('attachNotificationsMiddleware', () => {
        it('should attach notifications for authenticated users', async () => {
            const mockNotifications = {
                notifications: [{ id: 1, message: 'Test notification' }],
                unreadCount: 3
            };
            NotificationService.getNotifications.mockResolvedValueOnce(mockNotifications);

            await dashboardMiddleware.attachNotificationsMiddleware(req, res, next);

            expect(req.notifications).toEqual(mockNotifications.notifications);
            expect(req.unreadNotificationsCount).toBe(3);
            expect(next).toHaveBeenCalled();
            expect(NotificationService.getNotifications).toHaveBeenCalledWith(1, { limit: 5, unreadOnly: true });
        });

        it('should attach empty notifications for unauthenticated users', async () => {
            req.session = null;

            await dashboardMiddleware.attachNotificationsMiddleware(req, res, next);

            expect(req.notifications).toEqual([]);
            expect(req.unreadNotificationsCount).toBe(0);
            expect(next).toHaveBeenCalled();
            expect(NotificationService.getNotifications).not.toHaveBeenCalled();
        });

        it('should handle service errors', async () => {
            NotificationService.getNotifications.mockRejectedValueOnce(new Error('Service error'));

            await dashboardMiddleware.attachNotificationsMiddleware(req, res, next);

            expect(req.notifications).toEqual([]);
            expect(req.unreadNotificationsCount).toBe(0);
            expect(next).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('logUserActivityMiddleware', () => {
        it('should log activity for authenticated users', async () => {
            pool.query.mockResolvedValueOnce({});

            await dashboardMiddleware.logUserActivityMiddleware(req, res, next);

            expect(pool.query).toHaveBeenCalledWith(expect.objectContaining({
                text: expect.stringContaining('INSERT INTO benutzer_aktivitaet'),
                values: [1, 'route_access', '/dashboard', '127.0.0.1']
            }));
            expect(next).toHaveBeenCalled();
        });

        it('should skip logging for unauthenticated users', async () => {
            req.session = null;

            await dashboardMiddleware.logUserActivityMiddleware(req, res, next);

            expect(pool.query).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });

        it('should handle database errors', async () => {
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            await dashboardMiddleware.logUserActivityMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('prepareDashboardContextMiddleware', () => {
        it('should be an array of middleware functions', () => {
            expect(Array.isArray(dashboardMiddleware.prepareDashboardContextMiddleware)).toBe(true);
            expect(dashboardMiddleware.prepareDashboardContextMiddleware).toHaveLength(3);
        });
    });
});