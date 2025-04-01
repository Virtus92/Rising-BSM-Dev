import { Request, Response } from 'express';
import { BaseController } from '../core/BaseController.js';
import { IProjectController } from '../interfaces/IProjectController.js';
import { IProjectService } from '../interfaces/IProjectService.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { 
  ProjectCreateDto, 
  ProjectUpdateDto, 
  ProjectResponseDto,
  ProjectStatusUpdateDto,
  ProjectFilterParams
} from '../dtos/ProjectDtos.js';
import { Project } from '../entities/Project.js';
import { AuthenticatedRequest } from '../interfaces/IAuthTypes.js';

/**
 * Implementation of IProjectController
 * Handles HTTP requests related to projects
 */
export class ProjectController extends BaseController<Project, ProjectCreateDto, ProjectUpdateDto, ProjectResponseDto> implements IProjectController {
  /**
   * Creates a new ProjectController instance
   * 
   * @param projectService - Project service
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly projectService: IProjectService,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(projectService, logger, errorHandler);
    
    // Bind methods to preserve 'this' context when used as route handlers
    this.getAllProjects = this.getAllProjects.bind(this);
    this.getProjectById = this.getProjectById.bind(this);
    this.createProject = this.createProject.bind(this);
    this.updateProject = this.updateProject.bind(this);
    this.deleteProject = this.deleteProject.bind(this);
    this.updateProjectStatus = this.updateProjectStatus.bind(this);
    this.getProjectsByCustomer = this.getProjectsByCustomer.bind(this);
    this.getProjectsByService = this.getProjectsByService.bind(this);
    this.getActiveProjects = this.getActiveProjects.bind(this);
    this.getProjectStatistics = this.getProjectStatistics.bind(this);
    this.addProjectNote = this.addProjectNote.bind(this);
    this.getProjectNotes = this.getProjectNotes.bind(this);
    this.searchProjects = this.searchProjects.bind(this);
    this.exportProjects = this.exportProjects.bind(this);
    
    this.logger.debug('ProjectController initialized');
  }
  
  /**
   * Get all projects with pagination and filtering
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getAllProjects(req: Request, res: Response): Promise<void> {
    try {
      // Extract filter criteria from request
      const filters = this.extractProjectFilters(req);
      
      // Get projects from service
      const result = await this.projectService.findProjects(filters);
      
      // Send paginated response
      this.sendPaginatedResponse(
        res,
        result.data,
        result.pagination,
        'Projects retrieved successfully'
      );
    } catch (error) {
      this.handleError(error, res, 'Error retrieving projects');
    }
  }
  
  /**
   * Get project by ID
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Get detailed project data
      const project = await this.projectService.getProjectDetails(id);
      
      if (!project) {
        throw this.errorHandler.createNotFoundError(`Project with ID ${id} not found`);
      }
      
      // Send success response
      this.sendSuccessResponse(res, project, 'Project retrieved successfully');
    } catch (error) {
      this.handleError(error, res, 'Error retrieving project');
    }
  }
  
  /**
   * Create a new project
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async createProject(req: Request, res: Response): Promise<void> {
    return this.create(req, res);
  }
  
  /**
   * Update an existing project
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async updateProject(req: Request, res: Response): Promise<void> {
    return this.update(req, res);
  }
  
  /**
   * Delete a project
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async deleteProject(req: Request, res: Response): Promise<void> {
    return this.delete(req, res);
  }
  
  /**
   * Update project status
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async updateProjectStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const statusData = req.body as ProjectStatusUpdateDto;
      const authReq = req as AuthenticatedRequest;
      
      // Update status
      const project = await this.projectService.updateStatus(id, statusData, {
        context: {
          userId: authReq.user?.id,
          name: authReq.user?.name,
          ipAddress: req.ip
        }
      });
      
      // Send success response
      this.sendSuccessResponse(res, project, 'Project status updated successfully');
    } catch (error) {
      this.handleError(error, res, 'Error updating project status');
    }
  }
  
  /**
   * Get projects by customer
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getProjectsByCustomer(req: Request, res: Response): Promise<void> {
    try {
      const customerId = parseInt(req.params.customerId, 10);
      
      // Get projects from service
      const projects = await this.projectService.findByCustomer(customerId);
      
      // Send success response
      this.sendSuccessResponse(res, projects, 'Customer projects retrieved successfully');
    } catch (error) {
      this.handleError(error, res, 'Error retrieving customer projects');
    }
  }
  
  /**
   * Get projects by service
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getProjectsByService(req: Request, res: Response): Promise<void> {
    try {
      const serviceId = parseInt(req.params.serviceId, 10);
      
      // Get projects from service
      const projects = await this.projectService.findByService(serviceId);
      
      // Send success response
      this.sendSuccessResponse(res, projects, 'Service projects retrieved successfully');
    } catch (error) {
      this.handleError(error, res, 'Error retrieving service projects');
    }
  }
  
  /**
   * Get active projects
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getActiveProjects(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 10;
      
      // Get active projects from service
      const projects = await this.projectService.findActive(limit);
      
      // Send success response
      this.sendSuccessResponse(res, projects, 'Active projects retrieved successfully');
    } catch (error) {
      this.handleError(error, res, 'Error retrieving active projects');
    }
  }
  
  /**
   * Get project statistics
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getProjectStatistics(req: Request, res: Response): Promise<void> {
    try {
      // Extract optional filters from query params
      const filters = this.extractProjectFilters(req);
      
      // Get statistics from service
      const statistics = await this.projectService.getProjectStatistics(filters);
      
      // Send success response
      this.sendSuccessResponse(res, statistics, 'Project statistics retrieved successfully');
    } catch (error) {
      this.handleError(error, res, 'Error retrieving project statistics');
    }
  }
  
  /**
   * Add note to project
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async addProjectNote(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { note } = req.body;
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        throw this.errorHandler.createUnauthorizedError('Authentication required');
      }
      
      // Add note
      const createdNote = await this.projectService.addNote(
        id,
        note,
        authReq.user.id,
        authReq.user.name
      );
      
      // Send success response
      this.sendSuccessResponse(res, createdNote, 'Note added successfully');
    } catch (error) {
      this.handleError(error, res, 'Error adding project note');
    }
  }
  
  /**
   * Get project notes
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getProjectNotes(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Get notes from service
      const notes = await this.projectService.getNotes(id);
      
      // Send success response
      this.sendSuccessResponse(res, notes, 'Project notes retrieved successfully');
    } catch (error) {
      this.handleError(error, res, 'Error retrieving project notes');
    }
  }
  
  /**
   * Search projects
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async searchProjects(req: Request, res: Response): Promise<void> {
    try {
      // Extract filter criteria from request
      const filters = this.extractProjectFilters(req);
      filters.search = req.query.q as string || '';
      
      // Get projects from service
      const result = await this.projectService.findProjects(filters);
      
      // Send paginated response
      this.sendPaginatedResponse(
        res,
        result.data,
        result.pagination,
        'Projects search completed successfully'
      );
    } catch (error) {
      this.handleError(error, res, 'Error searching projects');
    }
  }
  
  /**
   * Export projects
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async exportProjects(req: Request, res: Response): Promise<void> {
    try {
      // Extract filter criteria from request
      const filters = this.extractProjectFilters(req);
      const format = (req.query.format as string || 'csv').toLowerCase() as 'csv' | 'excel';
      
      // Validate format
      if (format !== 'csv' && format !== 'excel') {
        throw this.errorHandler.createValidationError('Invalid format', ['Format must be csv or excel']);
      }
      
      // Generate export data
      const { buffer, filename } = await this.projectService.exportData(format, filters);
      
      // Set appropriate headers
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
      } else {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Send file
      res.send(buffer);
    } catch (error) {
      this.handleError(error, res, 'Error exporting projects');
    }
  }
  
  /**
   * Extract project filter parameters from request
   * 
   * @param req - HTTP request
   * @returns Project filter parameters
   */
  private extractProjectFilters(req: Request): ProjectFilterParams {
    const filters: ProjectFilterParams = {};
    
    // Extract and convert pagination params
    if (req.query.page) filters.page = parseInt(req.query.page as string, 10);
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string, 10);
    
    // Extract filter params
    if (req.query.status) filters.status = req.query.status as any;
    if (req.query.customerId) filters.customerId = parseInt(req.query.customerId as string, 10);
    if (req.query.serviceId) filters.serviceId = parseInt(req.query.serviceId as string, 10);
    if (req.query.startDateFrom) filters.startDateFrom = req.query.startDateFrom as string;
    if (req.query.startDateTo) filters.startDateTo = req.query.startDateTo as string;
    if (req.query.search) filters.search = req.query.search as string;
    
    // Extract sorting params
    if (req.query.sortBy) filters.sortBy = req.query.sortBy as string;
    if (req.query.sortDirection) filters.sortDirection = req.query.sortDirection as 'asc' | 'desc';
    
    return filters;
  }
}
