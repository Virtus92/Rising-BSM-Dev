const request = require('supertest');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');

// Mock database for direct queries used in routes
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn().mockImplementation((query) => {
      if (query.text && query.text.includes('SELECT * FROM kunden WHERE id =')) {
        return Promise.resolve({
          rows: [{
            id: 1, 
            name: 'Test Customer',
            email: 'customer@test.com',
            telefon: '123456789',
            firma: 'Test Firma',
            adresse: 'Test Straße 1',
            plz: '12345',
            ort: 'Teststadt',
            status: 'aktiv',
            erstellt_am: new Date()
          }]
        });
      }
      return Promise.resolve({ rows: [] });
    })
  };
  return { Pool: jest.fn(() => mockPool) };
});

// Mock controllers and middleware
jest.mock('../../controllers/customer.controller', () => ({
  getAllCustomers: jest.fn().mockResolvedValue({ 
    customers: [{ id: 1, name: 'Test Customer', email: 'customer@test.com' }],
    pagination: { page: 1, pageCount: 1 },
    filters: { statuses: ['aktiv', 'inaktiv'] },
    stats: { total: 1, active: 1 },
    growthData: []
  }),
  createCustomer: jest.fn().mockResolvedValue({ customerId: 1 }),
  getCustomerById: jest.fn().mockResolvedValue({ 
    customer: { id: 1, name: 'Test Customer', email: 'customer@test.com' },
    projects: [],
    appointments: []
  }),
  updateCustomerStatus: jest.fn().mockResolvedValue({ updated: true }),
  deleteCustomer: jest.fn().mockResolvedValue({ deleted: true }),
  updateCustomer: jest.fn().mockResolvedValue({ updated: true }),
  addCustomerNote: jest.fn().mockResolvedValue({ noteId: 1 }),
  exportCustomers: jest.fn().mockResolvedValue({
    format: 'json',
    data: [{ id: 1, name: 'Test Customer' }],
    contentType: 'application/json',
    filename: 'customers-export.json'
  })
}));

jest.mock('../../middleware/auth.middleware', () => ({
  isAuthenticated: (req, res, next) => next()
}));

