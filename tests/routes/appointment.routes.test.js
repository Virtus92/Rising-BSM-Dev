const request = require('supertest');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');

// Mock database
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn().mockImplementation((query) => {
      if (query.text && query.text.includes('SELECT id, name FROM kunden')) {
        return Promise.resolve({ rows: [{ id: 1, name: 'Test Customer' }] });
      }
      if (query.text && query.text.includes('SELECT id, titel FROM projekte')) {
        return Promise.resolve({ rows: [{ id: 1, titel: 'Test Project' }] });
      }
      if (query.text && query.text.includes('SELECT t.*, k.name AS kunde_name')) {
        return Promise.resolve({ 
          rows: [{
            id: 1,
            titel: 'Test Appointment',
            kunde_id: 1,
            kunde_name: 'Test Customer',
            projekt_id: 1,
            termin_datum: new Date('2023-07-15T14:00:00'),
            dauer: 60,
            ort: 'Test Location',
            beschreibung: 'Test Description',
            status: 'geplant'
          }]
        });
      }
      if (query.text && query.text.includes('termin_datum >= $1 AND termin_datum <= $2')) {
        return Promise.resolve({
          rows: [{
            id: 1,
            titel: 'Test Appointment',
            termin_datum: new Date('2023-07-15T14:00:00'),
            dauer: 60,
            status: 'geplant',
            ort: 'Test Location',
            beschreibung: 'Test Description',
            kunde_name: 'Test Customer',
            kunde_id: 1,
            projekt_titel: 'Test Project',
            projekt_id: 1
          }]
        });
      }
      return Promise.resolve({ rows: [] });
    })
  };
  return { Pool: jest.fn(() => mockPool) };
});

// Mock controllers and middleware
jest.mock('../../controllers/appointment.controller', () => ({
  getAllAppointments: jest.fn().mockResolvedValue({ 
    appointments: [{ id: 1, titel: 'Test Appointment', kunde_name: 'Test Customer' }],
    pagination: { page: 1, pageCount: 1 },
    filters: { statuses: ['geplant', 'bestaetigt', 'abgeschlossen'] }
  }),
  createAppointment: jest.fn().mockResolvedValue({ appointmentId: 1 }),
  getAppointmentById: jest.fn().mockResolvedValue({ 
    appointment: { 
      id: 1, 
      titel: 'Test Appointment',
      kunde_name: 'Test Customer',
      termin_datum: new Date('2023-07-15T14:00:00')
    },
    notes: []
  }),
  updateAppointmentStatus: jest.fn().mockResolvedValue({ updated: true }),
  addAppointmentNote: jest.fn().mockResolvedValue({ noteId: 1 }),
  updateAppointment: jest.fn().mockResolvedValue({ updated: true }),
  exportAppointments: jest.fn().mockResolvedValue({
    format: 'json',
    data: [{ id: 1, titel: 'Test Appointment' }],
    contentType: 'application/json',
    filename: 'appointments-export.json'
  })
}));

jest.mock('../../middleware/auth.middleware', () => ({
  isAuthenticated: (req, res, next) => next()
}));

