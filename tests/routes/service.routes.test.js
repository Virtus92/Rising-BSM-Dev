const request = require('supertest');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');

// Mock controllers and middleware
jest.mock('../../controllers/service.controller', () => ({
  getAllServices: jest.fn().mockResolvedValue({ 
    services: [{ id: 1, name: 'Test Service' }],
    pagination: { page: 1, pageCount: 1 },
    filters: {}
  }),
  createService: jest.fn().mockResolvedValue({ serviceId: 1 }),
  getServiceById: jest.fn().mockResolvedValue({ 
    service: { id: 1, name: 'Test Service', preis_basis: '100', einheit: 'Stunde' } 
  }),
  updateService: jest.fn().mockResolvedValue({ updated: true }),
  toggleServiceStatus: jest.fn().mockResolvedValue({ toggled: true }),
  exportServices: jest.fn().mockResolvedValue({ 
    format: 'json',
    data: [{ id: 1, name: 'Test Service' }],
    contentType: 'application/json',
    filename: 'services-export.json'
  }),
  getServiceStatistics: jest.fn().mockResolvedValue({ 
    statistics: { name: 'Test Service', usageCount: 10 } 
  })
}));

jest.mock('../../middleware/auth', () => ({
  isAuthenticated: (req, res, next) => next()
}));

jest.mock('../../middleware/validation.middleware', () => ({
  validateService: (req, res, next) => next()
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
  const serviceRoutes = require('../../routes/service.routes');
  app.use('/dashboard/services', serviceRoutes);
  
  return app;
};

describe('Service Routes', () => {
  let app;
  
  beforeEach(() => {
    app = setupApp();
    jest.clearAllMocks();
  });
  
  describe('GET /', () => {
    it('should render services list page', async () => {
      const res = await request(app).get('/dashboard/services');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Dienstleistungen - Rising BSM');
      expect(data.services).toHaveLength(1);
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .get('/dashboard/services')
        .set('Accept', 'application/json');
      
      expect(res.status).toBe(200);
      expect(res.body.services).toHaveLength(1);
    });
  });
  
  describe('GET /neu', () => {
    it('should render new service form', async () => {
      const res = await request(app).get('/dashboard/services/neu');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Neue Dienstleistung - Rising BSM');
    });
  });
  
  describe('POST /neu', () => {
    it('should create a new service and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/services/neu')
        .send({ name: 'New Service', preis_basis: '150', einheit: 'Stunde' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/services/1');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/services/neu')
        .set('Accept', 'application/json')
        .send({ name: 'New Service', preis_basis: '150', einheit: 'Stunde' });
      
      expect(res.status).toBe(200);
      expect(res.body.serviceId).toBe(1);
    });
    
    it('should handle validation errors', async () => {
      const serviceController = require('../../controllers/service.controller');
      const error = new Error('Validation failed');
      error.statusCode = 400;
      serviceController.createService.mockRejectedValueOnce(error);
      
      const res = await request(app)
        .post('/dashboard/services/neu')
        .send({ name: '' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/services/neu');
    });
  });
  
  describe('GET /export', () => {
    it('should export services as JSON', async () => {
      const res = await request(app).get('/dashboard/services/export');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 1, name: 'Test Service' }]);
      expect(res.header['content-type']).toContain('application/json');
      expect(res.header['content-disposition']).toContain('services-export.json');
    });
    
    it('should handle export errors', async () => {
      const serviceController = require('../../controllers/service.controller');
      const error = new Error('Export failed');
      error.statusCode = 500;
      serviceController.exportServices.mockRejectedValueOnce(error);
      
      const res = await request(app).get('/dashboard/services/export');
      
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('POST /:id/toggle-status', () => {
    it('should toggle service status and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/services/1/toggle-status');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/services/1');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/services/1/toggle-status')
        .set('Accept', 'application/json');
      
      expect(res.status).toBe(200);
      expect(res.body.toggled).toBe(true);
    });
  });
  
  describe('GET /:id', () => {
    it('should render service detail page', async () => {
      const res = await request(app).get('/dashboard/services/1');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toContain('Test Service');
      expect(data.service.id).toBe(1);
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .get('/dashboard/services/1')
        .set('Accept', 'application/json');
      
      expect(res.status).toBe(200);
      expect(res.body.service.id).toBe(1);
    });
    
    it('should handle not found errors', async () => {
      const serviceController = require('../../controllers/service.controller');
      const error = new Error('Service not found');
      error.statusCode = 404;
      serviceController.getServiceById.mockRejectedValueOnce(error);
      
      const res = await request(app).get('/dashboard/services/999');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/services');
    });
  });
  
  describe('GET /:id/edit', () => {
    it('should render service edit form', async () => {
      const res = await request(app).get('/dashboard/services/1/edit');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toContain('Test Service');
      expect(data.service.id).toBe(1);
    });
  });
  
  describe('POST /:id/edit', () => {
    it('should update service and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/services/1/edit')
        .send({ name: 'Updated Service', preis_basis: '200' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/services/1');
    });
    
    it('should handle validation errors', async () => {
      const serviceController = require('../../controllers/service.controller');
      const error = new Error('Validation failed');
      error.statusCode = 400;
      serviceController.updateService.mockRejectedValueOnce(error);
      
      const res = await request(app)
        .post('/dashboard/services/1/edit')
        .send({ name: '' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/services/1/edit');
    });
  });
  
  describe('GET /:id/statistics', () => {
    it('should render service statistics page', async () => {
      const res = await request(app).get('/dashboard/services/1/statistics');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toContain('Statistiken');
      expect(data.statistics.name).toBe('Test Service');
    });
  });
});