jest.mock('../../middleware/validation.middleware', () => ({
  validateCustomer: (req, res, next) => next()
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
  
  // Setup mock database
  global.pool = require('pg').Pool();
  app.use((req, res, next) => {
    req.db = global.pool;
    next();
  });
  
  // Setup view engine (mock)
  app.set('view engine', 'ejs');
  app.set('views', 'views');
  app.engine('ejs', (path, data, cb) => cb(null, JSON.stringify(data)));
  
  // Load routes
  const customerRoutes = require('../../routes/customer.routes');
  app.use('/dashboard/kunden', customerRoutes);
  
  return app;
};

describe('Customer Routes', () => {
  let app;
  
  beforeEach(() => {
    app = setupApp();
    jest.clearAllMocks();
  });
  
  describe('GET /', () => {
    it('should render customers list page', async () => {
      const res = await request(app).get('/dashboard/kunden');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Kunden - Rising BSM');
      expect(data.customers).toHaveLength(1);
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .get('/dashboard/kunden')
        .set('Accept', 'application/json');
      
      expect(res.status).toBe(200);
      expect(res.body.customers).toHaveLength(1);
    });
  });
  
  describe('GET /neu', () => {
    it('should render new customer form', async () => {
      const res = await request(app).get('/dashboard/kunden/neu');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Neuer Kunde - Rising BSM');
    });
    
    it('should pre-fill form from query parameters', async () => {
      const res = await request(app)
        .get('/dashboard/kunden/neu?name=John&email=john@example.com&phone=123456');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.formData.name).toBe('John');
      expect(data.formData.email).toBe('john@example.com');
      expect(data.formData.telefon).toBe('123456');
    });
  });
  
  describe('POST /neu', () => {
    it('should create a new customer and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/kunden/neu')
        .send({ 
          name: 'New Customer', 
          email: 'new@customer.com',
          telefon: '987654321'
        });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/kunden/1');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/kunden/neu')
        .set('Accept', 'application/json')
        .send({ 
          name: 'New Customer', 
          email: 'new@customer.com',
          telefon: '987654321'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.customerId).toBe(1);
    });
    
    it('should handle validation errors', async () => {
      const customerController = require('../../controllers/customer.controller');
      const error = new Error('Validation failed');
      error.statusCode = 400;
      customerController.createCustomer.mockRejectedValueOnce(error);
      
      const res = await request(app)
        .post('/dashboard/kunden/neu')
        .send({ name: '' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/kunden/neu');
    });
  });
  
  describe('GET /export', () => {
    it('should export customers as JSON', async () => {
      const res = await request(app).get('/dashboard/kunden/export');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 1, name: 'Test Customer' }]);
      expect(res.header['content-type']).toContain('application/json');
      expect(res.header['content-disposition']).toContain('customers-export.json');
    });
    
    it('should handle export errors', async () => {
      const customerController = require('../../controllers/customer.controller');
      const error = new Error('Export failed');
      error.statusCode = 500;
      customerController.exportCustomers.mockRejectedValueOnce(error);
      
      const res = await request(app).get('/dashboard/kunden/export');
      
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('POST /update-status', () => {
    it('should update customer status and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/kunden/update-status')
        .send({ id: 1, status: 'inaktiv' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/kunden');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/kunden/update-status')
        .set('Accept', 'application/json')
        .send({ id: 1, status: 'inaktiv' });
      
      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(true);
    });
  });
  
  describe('POST /delete', () => {
    it('should delete customer and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/kunden/delete')
        .send({ id: 1 });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/kunden');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/kunden/delete')
        .set('Accept', 'application/json')
        .send({ id: 1 });
      
      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
    });
  });
  
  describe('GET /:id', () => {
    it('should render customer detail page', async () => {
      const res = await request(app).get('/dashboard/kunden/1');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toContain('Test Customer');
      expect(data.kunde.id).toBe(1);
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .get('/dashboard/kunden/1')
        .set('Accept', 'application/json');
      
      expect(res.status).toBe(200);
      expect(res.body.customer.id).toBe(1);
    });
    
    it('should handle not found errors', async () => {
      const customerController = require('../../controllers/customer.controller');
      const error = new Error('Customer not found');
      error.statusCode = 404;
      customerController.getCustomerById.mockRejectedValueOnce(error);
      
      const res = await request(app).get('/dashboard/kunden/999');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/kunden');
    });
  });
  
  describe('GET /:id/edit', () => {
    it('should render customer edit form', async () => {
      const res = await request(app).get('/dashboard/kunden/1/edit');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toContain('Test Customer');
      expect(data.kunde.id).toBe(1);
    });
    
    it('should handle not found errors', async () => {
      const pool = global.pool;
      pool.query.mockImplementationOnce(() => Promise.resolve({ rows: [] }));
      
      const res = await request(app).get('/dashboard/kunden/999/edit');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/kunden');
    });
  });
  
  describe('POST /:id/edit', () => {
    it('should update customer and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/kunden/1/edit')
        .send({ name: 'Updated Customer' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/kunden/1');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/kunden/1/edit')
        .set('Accept', 'application/json')
        .send({ name: 'Updated Customer' });
      
      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(true);
    });
    
    it('should handle validation errors', async () => {
      const customerController = require('../../controllers/customer.controller');
      const error = new Error('Validation failed');
      error.statusCode = 400;
      customerController.updateCustomer.mockRejectedValueOnce(error);
      
      const res = await request(app)
        .post('/dashboard/kunden/1/edit')
        .send({ name: '' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/kunden/1/edit');
    });
  });
  
  describe('POST /:id/add-note', () => {
    it('should add a note to a customer and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/kunden/1/add-note')
        .send({ content: 'Test note' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/kunden/1');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/kunden/1/add-note')
        .set('Accept', 'application/json')
        .send({ content: 'Test note' });
      
      expect(res.status).toBe(200);
      expect(res.body.noteId).toBe(1);
    });
  });
});
