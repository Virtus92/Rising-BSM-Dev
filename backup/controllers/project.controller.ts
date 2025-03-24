/**
 * Project Controller
 * 
 * Controller for Project entity operations handling HTTP requests and responses.
 */
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/common/types.js';
import { asyncHandler } from '../utils/error.utils.js';
import { ResponseFactory } from '../utils/response.utils.js';
import { ProjectService } from '../services/project.service.js';
import { 
  ProjectCreateDTO, 
  ProjectUpdateDTO, 
  ProjectFilterParams,
  ProjectStatusUpdateDTO
} from '../types/dtos/project.dto.js';
import { BadRequestError, NotFoundError } from '../utils/error.utils.js';
import { inject } from '../config/dependency-container.js';

/**
 * Controller for Project entity operations
 */
export class ProjectController {
  /**
   * Creates a new ProjectController instance
   * @param projectService Project service instance
   */
  constructor(private readonly projectService: ProjectService = inject<ProjectService>('ProjectService')) {}

  /**
   * Get all projects with optional filtering
   * @route GET /api/v1/projects
   */
  getAllProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Extract filter parameters from request
    const filters: ProjectFilterParams = {
      status: req.query.status as string,
      customerId: req.query.customerId ? parseInt(req.query.customerId as string) : undefined,
      serviceId: req.query.serviceId ? parseInt(req.query.serviceId as string) : undefined,
      startDateFrom: req.query.startDateFrom as string,
      startDateTo: req.query.startDateTo as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy as string,
      sortDirection: req.query.sortDirection as 'asc' | 'desc'
    };
    
    // Get projects from service
    const result = await this.projectService.findAll(filters);
    
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
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw new BadRequestError('Invalid project ID');
    }
    
    // Get project with details from service
    const result = await this.projectService.findByIdWithDetails(id);
    
    if (!result) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }
    
    // Send success response
    ResponseFactory.success(res, result, 'Project retrieved successfully');
  });

  /**
   * Create a new project
   * @route POST /api/v1/projects
   */
  createProject = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Extract project data from request body
    const projectData: ProjectCreateDTO = req.body;
    
    // Get user context from authenticated request
    const userContext = req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined;
    
    // Create project
    const result = await this.projectService.create(projectData, {
      userContext,
      createdBy: req.user?.id
    });
    
    // Send created response
    ResponseFactory.created(res, result, 'Project created successfully');
  });

  /**
   * Update an existing project
   * @route PUT /api/v1/projects/:id
   */
  updateProject = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw new BadRequestError('Invalid project ID');
    }
    
    // Extract project data from request body
    const projectData: ProjectUpdateDTO = req.body;
    
    // Get user context from authenticated request
    const userContext = req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined;
    
    // Update project
    const result = await this.projectService.update(id, projectData, { userContext });
    
    // Send success response
    ResponseFactory.success(res, result, 'Project updated successfully');
  });

  /**
   * Update project status
   * @route PATCH /api/v1/projects/:id/status
   */
  updateProjectStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw new BadRequestError('Invalid project ID');
    }
    
    // Extract status data from request body
    const { status, note }: ProjectStatusUpdateDTO = req.body;
    
    // Get user context from authenticated request
    const userContext = req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined;
    
    // Update project status
    const result = await this.projectService.updateStatus(id, status, note, { userContext });
    
    // Send success response
    ResponseFactory.success(res, result, 'Project status updated successfully');
  });

  /**
   * Add a note to project
   * @route POST /api/v1/projects/:id/notes
   */
  addProjectNote = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw new BadRequestError('Invalid project ID');
    }
    
    // Extract note data from request body
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      throw new BadRequestError('Note text is required');
    }
    
    // Get user context from authenticated request
    const userContext = req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined;
    
    // Add note to project
    const result = await this.projectService.addNote(id, text, { userContext });
    
    // Send created response
    ResponseFactory.created(res, result, 'Note added successfully');
  });

  /**
   * Get project statistics
   * @route GET /api/v1/projects/statistics
   */
  getProjectStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Extract filter parameters from request
    const filters: Partial<ProjectFilterParams> = {
      status: req.query.status as string,
      customerId: req.query.customerId ? parseInt(req.query.customerId as string) : undefined,
      serviceId: req.query.serviceId ? parseInt(req.query.serviceId as string) : undefined,
      startDateFrom: req.query.startDateFrom as string,
      startDateTo: req.query.startDateTo as string
    };
    
    // Get statistics from service
    const statistics = await this.projectService.getStatistics(filters);
    
    // Send success response
    ResponseFactory.success(res, statistics, 'Project statistics retrieved successfully');
  });

  /**
   * Export projects data
   * @route GET /api/v1/projects/export
   */
  exportProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Extract filter parameters from request
    const filters: ProjectFilterParams = {
      status: req.query.status as string,
      customerId: req.query.customerId ? parseInt(req.query.customerId as string) : undefined,
      serviceId: req.query.serviceId ? parseInt(req.query.serviceId as string) : undefined,
      startDateFrom: req.query.startDateFrom as string,
      startDateTo: req.query.startDateTo as string,
      search: req.query.search as string
    };
    
    // Get export data from service
    const exportData = await this.projectService.exportProjects(filters);
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="projects.csv"');
    
    // Send export data
    res.status(200).send(exportData);
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