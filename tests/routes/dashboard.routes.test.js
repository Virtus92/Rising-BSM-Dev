const express = require('express');
const request = require('supertest');
const session = require('express-session');
const path = require('path');

// Mock-Funktionen vor jest.mock definieren
const mockGetDashboardData = jest.fn();
const mockGlobalSearch = jest.fn();
const mockGetNotifications = jest.fn();
const mockMarkNotificationsRead = jest.fn();
const mockGetDashboardStats = jest.fn();

// Mock des Controllers
jest.mock('../../controllers/dashboard.controller', () => ({
  getDashboardData: mockGetDashboardData,
  globalSearch: mockGlobalSearch,
  getNotifications: mockGetNotifications,
  markNotificationsRead: mockMarkNotificationsRead,
  getDashboardStats: mockGetDashboardStats
}));

// Mock des Auth Middleware
jest.mock('../../middleware/auth', () => ({
  isAuthenticated: (req, res, next) => {
    req.session = req.session || {};
    req.session.user = {
      id: 'test-user-id',
      email: 'test@example.com'
    };
    req.session.userId = 'test-user-id';
    next();
  }
}));

describe('Dashboard Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    
    // Session Middleware
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false
    }));
    
    // Body Parser
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Mock view engine
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../../views'));
    app.engine('ejs', (filePath, options, callback) => {
      // Mock render function that returns the data that would be passed to the view
      callback(null, JSON.stringify(options));
    });
    
    // CSRF Mock
    app.use((req, res, next) => {
      req.csrfToken = () => 'test-csrf-token';
      next();
    });
    
    // Flash messages
    app.use((req, res, next) => {
      req.flash = jest.fn();
      next();
    });

    // Add newRequestsCount to req
    app.use((req, res, next) => {
      req.newRequestsCount = 0;
      next();
    });
    
    // Routes
    const dashboardRoutes = require('../../routes/dashboard.routes');
    app.use('/dashboard', dashboardRoutes);
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({ error: err.message });
    });
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    beforeEach(() => {
      mockGetDashboardData.mockResolvedValue({
        stats: {
          requests: { total: 10, new: 5 },
          projects: { total: 15, active: 8 },
          appointments: { total: 20, upcoming: 12 },
          customers: { total: 25 }
        },
        chartFilters: ['lastWeek', 'lastMonth', 'lastYear'],
        charts: {
          projectsGrowth: [],
          requestsDistribution: [],
          revenueByMonth: []
        },
        notifications: [{ id: 1, message: 'Test notification' }],
        recentRequests: [{ id: 1, name: 'Test Request' }],
        upcomingAppointments: [{ id: 1, title: 'Test Appointment' }],
        systemStatus: { maintenance_mode: false, backup_status: 'ok' }
      });
    });

    it('should render dashboard home page', async () => {
      const response = await request(app).get('/dashboard');
      expect(response.status).toBe(200);
      const data = JSON.parse(response.text);
      expect(data.title).toBe('Dashboard - Rising BSM');
    });

    it('should handle errors', async () => {
      mockGetDashboardData.mockRejectedValue(new Error('Test error'));
      const response = await request(app).get('/dashboard');
      expect(response.status).toBe(500);
    });
  });

  describe('GET /dashboard/search', () => {
    beforeEach(() => {
      mockGlobalSearch.mockResolvedValue({
        customers: [{ id: 1, name: 'Test Customer' }],
        projects: [{ id: 1, title: 'Test Project' }],
        appointments: [{ id: 1, title: 'Test Appointment' }],
        requests: [{ id: 1, name: 'Test Request' }],
        services: [{ id: 1, name: 'Test Service' }]
      });
    });

    it('should return search results as JSON when Accept header is application/json', async () => {
      const response = await request(app)
        .get('/dashboard/search')
        .set('Accept', 'application/json')
        .query({ query: 'test' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        customers: [{ id: 1, name: 'Test Customer' }],
        projects: [{ id: 1, title: 'Test Project' }],
        appointments: [{ id: 1, title: 'Test Appointment' }],
        requests: [{ id: 1, name: 'Test Request' }],
        services: [{ id: 1, name: 'Test Service' }]
      });
    });

    it('should render search page when Accept header is not application/json', async () => {
      const response = await request(app)
        .get('/dashboard/search')
        .query({ query: 'test' });

      expect(response.status).toBe(200);
      const data = JSON.parse(response.text);
      expect(data.title).toContain('Suchergebnisse: test');
    });
  });

  describe('GET /dashboard/notifications', () => {
    beforeEach(() => {
      mockGetNotifications.mockResolvedValue({
        notifications: [
          { id: 1, title: 'Test Notification', message: 'Test Message' }
        ],
        unreadCount: 1,
        totalCount: 1
      });
    });

    it('should return notifications as JSON when Accept header is application/json', async () => {
      const response = await request(app)
        .get('/dashboard/notifications')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        notifications: [
          { id: 1, title: 'Test Notification', message: 'Test Message' }
        ],
        unreadCount: 1,
        totalCount: 1
      });
    });

    it('should render notifications page when Accept header is not application/json', async () => {
      const response = await request(app)
        .get('/dashboard/notifications');

      expect(response.status).toBe(200);
      const data = JSON.parse(response.text);
      expect(data.title).toBe('Benachrichtigungen - Rising BSM');
    });
  });

  describe('POST /dashboard/notifications/mark-read', () => {
    beforeEach(() => {
      mockMarkNotificationsRead.mockResolvedValue({
        success: true,
        message: 'Notifications marked as read'
      });
    });

    it('should mark notification as read', async () => {
      const response = await request(app)
        .post('/dashboard/notifications/mark-read')
        .send({ id: 1 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Notifications marked as read'
      });
    });

    it('should mark all notifications as read', async () => {
      const response = await request(app)
        .post('/dashboard/notifications/mark-read')
        .send({ all: true });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Notifications marked as read'
      });
    });
  });

  describe('GET /dashboard/stats', () => {
    beforeEach(() => {
      mockGetDashboardStats.mockResolvedValue({
        stats: {
          requests: { total: 10, new: 5 },
          projects: { total: 15, active: 8 },
          appointments: { total: 20, upcoming: 12 },
          customers: { total: 25 }
        }
      });
    });

    it('should return dashboard statistics as JSON', async () => {
      const response = await request(app)
        .get('/dashboard/stats');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        stats: {
          requests: { total: 10, new: 5 },
          projects: { total: 15, active: 8 },
          appointments: { total: 20, upcoming: 12 },
          customers: { total: 25 }
        }
      });
    });

    it('should handle errors', async () => {
      mockGetDashboardStats.mockRejectedValue(new Error('Test error'));
      const response = await request(app)
        .get('/dashboard/stats');
      expect(response.status).toBe(500);
    });
  });

  describe('GET /dashboard/logout', () => {
    it('should destroy session and redirect to login', async () => {
      const response = await request(app)
        .get('/dashboard/logout');
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/login');
    });
  });
});
