import { Request, Response } from 'express';
import { 
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectStatus,
  addProjectNote,
  getProjectStatistics,
  exportProjects
} from '../../controllers/project.controller';
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

// Mock Response object
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('Project Controller', () => {
  let req: Partial<Request>;
  let res: Response;

  beforeEach(() => {
    req = {};
    res = mockResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllProjects', () => {
    it('should get all projects with filters', async () => {
      // Arrange
      req.query = { 
        status: 'neu', 
        kunde_id: '1', 
        dienstleistung_id: '2',
        start_datum_von: '2025-01-01',
        start_datum_bis: '2025-12-31',
        search: 'test', 
        page: '1', 
        limit: '10',
        sortBy: 'titel',
        sortDirection: 'asc'
      };
      
      const mockProjects = [
        { id: 1, titel: 'Project 1', start_datum: '2025-01-15' },
        { id: 2, titel: 'Project 2', start_datum: '2025-02-15' }
      ];
      
      const mockPagination = {
        total: 2,
        page: 1,
        limit: 10,
        pages: 1
      };
      
      (projectService.findAll as jest.Mock).mockResolvedValue({
        data: mockProjects,
        pagination: mockPagination
      });

      // Act
      await getAllProjects(req as Request, res);

      // Assert
      expect(projectService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'neu',
          kunde_id: 1,
          dienstleistung_id: 2,
          start_datum_von: '2025-01-01',
          start_datum_bis: '2025-12-31',
          search: 'test',
          page: 1,
          limit: 10,
          sortBy: 'titel',
          sortDirection: 'asc'
        }),
        expect.objectContaining({
          page: 1,
          limit: 10,
          orderBy: 'titel',
          orderDirection: 'asc'
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockProjects,
        pagination: mockPagination
      }));
    });
  });

  describe('getProjectById', () => {
    it('should get project by id with details', async () => {
      // Arrange
      req.params = { id: '1' };
      
      const mockProject = { 
        id: 1, 
        titel: 'Test Project',
        kunde_id: 1,
        customer: {
          id: 1,
          name: 'Test Customer'
        },
        appointments: [
          { id: 1, title: 'Appointment 1' }
        ],
        notes: [
          { id: 1, text: 'Project note 1' }
        ]
      };
      
      (projectService.findByIdWithDetails as jest.Mock).mockResolvedValue(mockProject);

      // Act
      await getProjectById(req as Request, res);

      // Assert
      expect(projectService.findByIdWithDetails).toHaveBeenCalledWith(1, { throwIfNotFound: true });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockProject
      }));
    });

    it('should return 400 if id is invalid', async () => {
      // Arrange
      req.params = { id: 'invalid' };

      // Act & Assert
      await expect(getProjectById(req as Request, res)).rejects.toThrow();
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      // Arrange
      const projectData = {
        titel: 'New Project',
        kunde_id: 1,
        dienstleistung_id: 2,
        start_datum: '2025-03-01',
        end_datum: '2025-06-30',
        betrag: 5000,
        beschreibung: 'Project description',
        status: 'neu'
      };
      
      req.body = projectData;
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockCreatedProject = { 
        id: 1, 
        ...projectData 
      };
      
      (projectService.create as jest.Mock).mockResolvedValue(mockCreatedProject);

      // Act
      await createProject(req as any, res);

      // Assert
      expect(projectService.create).toHaveBeenCalledWith(
        projectData,
        expect.objectContaining({
          userContext: expect.objectContaining({
            userId: 1,
            userName: 'Test User',
            userRole: 'admin'
          })
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockCreatedProject
      }));
    });
  });

  describe('updateProject', () => {
    it('should update an existing project', async () => {
      // Arrange
      req.params = { id: '1' };
      const projectData = {
        titel: 'Updated Project',
        betrag: 8000,
        beschreibung: 'Updated description'
      };
      
      req.body = projectData;
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockUpdatedProject = { 
        id: 1, 
        ...projectData 
      };
      
      (projectService.update as jest.Mock).mockResolvedValue(mockUpdatedProject);

      // Act
      await updateProject(req as any, res);

      // Assert
      expect(projectService.update).toHaveBeenCalledWith(
        1,
        projectData,
        expect.objectContaining({
          userContext: expect.any(Object),
          throwIfNotFound: true
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockUpdatedProject
      }));
    });
  });

  describe('updateProjectStatus', () => {
    it('should update project status', async () => {
      // Arrange
      req.params = { id: '1' };
      const statusData = {
        status: 'in_bearbeitung',
        note: 'Status update note'
      };
      
      req.body = statusData;
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockUpdatedProject = { 
        id: 1, 
        status: 'in_bearbeitung'
      };
      
      (projectService.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedProject);

      // Act
      await updateProjectStatus(req as any, res);

      // Assert
      expect(projectService.updateStatus).toHaveBeenCalledWith(
        1,
        'in_bearbeitung',
        'Status update note',
        expect.objectContaining({
          userContext: expect.any(Object)
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockUpdatedProject
      }));
    });
    
    it('should throw error if status is missing', async () => {
      // Arrange
      req.params = { id: '1' };
      req.body = { note: 'Status update note' }; // Status missing
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };

      // Act & Assert
      await expect(updateProjectStatus(req as any, res)).rejects.toThrow();
    });
  });

  describe('addProjectNote', () => {
    it('should add a note to a project', async () => {
      // Arrange
      req.params = { id: '1' };
      req.body = { note: 'New note for project' };
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };
      
      const mockAddedNote = { 
        id: 1, 
        projectId: 1,
        text: 'New note for project',
        userId: 1,
        userName: 'Test User'
      };
      
      (projectService.addNote as jest.Mock).mockResolvedValue(mockAddedNote);

      // Act
      await addProjectNote(req as any, res);

      // Assert
      expect(projectService.addNote).toHaveBeenCalledWith(
        1,
        'New note for project',
        expect.objectContaining({
          userContext: expect.any(Object)
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockAddedNote,
        message: 'Note added successfully',
        statusCode: 201
      }));
    });
    
    it('should throw error if note text is missing', async () => {
      // Arrange
      req.params = { id: '1' };
      req.body = {}; // Note missing
      req.user = { id: 1, name: 'Test User', role: 'admin', ip: '127.0.0.1' };

      // Act & Assert
      await expect(addProjectNote(req as any, res)).rejects.toThrow();
    });
  });

  describe('getProjectStatistics', () => {
    it('should get project statistics', async () => {
      // Arrange
      req.query = {
        status: 'in_bearbeitung',
        kunde_id: '1'
      };
      
      const mockStatistics = {
        total: 50,
        byStatus: {
          neu: 15,
          in_bearbeitung: 20,
          abgeschlossen: 10,
          storniert: 5
        },
        totalValue: 250000,
        avgValue: 5000
      };
      
      (projectService.getStatistics as jest.Mock).mockResolvedValue(mockStatistics);

      // Act
      await getProjectStatistics(req as Request, res);

      // Assert
      expect(projectService.getStatistics).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_bearbeitung',
          kunde_id: 1
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockStatistics
      }));
    });
  });

  describe('exportProjects', () => {
    it('should return 501 Not Implemented for export endpoint', async () => {
      // Act
      await exportProjects(req as Request, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.stringContaining('Export functionality is not implemented yet')
      }));
    });
  });
});