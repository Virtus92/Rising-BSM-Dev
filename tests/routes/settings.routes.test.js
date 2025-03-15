const request = require('supertest');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const csrf = require('csurf');

// Mock controllers and middleware
jest.mock('../../controllers/settings.controller', () => ({
  getUserSettings: jest.fn().mockResolvedValue({ settings: { sprache: 'de', dark_mode: false } }),
  updateUserSettings: jest.fn().mockResolvedValue(true),
  getSystemSettings: jest.fn().mockResolvedValue({ settings: { maintenance_mode: false } }),
  updateSystemSettings: jest.fn().mockResolvedValue(true),
  getBackupSettings: jest.fn().mockResolvedValue({ 
    settings: { auto_backup: true }, 
    backups: [{ id: 1, created_at: new Date() }] 
  }),
  updateBackupSettings: jest.fn().mockResolvedValue(true),
  triggerManualBackup: jest.fn().mockResolvedValue(true)
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
    req.session.user = { id: 1, name: 'Test User', sprache: 'de', dark_mode: false, role: 'admin' };
    req.newRequestsCount = 5;
    next();
  });
  
  // Setup view engine (mock)
  app.set('view engine', 'ejs');
  app.set('views', 'views');
  app.engine('ejs', (path, data, cb) => cb(null, JSON.stringify(data)));
  
  // Load routes
  const settingsRoutes = require('../../routes/settings.routes');
  app.use('/dashboard/settings', settingsRoutes);
  
  return app;
};

describe('Settings Routes', () => {
  let app;
  
  beforeEach(() => {
    app = setupApp();
    jest.clearAllMocks();
  });
  
  describe('GET /', () => {
    it('should render settings page with user settings', async () => {
      const res = await request(app).get('/dashboard/settings');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Einstellungen - Rising BSM');
      expect(data.settings).toEqual({ sprache: 'de', dark_mode: false });
    });
    
    it('should handle errors and pass to error middleware', async () => {
      const settingsController = require('../../controllers/settings.controller');
      settingsController.getUserSettings.mockRejectedValueOnce(new Error('Database error'));
      
      const res = await request(app).get('/dashboard/settings');
      expect(res.status).toBe(500);
    });
  });
  
  describe('POST /update', () => {
    it('should update user settings and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/settings/update')
        .send({ sprache: 'en', dark_mode: 'on' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/settings');
    });
    
    it('should handle errors during update', async () => {
      const settingsController = require('../../controllers/settings.controller');
      settingsController.updateUserSettings.mockRejectedValueOnce(new Error('Update failed'));
      
      const res = await request(app)
        .post('/dashboard/settings/update')
        .send({ sprache: 'en', dark_mode: 'on' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/settings');
    });
  });
  
  describe('GET /system', () => {
    it('should render system settings page', async () => {
      const res = await request(app).get('/dashboard/settings/system');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Systemeinstellungen - Rising BSM');
      expect(data.settings).toEqual({ maintenance_mode: false });
    });
  });
  
  describe('POST /system/update', () => {
    it('should update system settings and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/settings/system/update')
        .send({ maintenance_mode: 'on' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/settings/system');
    });
  });
  
  describe('GET /backup', () => {
    it('should render backup settings page', async () => {
      const res = await request(app).get('/dashboard/settings/backup');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Backup Einstellungen - Rising BSM');
      expect(data.settings).toEqual({ auto_backup: true });
      expect(data.backups).toHaveLength(1);
    });
  });
  
  describe('POST /backup/update', () => {
    it('should update backup settings and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/settings/backup/update')
        .send({ auto_backup: 'on' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/settings/backup');
    });
  });
  
  describe('POST /backup/trigger', () => {
    it('should trigger manual backup and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/settings/backup/trigger');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/settings/backup');
    });
  });
});
