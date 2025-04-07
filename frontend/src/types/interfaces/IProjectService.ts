import { IBaseService } from './IBaseService';
import { Project } from '../entities/Project';
import { 
  ProjectCreateDto, 
  ProjectUpdateDto, 
  ProjectResponseDto, 
  ProjectDetailResponseDto,
  ProjectStatusUpdateDto,
  ProjectNoteDto,
  ProjectFilterParams,
  ProjectStatisticsDto
} from '../dtos/ProjectDtos';
import { PaginatedResult, OperationOptions, FilterCriteria, ErrorDetails } from '@/types/core/shared';
import { AuthContext } from '@/types/core/auth';

export interface IProjectService extends IBaseService<
  Project, 
  ProjectCreateDto, 
  ProjectUpdateDto, 
  ProjectResponseDto
> {
  /**
   * Retrieve detailed project information
   * 
   * @param id - Project ID
   * @param options - Operation options with optional auth context
   * @returns Detailed project response or null
   * @throws {ErrorDetails} When retrieval fails
   */
  getProjectDetails(
    id: number, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<ProjectDetailResponseDto | null>;
  
  /**
   * Advanced project search with comprehensive filtering
   * 
   * @param filters - Complex project filter parameters
   * @param options - Operation options
   * @returns Paginated project results
   */
  findProjects(
    filters: ProjectFilterParams, 
    options?: OperationOptions
  ): Promise<PaginatedResult<ProjectResponseDto>>;
  
  /**
   * Find projects for a specific customer
   * 
   * @param customerId - Customer ID
   * @param options - Operation options with optional auth context
   * @returns Project responses
   */
  findByCustomer(
    customerId: number, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<ProjectResponseDto[]>;
  
  /**
   * Find projects for a specific service
   * 
   * @param serviceId - Service ID
   * @param options - Operation options with optional auth context
   * @returns Project responses
   */
  findByService(
    serviceId: number, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<ProjectResponseDto[]>;
  
  /**
   * Find active projects
   * 
   * @param limit - Maximum number of active projects to return
   * @param options - Operation options with optional auth context
   * @returns Active project responses
   */
  findActive(
    limit?: number, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<ProjectResponseDto[]>;
  
  /**
   * Update project status
   * 
   * @param id - Project ID
   * @param statusData - Status update details
   * @param options - Operation options with auth context
   * @returns Updated project response
   * @throws {ErrorDetails} When status update fails
   */
  updateStatus(
    id: number, 
    statusData: ProjectStatusUpdateDto, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<ProjectResponseDto>;
  
  /**
   * Add a note to a project
   * 
   * @param id - Project ID
   * @param note - Note text
   * @param userId - User adding the note
   * @param userName - Name of user adding the note
   * @param options - Operation options with auth context
   * @returns Created project note
   * @throws {ErrorDetails} When note addition fails
   */
  addNote(
    id: number, 
    note: string, 
    userId: number, 
    userName: string, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<ProjectNoteDto>;
  
  /**
   * Retrieve project notes
   * 
   * @param id - Project ID
   * @param options - Operation options with optional auth context
   * @returns Project notes
   */
  getNotes(
    id: number, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<ProjectNoteDto[]>;
  
  /**
   * Get comprehensive project statistics
   * 
   * @param filters - Optional filter parameters
   * @param options - Operation options with auth context
   * @returns Project statistics
   */
  getProjectStatistics(
    filters?: Partial<ProjectFilterParams>, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<ProjectStatisticsDto>;
  
  /**
   * Export project data
   * 
   * @param format - Export format
   * @param filters - Optional filter parameters
   * @param options - Operation options with auth context
   * @returns Exported data buffer and filename
   */
  exportData(
    format: 'csv' | 'excel', 
    filters?: ProjectFilterParams, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<{ buffer: Buffer; filename: string }>;
}
