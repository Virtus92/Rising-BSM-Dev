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
      if (query.text && query.text.includes('SELECT id, name FROM dienstleistungen')) {
        return Promise.resolve({ rows: [{ id: 1, name: 'Test Service' }] });
      }
      return Promise.resolve({ rows: [] });
    })
  };
  return { Pool: jest.fn(() => mockPool) };
});

// Mock controllers and middleware
jest.mock('../../controllers/project.controller', () => ({
  getAllProjects: jest.fn().mockResolvedValue({ 
    projects: [{ id: 1, titel: 'Test Project', kunde_name: 'Test Customer' }],
    pagination: { page: 1, pageCount: 1 },
    filters: { statuses: ['neu', 'in_bearbeitung'] },
    growthData: []
  }),
  createProject: jest.fn().mockResolvedValue({ projectId: 1 }),
  getProjectById: jest.fn().mockResolvedValue({ 
    project: { id: 1, titel: 'Test Project', kunde_name: 'Test Customer' },
    appointments: [],
    notes: []
  }),
  updateProjectStatus: jest.fn().mockResolvedValue({ updated: true }),
  addProjectNote: jest.fn().mockResolvedValue({ noteId: 1 }),
  updateProject: jest.fn().mockResolvedValue({ updated: true }),
  exportProjects: jest.fn().mockResolvedValue({
    format: 'json',
    data: [{ id: 1, titel: 'Test Project' }],
    contentType: 'application/json',
    filename: 'projects-export.json'
  })
}));

jest.mock('../../middleware/auth.middleware', () => ({
  isAuthenticated: (req, res, next) => next()
}));

