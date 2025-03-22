import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types/authenticated-request';
import { ResponseFactory } from '../utils/response.factory';
import { BadRequestError } from '../utils/errors';
import { ProjectService } from '../services/project.service';

/**
 * Project controller using the new service architecture
 */
export class ProjectController {
  private projectService: ProjectService;
  
  constructor() {
    this.projectService = new ProjectService();
  }
  
  /**
   * Get all projects with optional filtering
   */
  getAllProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = req.query;
    
    const result = await this.projectService.findAll(filters, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20
    });
    
    ResponseFactory.paginated(
      res, 
      result.projects, 
      result.pagination,
      'Projects retrieved successfully'
    );
  });
  
  /**
   * Get project by ID with related data
   */
  getProjectById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const projectId = Number(id);
    
    if (isNaN(projectId)) {
      throw new BadRequestError('Invalid project ID');
    }
    
    const result = await this.projectService.findById(projectId, {
      throwIfNotFound: true
    });
    
    ResponseFactory.success(res, result, 'Project retrieved successfully');
  });
  
  /**
   * Create a new project
   */
  createProject = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    
    const result = await this.projectService.create(req.body, {
      userId
    });
    
    ResponseFactory.created(res, result, 'Project created successfully');
  });
  
  /**
   * Update an existing project
   */
  updateProject = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const projectId = Number(id);
    const userId = req.user?.id;
    
    if (isNaN(projectId)) {
      throw new BadRequestError('Invalid project ID');
    }
    
    const result = await this.projectService.update(projectId, req.body, {
      userId,
      throwIfNotFound: true
    });
    
    ResponseFactory.success(res, result, 'Project updated successfully');
  });
  
  /**
   * Update project status
   */
  updateProjectStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, note } = req.body;
    const projectId = Number(id);
    const userId = req.user?.id;
    
    if (isNaN(projectId)) {
      throw new BadRequestError('Invalid project ID');
    }
    
    const result = await this.projectService.updateStatus(projectId, status, note, {
      userId,
      throwIfNotFound: true
    });
    
    ResponseFactory.success(res, result, 'Project status updated successfully');
  });
  
  /**
   * Add a note to project
   */
  addProjectNote = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { note } = req.body;
    const projectId = Number(id);
    const userId = req.user?.id;
    
    if (isNaN(projectId)) {
      throw new BadRequestError('Invalid project ID');
    }
    
    const result = await this.projectService.addNote(projectId, note, {
      userId
    });
    
    ResponseFactory.success(res, result, 'Note added successfully', 201);
  });
  
  /**
   * Export projects data
   */
  exportProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Since the export service requires updates for Prisma compatibility,
    // we'll return a not implemented response for now
    res.status(501).json({ 
      message: 'Export functionality is being migrated to TypeScript and Prisma' 
    });
  });
}

// Create controller instance for use in routes
const projectController = new ProjectController();

// Export controller methods for routes
export const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectStatus,
  addProjectNote,
  exportProjects
} = projectController;