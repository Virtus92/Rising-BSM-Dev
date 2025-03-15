const projectController = require('../../controllers/project.controller');
const pool = require('../../services/db.service');
const exportService = require('../../services/export.service');

// Mock dependencies
jest.mock('../../services/db.service');
jest.mock('../../services/export.service');
jest.mock('../../utils/helpers', () => ({
  getProjektStatusInfo: (status) => {
    const statusMap = {
      'neu': { label: 'Neu', className: 'warning' },
      'in_bearbeitung': { label: 'In Bearbeitung', className: 'info' },
      'abgeschlossen': { label: 'Abgeschlossen', className: 'success' },
      'storniert': { label: 'Storniert', className: 'secondary' }
    };
    return statusMap[status] || { label: status, className: 'default' };
  }
}));

describe('Project Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request, response, next
    mockReq = {
      session: {
        user: { id: 1, name: 'Test User' }
      },
      params: {},
      query: {},
      body: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockNext = jest.fn();

    // Default pool query mock implementation
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
  });

  describe('getAllProjects', () => {
    it('should return projects with pagination and apply filters', async () => {
      // Mock query parameters
      mockReq.query = {
        page: '1',
        limit: '10',
        status: 'in_bearbeitung',
        kunde_id: '42',
        search: 'office'
      };

      // Mock database responses
      pool.query.mockImplementation((query, params) => {
        if (query.includes('COUNT(*)')) {
          return Promise.resolve({ rows: [{ total: '12' }] });
        } else {
          return Promise.resolve({
            rows: [
              {
                id: 1,
                titel: 'Office Renovation',
                kunde_id: 42,
                kunde_name: 'ACME Inc.',
                dienstleistung_name: 'Renovation',
                start_datum: '2023-06-01T00:00:00Z',
                end_datum: '2023-07-15T00:00:00Z',
                status: 'in_bearbeitung',
                betrag: '5000.00'
              },
              {
                id: 2,
                titel: 'Office Cleaning Service',
                kunde_id: 42,
                kunde_name: 'ACME Inc.',
                dienstleistung_name: 'Cleaning',
                start_datum: '2023-06-15T00:00:00Z',
                end_datum: null,
                status: 'in_bearbeitung',
                betrag: '1200.00'
              }
            ]
          });
        }
      });

      // Execute the controller method
      const result = await projectController.getAllProjects(mockReq, mockRes, mockNext);

      // Assertions
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('filters');
      expect(result.projects).toHaveLength(2);
      expect(result.pagination.total).toBe(2); // Math.ceil(12/10)
      expect(result.pagination.current).toBe(1);
      expect(result.filters.status).toBe('in_bearbeitung');
      expect(result.filters.kunde_id).toBe('42');
      expect(result.filters.search).toBe('office');
    });

    it('should handle errors', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);

      // Execute the controller method
      await projectController.getAllProjects(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].success).toBe(false);
    });
  });

  describe('getProjectById', () => {
    it('should return project details with appointments and notes', async () => {
      // Mock request params
      mockReq.params = { id: '1' };

      // Mock database responses
      pool.query.mockImplementation((query) => {
        if (query.text && query.text.includes('SELECT p.*, k.name')) {
          return Promise.resolve({ 
            rows: [{ 
              id: 1, 
              titel: 'Office Renovation', 
              kunde_id: 42,
              kunde_name: 'ACME Inc.',
              start_datum: '2023-06-01T00:00:00Z',
              end_datum: '2023-07-15T00:00:00Z',
              betrag: '5000.00',
              beschreibung: 'Complete office renovation',
              status: 'in_bearbeitung'
            }] 
          });
        } else if (query.text && query.text.includes('SELECT id, titel, termin_datum, status FROM termine')) {
          return Promise.resolve({
            rows: [
              { 
                id: 101, 
                titel: 'Initial Consultation', 
                termin_datum: '2023-06-05T10:00:00Z',
                status: 'abgeschlossen'
              },
              {
                id: 102,
                titel: 'Mid-project Review',
                termin_datum: '2023-06-20T14:00:00Z',
                status: 'geplant'
              }
            ]
          });
        } else if (query.text && query.text.includes('SELECT * FROM projekt_notizen')) {
          return Promise.resolve({
            rows: [
              { 
                id: 201, 
                text: 'Project note', 
                erstellt_am: '2023-06-02T09:00:00Z',
                benutzer_name: 'Admin User'
              }
            ]
          });
        }
        return Promise.resolve({ rows: [] });
      });

      // Execute the controller method
      const result = await projectController.getProjectById(mockReq, mockRes, mockNext);

      // Assertions
      expect(result).toHaveProperty('project');
      expect(result).toHaveProperty('appointments');
      expect(result).toHaveProperty('notes');
      expect(result.project.id).toBe(1);
      expect(result.project.titel).toBe('Office Renovation');
      expect(result.project.kunde_name).toBe('ACME Inc.');
      expect(result.project.statusLabel).toBe('In Bearbeitung');
      expect(result.appointments).toHaveLength(2);
      expect(result.notes).toHaveLength(1);
    });

    it('should handle project not found', async () => {
      // Mock request params
      mockReq.params = { id: '999' };

      // Mock empty database response
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      await projectController.getProjectById(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      // Mock request body
      mockReq.body = {
        titel: 'New Office Project',
        kunde_id: '42',
        dienstleistung_id: '5',
        start_datum: '2023-07-01',
        end_datum: '2023-08-15',
        betrag: '3500',
        beschreibung: 'Project description',
        status: 'neu'
      };

      // Mock database responses
      pool.query.mockImplementation((query) => {
        if (query.text && query.text.includes('INSERT INTO projekte')) {
          return Promise.resolve({ rows: [{ id: 3 }] });
        }
        return Promise.resolve({ rows: [] });
      });

      // Execute the controller method
      const result = await projectController.createProject(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(3); // Insert project + log + notification
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('projectId', 3);
    });

    it('should validate required fields', async () => {
      // Mock request body with missing fields
      mockReq.body = {
        titel: '', // Missing title
        kunde_id: '42'
        // Missing start_datum
      };

      // Execute the controller method
      await projectController.createProject(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should validate betrag format', async () => {
      // Mock request body with invalid betrag
      mockReq.body = {
        titel: 'New Project',
        start_datum: '2023-07-01',
        betrag: 'not-a-number'
      };

      // Execute the controller method
      await projectController.createProject(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe('updateProject', () => {
    it('should update an existing project', async () => {
      // Mock request params and body
      mockReq.params = { id: '1' };
      mockReq.body = {
        titel: 'Updated Project Title',
        kunde_id: '42',
        dienstleistung_id: '5',
        start_datum: '2023-07-01',
        end_datum: '2023-08-15',
        betrag: '4000',
        beschreibung: 'Updated description',
        status: 'in_bearbeitung'
      };

      // Mock database responses
      pool.query.mockImplementation((query) => {
        if (query.text && query.text.includes('SELECT id FROM')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        return Promise.resolve({ rowCount: 1 });
      });

      // Execute the controller method
      const result = await projectController.updateProject(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(3); // Check + Update project + Log
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('projectId', '1');
    });

    it('should handle project not found', async () => {
      // Mock request params
      mockReq.params = { id: '999' };
      mockReq.body = {
        titel: 'Updated Project Title',
        start_datum: '2023-07-01'
      };

      // Mock empty database response
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      await projectController.updateProject(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('updateProjectStatus', () => {
    it('should update project status and add note if provided', async () => {
      // Mock request body
      mockReq.body = {
        id: '1',
        status: 'abgeschlossen',
        note: 'Project completed successfully'
      };

      // Mock database responses
      pool.query.mockResolvedValue({ rowCount: 1 });

      // Execute the controller method
      const result = await projectController.updateProjectStatus(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(3); // Update status + Add note + Log
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('projectId', '1');
    });

    it('should validate status value', async () => {
      // Mock request body with invalid status
      mockReq.body = {
        id: '1',
        status: 'invalid_status'
      };

      // Execute the controller method
      await projectController.updateProjectStatus(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe('addProjectNote', () => {
    it('should add a note to a project', async () => {
      // Mock request params and body
      mockReq.params = { id: '1' };
      mockReq.body = { note: 'New project note' };

      // Mock database responses
      pool.query.mockImplementation((query) => {
        if (query.text && query.text.includes('SELECT id FROM')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        return Promise.resolve({ rowCount: 1 });
      });

      // Execute the controller method
      const result = await projectController.addProjectNote(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(3); // Check + Insert note + Log
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('projectId', '1');
    });

    it('should validate note content', async () => {
      // Mock request params and body with empty note
      mockReq.params = { id: '1' };
      mockReq.body = { note: '' };

      // Execute the controller method
      await projectController.addProjectNote(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe('exportProjects', () => {
    it('should export projects data', async () => {
      // Mock request query
      mockReq.query = { 
        format: 'xlsx', 
        status: 'in_bearbeitung',
        kunde_id: '42'
      };

      // Mock database response
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            titel: 'Office Renovation',
            start_datum: '2023-06-01T00:00:00Z',
            end_datum: '2023-07-15T00:00:00Z',
            betrag: '5000.00',
            status: 'in_bearbeitung',
            beschreibung: 'Complete office renovation',
            kunde_name: 'ACME Inc.',
            dienstleistung_name: 'Renovation'
          }
        ]
      });

      // Mock export service
      exportService.generateExport.mockResolvedValueOnce({
        filename: 'projekte-export.xlsx',
        content: Buffer.from('mock-excel-content')
      });

      // Execute the controller method
      const result = await projectController.exportProjects(mockReq, mockRes, mockNext);

      // Assertions
      expect(exportService.generateExport).toHaveBeenCalled();
      expect(result).toHaveProperty('filename', 'projekte-export.xlsx');
    });
  });
});