jest.mock('../../middleware/validation.middleware', () => ({
  validateProject: (req, res, next) => next()
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
  
  // Mock database connection
  app.use((req, res, next) => {
    req.db = require('pg').Pool();
    next();
  });
  
  // Setup view engine (mock)
  app.set('view engine', 'ejs');
  app.set('views', 'views');
  app.engine('ejs', (path, data, cb) => cb(null, JSON.stringify(data)));
  
  // Load routes
  const projectRoutes = require('../../routes/project.routes');
  app.use('/dashboard/projekte', projectRoutes);
  
  return app;
};

describe('Project Routes', () => {
  let app;
  
  beforeEach(() => {
    app = setupApp();
    jest.clearAllMocks();
  });
  
  describe('GET /', () => {
    it('should render projects list page', async () => {
      const res = await request(app).get('/dashboard/projekte');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Projekte - Rising BSM');
      expect(data.projects).toHaveLength(1);
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .get('/dashboard/projekte')
        .set('Accept', 'application/json');
      
      expect(res.status).toBe(200);
      expect(res.body.projects).toHaveLength(1);
    });
  });
  
  describe('GET /neu', () => {
    it('should render new project form', async () => {
      const res = await request(app).get('/dashboard/projekte/neu');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toBe('Neues Projekt - Rising BSM');
      expect(data.kunden).toHaveLength(1);
      expect(data.dienstleistungen).toHaveLength(1);
    });
  });
  
  describe('POST /neu', () => {
    it('should create a new project and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/projekte/neu')
        .send({ 
          titel: 'New Project', 
          kunde_id: 1, 
          dienstleistung_id: 1,
          start_datum: '2023-06-01',
          status: 'neu'
        });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/projekte/1');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/projekte/neu')
        .set('Accept', 'application/json')
        .send({ 
          titel: 'New Project', 
          kunde_id: 1, 
          dienstleistung_id: 1,
          start_datum: '2023-06-01',
          status: 'neu'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.projectId).toBe(1);
    });
    
    it('should handle validation errors', async () => {
      const projectController = require('../../controllers/project.controller');
      const error = new Error('Validation failed');
      error.statusCode = 400;
      projectController.createProject.mockRejectedValueOnce(error);
      
      const res = await request(app)
        .post('/dashboard/projekte/neu')
        .send({ titel: '' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/projekte/neu');
    });
  });
  
  describe('GET /export', () => {
    it('should export projects as JSON', async () => {
      const res = await request(app).get('/dashboard/projekte/export');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 1, titel: 'Test Project' }]);
      expect(res.header['content-type']).toContain('application/json');
      expect(res.header['content-disposition']).toContain('projects-export.json');
    });
    
    it('should handle export errors', async () => {
      const projectController = require('../../controllers/project.controller');
      const error = new Error('Export failed');
      error.statusCode = 500;
      projectController.exportProjects.mockRejectedValueOnce(error);
      
      const res = await request(app).get('/dashboard/projekte/export');
      
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('POST /update-status', () => {
    it('should update project status and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/projekte/update-status')
        .send({ id: 1, status: 'in_bearbeitung' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/projekte/1');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/projekte/update-status')
        .set('Accept', 'application/json')
        .send({ id: 1, status: 'in_bearbeitung' });
      
      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(true);
    });
  });
  
  describe('GET /:id', () => {
    it('should render project detail page', async () => {
      const res = await request(app).get('/dashboard/projekte/1');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toContain('Projekt:');
      expect(data.projekt.id).toBe(1);
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .get('/dashboard/projekte/1')
        .set('Accept', 'application/json');
      
      expect(res.status).toBe(200);
      expect(res.body.project.id).toBe(1);
    });
    
    it('should handle not found errors', async () => {
      const projectController = require('../../controllers/project.controller');
      const error = new Error('Project not found');
      error.statusCode = 404;
      projectController.getProjectById.mockRejectedValueOnce(error);
      
      const res = await request(app).get('/dashboard/projekte/999');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/projekte');
    });
  });
  
  describe('POST /:id/add-note', () => {
    it('should add a note to a project and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/projekte/1/add-note')
        .send({ content: 'Test note' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/projekte/1');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/projekte/1/add-note')
        .set('Accept', 'application/json')
        .send({ content: 'Test note' });
      
      expect(res.status).toBe(200);
      expect(res.body.noteId).toBe(1);
    });
  });
  
  describe('GET /:id/edit', () => {
    it('should render project edit form', async () => {
      // Need to mock the DB query response for this specific route
      const pool = require('pg').Pool();
      pool.query.mockImplementationOnce(() => 
        Promise.resolve({
          rows: [{
            id: 1,
            titel: 'Test Project',
            kunde_id: 1,
            kunde_name: 'Test Customer',
            dienstleistung_id: 1,
            start_datum: new Date('2023-06-01'),
            end_datum: null,
            betrag: '1000.00',
            beschreibung: 'Test description',
            status: 'neu'
          }]
        })
      );
      
      const res = await request(app).get('/dashboard/projekte/1/edit');
      
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.title).toContain('Projekt bearbeiten:');
      expect(data.projekt.id).toBe(1);
    });
    
    it('should redirect if project not found', async () => {
      // Mock empty result for not found
      const pool = require('pg').Pool();
      pool.query.mockImplementationOnce(() => Promise.resolve({ rows: [] }));
      
      const res = await request(app).get('/dashboard/projekte/999/edit');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/projekte');
    });
  });
  
  describe('POST /:id/edit', () => {
    it('should update a project and redirect', async () => {
      const res = await request(app)
        .post('/dashboard/projekte/1/edit')
        .send({ 
          titel: 'Updated Project', 
          kunde_id: 1,
          start_datum: '2023-06-01',
          status: 'in_bearbeitung' 
        });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/projekte/1');
    });
    
    it('should return JSON when accept header is application/json', async () => {
      const res = await request(app)
        .post('/dashboard/projekte/1/edit')
        .set('Accept', 'application/json')
        .send({ 
          titel: 'Updated Project', 
          kunde_id: 1,
          start_datum: '2023-06-01',
          status: 'in_bearbeitung' 
        });
      
      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(true);
    });
    
    it('should handle validation errors', async () => {
      const projectController = require('../../controllers/project.controller');
      const error = new Error('Validation failed');
      error.statusCode = 400;
      projectController.updateProject.mockRejectedValueOnce(error);
      
      const res = await request(app)
        .post('/dashboard/projekte/1/edit')
        .send({ titel: '' });
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard/projekte/1/edit');
    });
  });
});
