import { BaseService } from '../core/BaseService.js';
import { IProjectService } from '../interfaces/IProjectService.js';
import { IProjectRepository } from '../interfaces/IProjectRepository.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { Project, ProjectStatus } from '../entities/Project.js';
import { 
  ProjectCreateDto, 
  ProjectUpdateDto, 
  ProjectResponseDto,
  ProjectDetailResponseDto,
  ProjectFilterParams,
  ProjectStatusUpdateDto,
  ProjectNoteDto,
  ProjectStatisticsDto,
  projectCreateValidationSchema,
  projectUpdateValidationSchema,
  projectStatusUpdateValidationSchema,
  projectNoteValidationSchema
} from '../dtos/ProjectDtos.js';
import { ServiceOptions, PaginatedResult } from '../interfaces/IBaseService.js';
import { DateTimeHelper } from '../utils/datetime-helper.js';

/**
 * Implementation of IProjectService
 */
export class ProjectService extends BaseService<
  Project, 
  ProjectCreateDto, 
  ProjectUpdateDto, 
  ProjectResponseDto
> implements IProjectService {
  /**
   * Creates a new ProjectService instance
   * 
   * @param projectRepository - Project repository
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly projectRepository: IProjectRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    super(projectRepository, logger, validator, errorHandler);
    
    this.logger.debug('ProjectService initialized');
  }
  
  /**
   * Get detailed project information
   * 
   * @param id - Project ID
   * @param options - Service options
   * @returns Promise with detailed project response
   */
  async getProjectDetails(id: number, options?: ServiceOptions): Promise<ProjectDetailResponseDto | null> {
    try {
      // Get project with details
      const project = await this.projectRepository.findByIdWithDetails(id);
      
      if (!project) {
        return null;
      }
      
      // Map to basic DTO
      const projectDto = this.toDTO(project);
      
      // Map to detailed DTO
      const detailDto: ProjectDetailResponseDto = {
        ...projectDto,
        notes: project.notes?.map(note => ({
          id: note.id,
          projectId: note.projectId,
          note: note.text,
          userId: note.userId,
          userName: note.userName,
          formattedDate: note.formattedDate,
          createdAt: note.createdAt.toISOString()
        })) || [],
        customer: project.customer ? {
          id: project.customer.id,
          name: project.customer.name,
          email: project.customer.email
        } : undefined,
        service: project.service ? {
          id: project.service.id,
          name: project.service.name,
          basePrice: project.service.basePrice,
          unit: project.service.unit
        } : undefined,
        appointments: project.appointments?.map(appointment => ({
          id: appointment.id,
          title: appointment.title,
          date: appointment.date,
          status: appointment.status,
          statusLabel: appointment.statusLabel
        })) || []
      };
      
      return detailDto;
    } catch (error) {
      this.logger.error('Error in ProjectService.getProjectDetails', error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }
  
  /**
   * Find projects with filtering
   * 
   * @param filters - Filter parameters
   * @returns Promise with projects and pagination info
   */
  async findProjects(filters: ProjectFilterParams): Promise<PaginatedResult<ProjectResponseDto>> {
    try {
      // Get projects using repository
      const result = await this.projectRepository.findProjects(filters);
      
      // Map to DTOs
      const data = result.data.map(project => this.toDTO(project));
      
      return {
        data,
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error in ProjectService.findProjects', error instanceof Error ? error : String(error), { filters });
      throw this.handleError(error);
    }
  }
  
  /**
   * Find projects for a customer
   * 
   * @param customerId - Customer ID
   * @param options - Service options
   * @returns Promise with projects
   */
  async findByCustomer(customerId: number, options?: ServiceOptions): Promise<ProjectResponseDto[]> {
    try {
      // Map service options to repository options
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Get projects using repository
      const projects = await this.projectRepository.findByCustomer(customerId);
      
      // Map to DTOs
      return projects.map(project => this.toDTO(project));
    } catch (error) {
      this.logger.error('Error in ProjectService.findByCustomer', error instanceof Error ? error : String(error), { customerId });
      throw this.handleError(error);
    }
  }
  
  /**
   * Find projects for a service
   * 
   * @param serviceId - Service ID
   * @param options - Service options
   * @returns Promise with projects
   */
  async findByService(serviceId: number, options?: ServiceOptions): Promise<ProjectResponseDto[]> {
    try {
      // Map service options to repository options
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Get projects using repository
      const projects = await this.projectRepository.findByService(serviceId);
      
      // Map to DTOs
      return projects.map(project => this.toDTO(project));
    } catch (error) {
      this.logger.error('Error in ProjectService.findByService', error instanceof Error ? error : String(error), { serviceId });
      throw this.handleError(error);
    }
  }
  
  /**
   * Find active projects
   * 
   * @param limit - Maximum number of projects to return
   * @param options - Service options
   * @returns Promise with projects
   */
  async findActive(limit?: number, options?: ServiceOptions): Promise<ProjectResponseDto[]> {
    try {
      // Map service options to repository options
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Get projects using repository
      const projects = await this.projectRepository.findActive(limit);
      
      // Map to DTOs
      return projects.map(project => this.toDTO(project));
    } catch (error) {
      this.logger.error('Error in ProjectService.findActive', error instanceof Error ? error : String(error), { limit });
      throw this.handleError(error);
    }
  }
  
  /**
   * Update project status
   * 
   * @param id - Project ID
   * @param statusData - Status update data
   * @param options - Service options
   * @returns Promise with updated project
   */
  async updateStatus(id: number, statusData: ProjectStatusUpdateDto, options?: ServiceOptions): Promise<ProjectResponseDto> {
    try {
      // Validate status update data
      const { isValid, errors } = this.validator.validate(statusData, projectStatusUpdateValidationSchema);
      
      if (!isValid) {
        throw this.errorHandler.createValidationError('Invalid status data', errors);
      }
      
      // Get project
      const project = await this.repository.findById(id);
      
      if (!project) {
        throw this.errorHandler.createNotFoundError(`Project with ID ${id} not found`);
      }
      
      // Update status
      const updatedProject = await this.update(id, { status: statusData.status }, options);
      
      // Add note if provided
      if (statusData.note && options?.context?.userId) {
        await this.addNote(
          id,
          statusData.note,
          options.context.userId,
          options.context.name || 'System',
          options
        );
        
        // Log the status change
        await this.projectRepository.logActivity(
          id,
          options.context.userId,
          options.context.name || 'System',
          'status_changed',
          `Status changed to ${statusData.status}`
        );
      }
      
      return updatedProject;
    } catch (error) {
      this.logger.error('Error in ProjectService.updateStatus', error instanceof Error ? error : String(error), { id, statusData });
      throw this.handleError(error);
    }
  }
  
  /**
   * Add note to project
   * 
   * @param id - Project ID
   * @param note - Note text
   * @param userId - User ID
   * @param userName - User name
   * @param options - Service options
   * @returns Promise with created note
   */
  async addNote(id: number, note: string, userId: number, userName: string, options?: ServiceOptions): Promise<ProjectNoteDto> {
    try {
      // Validate note
      const { isValid, errors } = this.validator.validate({ note }, projectNoteValidationSchema);
      
      if (!isValid) {
        throw this.errorHandler.createValidationError('Invalid note', errors);
      }
      
      // Check if project exists
      const project = await this.repository.findById(id);
      
      if (!project) {
        throw this.errorHandler.createNotFoundError(`Project with ID ${id} not found`);
      }
      
      // Add note using repository
      const createdNote = await this.projectRepository.addNote(id, userId, userName, note);
      
      // Map to DTO
      return {
        id: createdNote.id,
        projectId: createdNote.projectId,
        note: createdNote.text,
        userId: createdNote.userId,
        userName: createdNote.userName,
        formattedDate: createdNote.formattedDate,
        createdAt: createdNote.createdAt.toISOString()
      };
    } catch (error) {
      this.logger.error('Error in ProjectService.addNote', error instanceof Error ? error : String(error), { id, userId });
      throw this.handleError(error);
    }
  }
  
  /**
   * Get project notes
   * 
   * @param id - Project ID
   * @param options - Service options
   * @returns Promise with notes
   */
  async getNotes(id: number, options?: ServiceOptions): Promise<ProjectNoteDto[]> {
    try {
      // Check if project exists
      const project = await this.repository.findById(id);
      
      if (!project) {
        throw this.errorHandler.createNotFoundError(`Project with ID ${id} not found`);
      }
      
      // Get notes using repository
      const notes = await this.projectRepository.getNotes(id);
      
      // Map to DTOs
      return notes.map(note => ({
        id: note.id,
        projectId: note.projectId,
        note: note.text,
        userId: note.userId,
        userName: note.userName,
        formattedDate: note.formattedDate,
        createdAt: note.createdAt.toISOString()
      }));
    } catch (error) {
      this.logger.error('Error in ProjectService.getNotes', error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }
  
  /**
   * Get project statistics
   * 
   * @param filters - Optional filter parameters
   * @param options - Service options
   * @returns Promise with statistics
   */
  async getProjectStatistics(filters?: Partial<ProjectFilterParams>, options?: ServiceOptions): Promise<ProjectStatisticsDto> {
    try {
      // Get statistics using repository
      const stats = await this.projectRepository.getStatistics(filters);
      
      // Format statistics
      return {
        statusCounts: stats.statusCounts,
        totalValue: stats.totalValue,
        byMonth: stats.byMonth,
        topCustomers: stats.topCustomers
      };
    } catch (error) {
      this.logger.error('Error in ProjectService.getProjectStatistics', error instanceof Error ? error : String(error), { filters });
      throw this.handleError(error);
    }
  }
  
  /**
   * Export projects to file
   * 
   * @param format - Export format (csv or excel)
   * @param filters - Filter parameters
   * @param options - Service options
   * @returns Promise with export data
   */
  async exportData(format: 'csv' | 'excel', filters?: ProjectFilterParams, options?: ServiceOptions): Promise<{ buffer: Buffer; filename: string }> {
    try {
      // Get filtered projects
      const { data: projects } = await this.findProjects(filters || {});
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `projects-export-${timestamp}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      
      if (format === 'csv') {
        // Generate CSV content
        const headers = 'ID,Title,Customer,Service,StartDate,EndDate,Amount,Status\n';
        const rows = projects.map(project => {
          return [
            project.id,
            this.escapeCsvValue(project.title),
            this.escapeCsvValue(project.customerName || ''),
            this.escapeCsvValue(project.serviceName || ''),
            project.startDate || '',
            project.endDate || '',
            project.amount || '',
            this.escapeCsvValue(project.statusLabel)
          ].join(',');
        }).join('\n');
        
        const csvContent = headers + rows;
        return {
          buffer: Buffer.from(csvContent),
          filename
        };
      } else {
        // Excel export (implemented with proper Excel library)
        return this.generateExcelExport(projects, filename);
      }
    } catch (error) {
      this.logger.error('Error in ProjectService.exportData', error instanceof Error ? error : String(error), { format, filters });
      throw this.handleError(error);
    }
  }
  
  /**
   * Map entity to response DTO
   * 
   * @param entity - Project entity
   * @returns Project response DTO
   */
  toDTO(entity: Project): ProjectResponseDto {
    return {
      id: entity.id,
      title: entity.title,
      customerId: entity.customerId,
      customerName: (entity as any).customerName,
      serviceId: entity.serviceId,
      serviceName: (entity as any).serviceName,
      startDate: entity.startDate ? DateTimeHelper.formatDate(entity.startDate) : undefined,
      endDate: entity.endDate ? DateTimeHelper.formatDate(entity.endDate) : undefined,
      amount: entity.amount,
      description: entity.description,
      status: entity.status,
      statusLabel: entity.getStatusLabel(),
      statusClass: entity.getStatusClass(),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }
  
  /**
   * Get validation schema for create operation
   * 
   * @returns Validation schema
   */
  protected getCreateValidationSchema(): any {
    return projectCreateValidationSchema;
  }
  
  /**
   * Get validation schema for update operation
   * 
   * @returns Validation schema
   */
  protected getUpdateValidationSchema(): any {
    return projectUpdateValidationSchema;
  }
  
  /**
   * Map DTO to entity
   * 
   * @param dto - DTO data
   * @param existingEntity - Existing entity (for updates)
   * @returns Entity data
   */
  protected toEntity(dto: ProjectCreateDto | ProjectUpdateDto, existingEntity?: Project): Partial<Project> {
    // Parse dates if provided as strings
    const parsedDto: any = { ...dto };
    
    if (dto.startDate && typeof dto.startDate === 'string') {
      parsedDto.startDate = new Date(dto.startDate);
    }
    
    if (dto.endDate && typeof dto.endDate === 'string') {
      parsedDto.endDate = new Date(dto.endDate);
    }
    
    if (existingEntity) {
      // Update operation - return only the fields to update
      return parsedDto as ProjectUpdateDto;
    } else {
      // Create operation - ensure required fields have defaults
      return {
        ...parsedDto as ProjectCreateDto,
        status: parsedDto.status || ProjectStatus.NEW
      };
    }
  }
  
  /**
   * Escape CSV value
   * 
   * @param value - Value to escape
   * @returns Escaped value
   */
  private escapeCsvValue(value: string): string {
    if (!value) return '';
    
    // If value contains comma, double quote, or newline, wrap in quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // Replace double quotes with two double quotes
      value = value.replace(/"/g, '""');
      return `"${value}"`;
    }
    
    return value;
  }
  
  /**
   * Generate Excel export
   * 
   * @param projects - Projects to export
   * @param filename - Output filename
   * @returns Export result
   */
  private generateExcelExport(projects: ProjectResponseDto[], filename: string): { buffer: Buffer, filename: string } {
    // This would use a proper Excel library like exceljs or xlsx
    // Since we don't have the actual implementation, we'll just convert to CSV for now
    
    this.logger.warn('Excel export not fully implemented - falling back to CSV');
    
    // Generate CSV content
    const headers = 'ID,Title,Customer,Service,StartDate,EndDate,Amount,Status\n';
    const rows = projects.map(project => {
      return [
        project.id,
        this.escapeCsvValue(project.title),
        this.escapeCsvValue(project.customerName || ''),
        this.escapeCsvValue(project.serviceName || ''),
        project.startDate || '',
        project.endDate || '',
        project.amount || '',
        this.escapeCsvValue(project.statusLabel)
      ].join(',');
    }).join('\n');
    
    const csvContent = headers + rows;
    return {
      buffer: Buffer.from(csvContent),
      filename: filename.replace('.xlsx', '.csv')
    };
  }
}