jest.mock('../../middleware/validation.middleware', () => ({
  validateAppointment: (req, res, next) => next()
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
  app.use((req, res, next) => {
    req.db = require('pg').Pool();
    next();
  });
  
  // Setup view engine (mock)
  app.set('view engine', 'ejs');
  app.set('views', 'views');
  app.engine('ejs', (path, data, cb) => cb(null, JSON.stringify(data)));
  
  // Load routes
  const appointmentRoutes = require('../../routes/appointment.routes');
  app.use('/dashboard/termine', appointmentRoutes);
  
  return app;
};

describe('Appointment Routes', () => {
  let app;
  
  beforeEach(() => {
    app = setupApp();
    jest.clearAllMocks();
  });
  
  describe('GET /', () => {
    it('should render appointments list page', async () => {
      const res = await request(app).get('/dashboard/termine');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Termine - Rising BSM');
      expect(data.appointments).toHaveLength(1);
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .get('/dashboard/termine')
        .set('Accept', 'application/json');
      
      expect(res.status).toBe(200);
      expect(res.body.appointments).toHaveLength(1);
    });
  });
  
  describe('GET /neu', () => {
    it('should render new appointment form', async () => {
      const res = await request(app).get('/dashboard/termine/neu');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Neuer Termin - Rising BSM');
      expect(data.kunden).toHaveLength(1);
      expect(data.projekte).toHaveLength(1);
    });
    
    it('should pre-fill form from query parameters', async () => {
      const res = await request(app)
        .get('/dashboard/termine/neu?kunde_id=1&kunde_name=Test&projekt_id=1');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.formData.kunde_id).toBe('1');
      expect(data.formData.kunde_name).toBe('Test');
      expect(data.formData.projekt_id).toBe('1');
    });
  });
  
  describe('POST /neu', () => {
    it('should create a new appointment and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/termine/neu')
        .send({
          titel: 'New Appointment',
          kunde_id: 1,
          termin_datum: '2023-07-15',
          termin_zeit: '14:00',
          dauer: 60,
          status: 'geplant'
        });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/termine/1');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/termine/neu')
        .set('Accept', 'application/json')
        .send({
          titel: 'New Appointment',
          kunde_id: 1,
          termin_datum: '2023-07-15',
          termin_zeit: '14:00',
          dauer: 60,
          status: 'geplant'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.appointmentId).toBe(1);
    });
    
    it('should handle validation errors', async () => {
      const appointmentController = require('../../controllers/appointment.controller');
      const error = new Error('Validation failed');
      error.statusCode = 400;
      appointmentController.createAppointment.mockRejectedValueOnce(error);
      
      const res = await request(app)
        .post('/dashboard/termine/neu')
        .send({ titel: '' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/termine/neu');
    });
  });
  
  describe('GET /export', () => {
    it('should export appointments as JSON', async () => {
      const res = await request(app).get('/dashboard/termine/export');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 1, titel: 'Test Appointment' }]);
      expect(res.header['content-type']).toContain('application/json');
      expect(res.header['content-disposition']).toContain('appointments-export.json');
    });
    
    it('should handle export errors', async () => {
      const appointmentController = require('../../controllers/appointment.controller');
      const error = new Error('Export failed');
      error.statusCode = 500;
      appointmentController.exportAppointments.mockRejectedValueOnce(error);
      
      const res = await request(app).get('/dashboard/termine/export');
      
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('GET /calendar-events', () => {
    it('should return calendar events as JSON', async () => {
      const res = await request(app)
        .get('/dashboard/termine/calendar-events?start=2023-07-01&end=2023-07-31');
      
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body[0].title).toBe('Test Appointment');
      expect(res.body[0].extendedProps.kunde).toBe('Test Customer');
    });
    
    it('should handle database errors', async () => {
      const pool = require('pg').Pool();
      pool.query.mockImplementationOnce(() => Promise.reject(new Error('Database error')));
      
      const res = await request(app)
        .get('/dashboard/termine/calendar-events?start=2023-07-01&end=2023-07-31');
      
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('POST /update-status', () => {
    it('should update appointment status and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/termine/update-status')
        .send({ id: 1, status: 'bestaetigt' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/termine/1');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/termine/update-status')
        .set('Accept', 'application/json')
        .send({ id: 1, status: 'bestaetigt' });
      
      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(true);
    });
    
    it('should handle validation errors', async () => {
      const appointmentController = require('../../controllers/appointment.controller');
      const error = new Error('Invalid status');
      error.statusCode = 400;
      appointmentController.updateAppointmentStatus.mockRejectedValueOnce(error);
      
      const res = await request(app)
        .post('/dashboard/termine/update-status')
        .send({ id: 1, status: 'invalid' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/termine/1');
    });
  });
  
  describe('GET /:id', () => {
    it('should render appointment detail page', async () => {
      const res = await request(app).get('/dashboard/termine/1');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toContain('Test Appointment');
      expect(data.termin.id).toBe(1);
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .get('/dashboard/termine/1')
        .set('Accept', 'application/json');
      
      expect(res.status).toBe(200);
      expect(res.body.appointment.id).toBe(1);
    });
    
    it('should handle not found errors', async () => {
      const appointmentController = require('../../controllers/appointment.controller');
      const error = new Error('Appointment not found');
      error.statusCode = 404;
      appointmentController.getAppointmentById.mockRejectedValueOnce(error);
      
      const res = await request(app).get('/dashboard/termine/999');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/termine');
    });
  });
  
  describe('POST /:id/add-note', () => {
    it('should add a note to an appointment and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/termine/1/add-note')
        .send({ content: 'Test note' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/termine/1');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/termine/1/add-note')
        .set('Accept', 'application/json')
        .send({ content: 'Test note' });
      
      expect(res.status).toBe(200);
      expect(res.body.noteId).toBe(1);
    });
  });
  
  describe('GET /:id/edit', () => {
    it('should render appointment edit form', async () => {
      const res = await request(app).get('/dashboard/termine/1/edit');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toContain('Test Appointment');
      expect(data.appointment.id).toBe(1);
    });
    
    it('should redirect if appointment not found', async () => {
      // Mock empty result for not found
      const pool = require('pg').Pool();
      pool.query.mockImplementationOnce(() => Promise.resolve({ rows: [] }));
      
      const res = await request(app).get('/dashboard/termine/999/edit');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/termine');
    });
  });
  
  describe('POST /:id/edit', () => {
    it('should update an appointment and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/termine/1/edit')
        .send({
          titel: 'Updated Appointment',
          kunde_id: 1,
          termin_datum: '2023-07-15',
          termin_zeit: '15:00',
          dauer: 90,
          status: 'bestaetigt'
        });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/termine/1');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/termine/1/edit')
        .set('Accept', 'application/json')
        .send({
          titel: 'Updated Appointment',
          kunde_id: 1,
          termin_datum: '2023-07-15',
          termin_zeit: '15:00',
          dauer: 90,
          status: 'bestaetigt'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(true);
    });
    
    it('should handle validation errors', async () => {
      const appointmentController = require('../../controllers/appointment.controller');
      const error = new Error('Validation failed');
      error.statusCode = 400;
      appointmentController.updateAppointment.mockRejectedValueOnce(error);
      
      const res = await request(app)
        .post('/dashboard/termine/1/edit')
        .send({ titel: '' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/termine/1/edit');
    });
  });
});
