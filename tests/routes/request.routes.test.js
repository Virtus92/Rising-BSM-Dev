const request = require('supertest');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');

// Mock controllers and middleware
jest.mock('../../controllers/request.controller', () => ({
  getAllRequests: jest.fn().mockResolvedValue({ 
    requests: [{ id: 1, name: 'Test Request', email: 'test@example.com' }],
    pagination: { page: 1, pageCount: 1 },
    filters: { statuses: ['neu', 'in_bearbeitung'], services: [] }
  }),
  getRequestById: jest.fn().mockResolvedValue({ 
    request: { id: 1, name: 'Test Request', email: 'test@example.com' },
    notes: []
  }),
  updateRequestStatus: jest.fn().mockResolvedValue({ updated: true }),
  addRequestNote: jest.fn().mockResolvedValue({ noteId: 1 }),
  exportRequests: jest.fn().mockResolvedValue({
    format: 'json',
    data: [{ id: 1, name: 'Test Request' }],
    contentType: 'application/json',
    filename: 'requests-export.json'
  })
}));

jest.mock('../../middleware/auth', () => ({
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
  const requestRoutes = require('../../routes/request.routes');
  app.use('/dashboard/requests', requestRoutes);
  
  return app;
};

describe('Request Routes', () => {
  let app;
  
  beforeEach(() => {
    app = setupApp();
    jest.clearAllMocks();
  });
  
  describe('GET /', () => {
    it('should render requests list page', async () => {
      const res = await request(app).get('/dashboard/requests');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Kontaktanfragen - Rising BSM');
      expect(data.requests).toHaveLength(1);
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .get('/dashboard/requests')
        .set('Accept', 'application/json');
      
      expect(res.status).toBe(200);
      expect(res.body.requests).toHaveLength(1);
    });
  });
  
  describe('GET /export', () => {
    it('should export requests as JSON', async () => {
      const res = await request(app).get('/dashboard/requests/export');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 1, name: 'Test Request' }]);
      expect(res.header['content-type']).toContain('application/json');
      expect(res.header['content-disposition']).toContain('requests-export.json');
    });
    
    it('should handle export errors', async () => {
      const requestController = require('../../controllers/request.controller');
      const error = new Error('Export failed');
      error.statusCode = 500;
      requestController.exportRequests.mockRejectedValueOnce(error);
      
      const res = await request(app).get('/dashboard/requests/export');
      
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('GET /:id', () => {
    it('should render request detail page', async () => {
      const res = await request(app).get('/dashboard/requests/1');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toContain('Test Request');
      expect(data.request.id).toBe(1);
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .get('/dashboard/requests/1')
        .set('Accept', 'application/json');
      
      expect(res.status).toBe(200);
      expect(res.body.request.id).toBe(1);
    });
    
    it('should handle not found errors', async () => {
      const requestController = require('../../controllers/request.controller');
      const error = new Error('Request not found');
      error.statusCode = 404;
      requestController.getRequestById.mockRejectedValueOnce(error);
      
      const res = await request(app).get('/dashboard/requests/999');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/requests');
    });
  });
  
  describe('POST /update-status', () => {
    it('should update request status and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/requests/update-status')
        .send({ id: 1, status: 'in_bearbeitung' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/requests/1');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/requests/update-status')
        .set('Accept', 'application/json')
        .send({ id: 1, status: 'in_bearbeitung' });
      
      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(true);
    });
    
    it('should handle validation errors', async () => {
      const requestController = require('../../controllers/request.controller');
      const error = new Error('Invalid status');
      error.statusCode = 400;
      requestController.updateRequestStatus.mockRejectedValueOnce(error);
      
      const res = await request(app)
        .post('/dashboard/requests/update-status')
        .send({ id: 1, status: 'invalid' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/requests/1');
    });
  });
  
  describe('POST /:id/add-note', () => {
    it('should add a note to a request and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/requests/1/add-note')
        .send({ content: 'Test note' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/requests/1');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/requests/1/add-note')
        .set('Accept', 'application/json')
        .send({ content: 'Test note' });
      
      expect(res.status).toBe(200);
      expect(res.body.noteId).toBe(1);
    });
    
    it('should handle validation errors', async () => {
      const requestController = require('../../controllers/request.controller');
      const error = new Error('Content is required');
      error.statusCode = 400;
      requestController.addRequestNote.mockRejectedValueOnce(error);
      
      const res = await request(app)
        .post('/dashboard/requests/1/add-note')
        .send({ content: '' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/requests/1');
    });
  });
});
