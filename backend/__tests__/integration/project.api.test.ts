import express from 'express';
import request from 'supertest';
import { createTestApp, authRequest } from './setup';
import projectRoutes from '../../routes/project.routes';
import { projectService } from '../../services/project.service';

// Mock the projectService
jest.mock('../../services/project.service', () => ({
  projectService: {
    findAll: jest.fn(),
    findByIdWithDetails: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    addNote: jest.fn(),
    getStatistics: jest.fn()
  }
}));

describe('Project API', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
    app.use('/api/projects', projectRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects', () => {
    it('should return a list of projects', async () => {
      // Arrange
      const mockProjects = [
        { id: 1, titel: 'Project 1', status: 'neu', start_datum: '2025-03-01' },
        { id: 2, titel: 'Project 2', status: 'in_bearbeitung', start_datum: '2025-04-01' }
      ];
      
      (projectService.findAll as jest.Mock).mockResolvedValue({
        data: mockProjects,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1
        }
      });

      // Act
      const response = await authRequest.get(app, '/api/projects');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockProjects
      }));
    });

    it('should apply filters from query parameters', async () => {
      // Arrange
      (projectService.findAll as jest.Mock).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      });

      // Act
      await authRequest.get(app, '/api/projects?status=neu&kunde_id=1&start_datum_von=2025-01-01');

      // Assert
      expect(projectService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ 
          status: 'neu', 
          kunde_id: 1, 
          start_datum_von: '2025-01-01' 
        }),
        expect.any(Object)
      );
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return a single project with details', async () => {
      // Arrange
      const mockProject = { 
        id: 1, 
        titel: 'Test Project',
        kunde_id: 1,
        customer: {
          id: 1,
          name: 'Test Customer'
        },
        notes: []
      };
      
      (projectService.findByIdWithDetails as jest.Mock).mockResolvedValue(mockProject);

      // Act
      const response = await authRequest.get(app, '/api/projects/1');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockProject
      }));
      expect(projectService.findByIdWithDetails).toHaveBeenCalledWith(1, { throwIfNotFound: true });
    });

    it('should return 400 for invalid ID', async () => {
      // Act
      const response = await authRequest.get(app, '/api/projects/invalid');

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      // Arrange
      const projectData = {
        titel: 'New Project',
        kunde_id: 1,
        dienstleistung_id: 2,
        start_datum: '2025-06-01',
        end_datum: '2025-09-30',
        betrag: 5000,
        beschreibung: 'Test project description'
      };
      
      const mockCreatedProject = {
        id: 1,
        ...projectData,
        status: 'neu'
      };
      
      (projectService.create as jest.Mock).mockResolvedValue(mockCreatedProject);

      // Act
      const response = await authRequest.post(app, '/api/projects', projectData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockCreatedProject
      }));
      expect(projectService.create).toHaveBeenCalledWith(
        projectData,
        expect.objectContaining({
          userContext: expect.any(Object)
        })
      );
    });

    it('should return 400 for invalid project data', async () => {
      // Arrange
      const invalidData = {
        // Missing required fields
      };

      // Act
      const response = await authRequest.post(app, '/api/projects', invalidData);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update an existing project', async () => {
      // Arrange
      const projectData = {
        titel: 'Updated Project',
        betrag: 7500,
        beschreibung: 'Updated description'
      };
      
      const mockUpdatedProject = {
        id: 1,
        ...projectData
      };
      
      (projectService.update as jest.Mock).mockResolvedValue(mockUpdatedProject);

      // Act
      const response = await authRequest.put(app, '/api/projects/1', projectData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockUpdatedProject
      }));
      expect(projectService.update).toHaveBeenCalledWith(
        1,
        projectData,
        expect.objectContaining({
          userContext: expect.any(Object),
          throwIfNotFound: true
        })
      );
    });
  });

  describe('PATCH /api/projects/:id/status', () => {
    it('should update project status', async () => {
      // Arrange
      const statusData = {
        status: 'in_bearbeitung',
        note: 'Status update note'
      };
      
      const mockUpdatedProject = {
        id: 1,
        status: 'in_bearbeitung'
      };
      
      (projectService.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedProject);

      // Act
      const response = await authRequest.patch(app, '/api/projects/1/status', statusData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockUpdatedProject
      }));
      expect(projectService.updateStatus).toHaveBeenCalledWith(
        1,
        'in_bearbeitung',
        'Status update note',
        expect.objectContaining({
          userContext: expect.any(Object)
        })
      );
    });
  });

  describe('POST /api/projects/:id/notes', () => {
    it('should add a note to a project', async () => {
      // Arrange
      const noteData = {
        note: 'Test note for project'
      };
      
      const mockNote = {
        id: 1,
        projectId: 1,
        text: 'Test note for project',
        userName: 'Test User',
        createdAt: new Date().toISOString()
      };
      
      (projectService.addNote as jest.Mock).mockResolvedValue(mockNote);

      // Act
      const response = await authRequest.post(app, '/api/projects/1/notes', noteData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockNote
      }));
      expect(projectService.addNote).toHaveBeenCalledWith(
        1,
        'Test note for project',
        expect.objectContaining({
          userContext: expect.any(Object)
        })
      );
    });

    it('should return 400 for empty note', async () => {
      // Arrange
      const invalidNote = {
        note: ''
      };

      // Act
      const response = await authRequest.post(app, '/api/projects/1/notes', invalidNote);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/projects/statistics', () => {
    it('should get project statistics', async () => {
      // Arrange
      const mockStatistics = {
        statusCounts: {
          neu: 10,
          in_bearbeitung: 5,
          abgeschlossen: 20,
          storniert: 2
        },
        totalValue: 150000,
        byMonth: [
          { month: '2025-01', count: 5, value: 25000 },
          { month: '2025-02', count: 8, value: 40000 }
        ]
      };
      
      (projectService.getStatistics as jest.Mock).mockResolvedValue(mockStatistics);

      // Act
      const response = await authRequest.get(app, '/api/projects/statistics');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockStatistics
      }));
      expect(projectService.getStatistics).toHaveBeenCalled();
    });
  });
});