const request = require('supertest');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');

// Mock controllers and middleware
jest.mock('../../controllers/dashboard.controller', () => ({
  getDashboardData: jest.fn().mockResolvedValue({
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
    notifications: [{ id: 1, message: 'Test notification', created_at: new Date() }],
    recentRequests: [{ id: 1, name: 'Test Request', created_at: new Date() }],
    upcomingAppointments: [{ id: 1, title: 'Test Appointment', date: new Date() }],
    systemStatus: { maintenance_mode: false, backup_status: 'ok' }
  }),
  globalSearch: jest.fn().mockResolvedValue({
    customers: [{ id: 1, name: 'Test Customer' }],
    projects: [{ id: 1, titel: 'Test Project' }],
    appointments: [{ id: 1, titel: 'Test Appointment' }],
    requests: [{ id: 1, name: 'Test Request' }],
    services: [{ id: 1, name: 'Test Service' }]
  }),
  getNotifications: jest.fn().mockResolvedValue({
    notifications: [
      { id: 1, message: 'Test notification 1', created_at: new Date() },
      { id: 2, message: 'Test notification 2', created_at: new Date() }
    ]
  }),
  markNotificationsRead: jest.fn().mockResolvedValue({
    success: true,
    message: 'Notifications marked as read'
  }),
  getDashboardStats: jest.fn().mockResolvedValue({
    stats: {
      requests: { total: 10, new: 5 },
      projects: { total: 15, active: 8 },
      appointments: { total: 20, upcoming: 12 },
      customers: { total: 25 }
    }
  })
}));

jest.mock('../../middleware/auth.middleware', () => ({
  isAuthenticated: (req, res, next) => next()
}));

// Setup app for testing
const setupApp = () => {
  const app = express();
  
  // Mock session
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false
  }));
  
  // Mock flash messages
  app.use(flash());
  
  // Mock CSRF
  app.use((req, res, next) => {
    req.csrfToken = () => 'test-csrf-token';
    next();
  });
  
  // Setup body parser
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  
  // Add session user
  app.use((req, res, next) => {
    req.session.user = { id: 1, name: 'Test User' };
    req.newRequestsCount = 5;
    next();
  });
  
  // Setup view engine (mock)
  app.set('view engine', 'ejs');
  app.set('views', 'views');
  app.engine('ejs', (path, data, cb) => cb(null, JSON.stringify(data)));
  
  // Load routes
  const dashboardRoutes = require('../../routes/dashboard.routes');
  app.use('/dashboard', dashboardRoutes);
  
  return app;
};

describe('Dashboard Routes', () => {
  let app;
  
  beforeEach(() => {
    app = setupApp();
    jest.clearAllMocks();
  });
  
  describe('GET /', () => {
    it('should render dashboard home page', async () => {
      const res = await request(app).get('/dashboard');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Dashboard - Rising BSM');
      expect(data.stats.requests.total).toBe(10);
      expect(data.notifications).toHaveLength(1);
    });
    
    it('should handle errors and pass to error middleware', async () => {
      const dashboardController = require('../../controllers/dashboard.controller');
      dashboardController.getDashboardData.mockRejectedValueOnce(new Error('Dashboard data error'));
      
      const res = await request(app).get('/dashboard');
      expect(res.status).toBe(500);
    });
  });
  
  describe('GET /search', () => {
    it('should render search results', async () => {
      const res = await request(app).get('/dashboard/search?query=test');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toContain('Suchergebnisse: test');
      expect(data.results.customers).toHaveLength(1);
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .get('/dashboard/search?query=test')
        .set('Accept', 'application/json');
      
      expect(res.status).toBe(200);
      expect(res.body.customers).toHaveLength(1);
      expect(res.body.projects).toHaveLength(1);
    });
  });
  
  describe('GET /notifications', () => {
    it('should render notifications page', async () => {
      const res = await request(app).get('/dashboard/notifications');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Benachrichtigungen - Rising BSM');
      expect(data.notifications).toHaveLength(2);
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .get('/dashboard/notifications')
        .set('Accept', 'application/json');
      
      expect(res.status).toBe(200);
      expect(res.body.notifications).toHaveLength(2);
    });
  });
  
  describe('POST /notifications/mark-read', () => {
    it('should mark notification as read and return JSON', async () => {
      const res = await request(app)
        .post('/dashboard/notifications/mark-read')
        .send({ id: 1 });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    
    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .post('/dashboard/notifications/mark-read')
        .send({ all: true });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
  
  describe('GET /stats', () => {
    it('should return dashboard statistics as JSON', async () => {
      const res = await request(app).get('/dashboard/stats');
      
      expect(res.status).toBe(200);
      expect(res.body.stats.requests.total).toBe(10);
      expect(res.body.stats.projects.total).toBe(15);
    });
    
    it('should handle errors', async () => {
      const dashboardController = require('../../controllers/dashboard.controller');
      dashboardController.getDashboardStats.mockRejectedValueOnce(new Error('Stats error'));
      
      const res = await request(app).get('/dashboard/stats');
      expect(res.status).toBe(500);
    });
  });
  
  describe('GET /logout', () => {
    it('should destroy session and redirect to login', async () => {
      const res = await request(app).get('/dashboard/logout');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });
});
