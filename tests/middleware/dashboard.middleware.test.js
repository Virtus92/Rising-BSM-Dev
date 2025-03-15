const dashboardMiddleware = require('../../middleware/dashboard.middleware');
const pool = require('../../services/db.service');
const NotificationService = require('../../services/notification.service');

// Mock dependencies
jest.mock('../../services/db.service');
jest.mock('../../services/notification.service');

describe('Dashboard Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { 
      session: { user: { id: 1 } },
      path: '/dashboard',
      ip: '127.0.0.1'
    };
    res = {};
    next = jest.fn();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getNewRequestsCountMiddleware', () => {
    it('should attach new requests count to request object', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '5' }] });
      
      await dashboardMiddleware.getNewRequestsCountMiddleware(req, res, next);
      
      expect(pool.query).toHaveBeenCalled();
      expect(req.newRequestsCount).toBe(5);
      expect(next).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      pool.query.mockRejectedValue(new Error('DB error'));
      
      await dashboardMiddleware.getNewRequestsCountMiddleware(req, res, next);
      
      expect(req.newRequestsCount).toBe(0);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('attachNotificationsMiddleware', () => {
    it('should attach notifications for authenticated users', async () => {
      const mockNotifications = {
        notifications: [{ id: 1, message: 'Test notification' }],
        unreadCount: 3
      };
      
      NotificationService.getNotifications.mockResolvedValue(mockNotifications);
      
      await dashboardMiddleware.attachNotificationsMiddleware(req, res, next);
      
      expect(NotificationService.getNotifications).toHaveBeenCalledWith(1, expect.any(Object));
      expect(req.notifications).toEqual(mockNotifications.notifications);
      expect(req.unreadNotificationsCount).toBe(3);
      expect(next).toHaveBeenCalled();
    });

    it('should set empty notifications for unauthenticated users', async () => {
      req.session = null;
      
      await dashboardMiddleware.attachNotificationsMiddleware(req, res, next);
      
      expect(NotificationService.getNotifications).not.toHaveBeenCalled();
      expect(req.notifications).toEqual([]);
      expect(req.unreadNotificationsCount).toBe(0);
      expect(next).toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      NotificationService.getNotifications.mockRejectedValue(new Error('Service error'));
      
      await dashboardMiddleware.attachNotificationsMiddleware(req, res, next);
      
      expect(req.notifications).toEqual([]);
      expect(req.unreadNotificationsCount).toBe(0);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('logUserActivityMiddleware', () => {
    it('should log activity for authenticated users', async () => {
      pool.query.mockResolvedValue({});
      
      await dashboardMiddleware.logUserActivityMiddleware(req, res, next);
      
      expect(pool.query).toHaveBeenCalled();
      expect(pool.query.mock.calls[0][0].values).toContain(req.session.user.id);
      expect(pool.query.mock.calls[0][0].values).toContain(req.path);
      expect(next).toHaveBeenCalled();
    });

    it('should skip logging for unauthenticated users', async () => {
      req.session = null;
      
      await dashboardMiddleware.logUserActivityMiddleware(req, res, next);
      
      expect(pool.query).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      pool.query.mockRejectedValue(new Error('DB error'));
      
      await dashboardMiddleware.logUserActivityMiddleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('prepareDashboardContextMiddleware', () => {
    it('should be an array of middlewares', () => {
      expect(Array.isArray(dashboardMiddleware.prepareDashboardContextMiddleware)).toBe(true);
      expect(dashboardMiddleware.prepareDashboardContextMiddleware.length).toBe(3);
    });
  });
});
