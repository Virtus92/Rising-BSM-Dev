import { IBaseService, ServiceOptions, PaginatedResult } from './IBaseService.js';
import { Project } from '../entities/Project.js';
import { 
  ProjectCreateDto, 
  ProjectUpdateDto, 
  ProjectResponseDto, 
  ProjectDetailResponseDto,
  ProjectStatusUpdateDto,
  ProjectNoteDto,
  ProjectFilterParams,
  ProjectStatisticsDto
} from '../dtos/ProjectDtos.js';

/**
 * Interface for project service
 * Extends the base service with project-specific methods
 */
export interface IProjectService extends IBaseService<Project, ProjectCreateDto, ProjectUpdateDto, ProjectResponseDto> {
  /**
   * Get detailed project information
   * 
   * @param id - Project ID
   * @param options - Service options
   * @returns Promise with detailed project response
   */
  getProjectDetails(id: number, options?: ServiceOptions): Promise<ProjectDetailResponseDto | null>;
  
  /**
   * Find projects with filtering
   * 
   * @param filters - Filter parameters
   * @returns Promise with projects and pagination info
   */
  findProjects(filters: ProjectFilterParams): Promise<PaginatedResult<ProjectResponseDto>>;
  
  /**
   * Find projects for a customer
   * 
   * @param customerId - Customer ID
   * @param options - Service options
   * @returns Promise with projects
   */
  findByCustomer(customerId: number, options?: ServiceOptions): Promise<ProjectResponseDto[]>;
  
  /**
   * Find projects for a service
   * 
   * @param serviceId - Service ID
   * @param options - Service options
   * @returns Promise with projects
   */
  findByService(serviceId: number, options?: ServiceOptions): Promise<ProjectResponseDto[]>;
  
  /**
   * Find active projects
   * 
   * @param limit - Maximum number of projects to return
   * @param options - Service options
   * @returns Promise with projects
   */
  findActive(limit?: number, options?: ServiceOptions): Promise<ProjectResponseDto[]>;
  
  /**
   * Update project status
   * 
   * @param id - Project ID
   * @param statusData - Status update data
   * @param options - Service options
   * @returns Promise with updated project
   */
  updateStatus(id: number, statusData: ProjectStatusUpdateDto, options?: ServiceOptions): Promise<ProjectResponseDto>;
  
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
  addNote(id: number, note: string, userId: number, userName: string, options?: ServiceOptions): Promise<ProjectNoteDto>;
  
  /**
   * Get project notes
   * 
   * @param id - Project ID
   * @param options - Service options
   * @returns Promise with notes
   */
  getNotes(id: number, options?: ServiceOptions): Promise<ProjectNoteDto[]>;
  
  /**
   * Get project statistics
   * 
   * @param filters - Optional filter parameters
   * @param options - Service options
   * @returns Promise with statistics
   */
  getProjectStatistics(filters?: Partial<ProjectFilterParams>, options?: ServiceOptions): Promise<ProjectStatisticsDto>;
  
  /**
   * Export projects to file
   * 
   * @param format - Export format (csv or excel)
   * @param filters - Filter parameters
   * @param options - Service options
   * @returns Promise with export data
   */
  exportData(format: 'csv' | 'excel', filters?: ProjectFilterParams, options?: ServiceOptions): Promise<{ buffer: Buffer; filename: string }>;
}
