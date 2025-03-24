/**
 * Project Controller
 * 
 * Controller for Project entity operations handling HTTP requests and responses.
 */
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/controller.types.js';
import { asyncHandler } from '../utils/errors.js';
import { ResponseFactory } from '../utils/response.factory.js';
import { ProjectService, projectService } from '../services/project.service.js';
import { 
  ProjectCreateDTO, 
  ProjectUpdateDTO, 
  ProjectFilterParams,
  ProjectStatusUpdateDTO
} from '../types/dtos/project.dto.js';
import { BadRequestError } from '../utils/errors.js';

/**
 * Controller for Project entity operations
 */
export class ProjectController {
  /**
   * Creates a new ProjectController instance
   * @param service - ProjectService instance
   */
  constructor(private readonly service: ProjectService = projectService) {}

  /**
   * Get all projects with optional filtering
   * @route GET /api/v1/projects
   */
  getAllProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Extract query parameters as filter options
    const filters: ProjectFilterParams = {
      status: req.query.status as string,
      customerId: req.query.kunde_id ? Number(req.query.kunde_id) : undefined,
      serviceId: req.query.dienstleistung_id ? Number(req.query.dienstleistung_id) : undefined,
      startDateFrom: req.query.start_datum_von as string,
      startDateTo: req.query.start_datum_bis as string,
      search: req.query.search as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      sortBy: req.query.sortBy as string,
      sortDirection: req.query.sortDirection as 'asc' | 'desc'
    };
    
    // Get projects from service
    const result = await this.service.findAll(filters, {
      page: filters.page,
      limit: filters.limit,
      orderBy: filters.sortBy,
      orderDirection: filters.sortDirection
    });
    
    // Send paginated response
    ResponseFactory.paginated(
      res,
      result.data,
      result.pagination,
      'Projects retrieved successfully'
    );
  });

  /**
   * Get project by ID with related data
   * @route GET /api/v1/projects/:id
   */
  getProjectById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const projectId = Number(id);
    
    if (isNaN(projectId)) {
      throw new BadRequestError('Invalid project ID');
    }
    
    // Get project with details from service
    const result = await this.service.findByIdWithDetails(projectId, {
      throwIfNotFound: true
    });
    
    // Send success response
    ResponseFactory.success(res, result, 'Project retrieved successfully');
  });

  /**
   * Create a new project
   * @route POST /api/v1/projects
   */
  createProject = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Extract create DTO from request body
    const projectData: ProjectCreateDTO = req.body;
    
    // Create project with user context
    const result = await this.service.create(projectData, {
      userContext: req.user ? {
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        ipAddress: req.ip
      } : undefined
    });
    
    // Send created response
    ResponseFactory.created(res, result, 'Project created successfully');
  });

  /**
   * Update an existing project
   * @route PUT /api/v1/projects/:id
   */
  updateProject = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const projectId = Number(id);
    
    if (isNaN(projectId)) {
      throw new BadRequestError('Invalid project ID');
    }
    
    // Extract update DTO from request body
    const projectData: ProjectUpdateDTO = req.body;
    
    // Update project with user context
    const result = await this.service.update(projectId, projectData, {
      userContext: req.user ? {
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        ipAddress: req.ip
      } : undefined,
      throwIfNotFound: true
    });
    
    // Send success response
    ResponseFactory.success(res, result, 'Project updated successfully');
  });

  /**
   * Update project status
   * @route PATCH /api/v1/projects/:id/status
   */
  updateProjectStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const projectId = Number(id);
    
    if (isNaN(projectId)) {
      throw new BadRequestError('Invalid project ID');
    }
    
    // Extract status update data
    const { status, note }: ProjectStatusUpdateDTO = req.body;
    
    if (!status) {
      throw new BadRequestError('Status is required');
    }
    
    // Update status with user context
    const result = await this.service.updateStatus(projectId, status, note || null, {
      userContext: req.user ? {
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        ipAddress: req.ip
      } : undefined
    });
    
    // Send success response
    ResponseFactory.success(res, result, 'Project status updated successfully');
  });

  /**
   * Add a note to project
   * @route POST /api/v1/projects/:id/notes
   */
  addProjectNote = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const projectId = Number(id);
    
    if (isNaN(projectId)) {
      throw new BadRequestError('Invalid project ID');
    }
    
    // Extract note text
    const { note } = req.body;
    
    if (!note || typeof note !== 'string') {
      throw new BadRequestError('Note text is required');
    }
    
    // Add note with user context
    const result = await this.service.addNote(projectId, note, {
      userContext: req.user ? {
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        ipAddress: req.ip
      } : undefined
    });
    
    // Send success response
    ResponseFactory.success(res, result, 'Note added successfully', 201);
  });

  /**
   * Get project statistics
   * @route GET /api/v1/projects/statistics
   */
  getProjectStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Extract filter parameters
    const filters: Partial<ProjectFilterParams> = {
      status: req.query.status as string,
      customerId: req.query.kunde_id ? Number(req.query.kunde_id) : undefined,
      serviceId: req.query.dienstleistung_id ? Number(req.query.dienstleistung_id) : undefined,
      startDateFrom: req.query.start_datum_von as string,
      startDateTo: req.query.start_datum_bis as string
    };
    
    // Get statistics from service
    const statistics = await this.service.getStatistics(filters);
    
    // Send success response
    ResponseFactory.success(res, statistics, 'Project statistics retrieved successfully');
  });

  /**
   * Export projects data
   * @route GET /api/v1/projects/export
   */
  exportProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // This would typically integrate with an export service
    // For now, return a simple not implemented response
    res.status(501).json({ 
      success: false,
      error: 'Export functionality is not implemented yet'
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
  getProjectStatistics,
  exportProjects
} = projectController;

export default projectController;