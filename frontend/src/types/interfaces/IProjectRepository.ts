import { IBaseRepository } from './IBaseRepository';
import { Project } from '../entities/Project';
import { ProjectFilterParams } from '../dtos/ProjectDtos';
import { 
  PaginatedResult, 
  OperationOptions,
  FilterCriteria,
  ErrorDetails 
} from '@/types/core/shared';

export interface IProjectRepository extends IBaseRepository<Project, number, ProjectFilterParams> {
  /**
   * Find projects with advanced filtering
   * 
   * @param filters - Complex project filter parameters
   * @param options - Query options
   * @returns Paginated project results
   */
  findProjects(
    filters: ProjectFilterParams, 
    options?: OperationOptions
  ): Promise<PaginatedResult<Project>>;
  
  /**
   * Find projects for a specific customer
   * 
   * @param customerId - Customer ID
   * @param options - Query options
   * @returns Project entities
   */
  findByCustomer(
    customerId: number, 
    options?: OperationOptions
  ): Promise<Project[]>;
  
  /**
   * Find projects for a specific service
   * 
   * @param serviceId - Service ID
   * @param options - Query options
   * @returns Project entities
   */
  findByService(
    serviceId: number, 
    options?: OperationOptions
  ): Promise<Project[]>;
  
  /**
   * Find active projects
   * 
   * @param limit - Maximum number of active projects to return
   * @param options - Query options
   * @returns Active project entities
   */
  findActive(
    limit?: number, 
    options?: OperationOptions
  ): Promise<Project[]>;
  
  /**
   * Retrieve project with detailed relations
   * 
   * @param id - Project ID
   * @param options - Query options
   * @returns Project entity with all related data or null
   */
  findByIdWithDetails(
    id: number, 
    options?: OperationOptions
  ): Promise<Project | null>;
  
  /**
   * Add a note to a project
   * 
   * @param projectId - Project ID
   * @param userId - User adding the note
   * @param userName - Name of user adding the note
   * @param text - Note text
   * @returns Created note
   * @throws {ErrorDetails} When note addition fails
   */
  addNote(
    projectId: number, 
    userId: number, 
    userName: string, 
    text: string
  ): Promise<{
    id: number;
    projectId: number;
    userId: number;
    userName: string;
    text: string;
    createdAt: Date;
  }>;
  
  /**
   * Retrieve project notes
   * 
   * @param projectId - Project ID
   * @returns Project notes
   */
  getNotes(
    projectId: number
  ): Promise<Array<{
    id: number;
    projectId: number;
    userId: number;
    userName: string;
    text: string;
    createdAt: Date;
  }>>;
  
  /**
   * Log activity for a project
   * 
   * @param projectId - Project ID
   * @param userId - User ID
   * @param userName - User name
   * @param action - Activity type
   * @param details - Activity details
   * @returns Created activity log
   */
  logActivity(
    projectId: number, 
    userId: number, 
    userName: string, 
    action: string, 
    details?: string
  ): Promise<{
    id: number;
    projectId: number;
    userId: number;
    userName: string;
    action: string;
    details?: string;
    createdAt: Date;
  }>;
  
  /**
   * Get project statistics
   * 
   * @param filters - Optional filter parameters
   * @returns Project statistics
   */
  getStatistics(
    filters?: Partial<ProjectFilterParams>
  ): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    averageProjectValue: number;
    projectsByStatus: Record<string, number>;
    topCustomers: Array<{
      customerId: number;
      customerName: string;
      projectCount: number;
      totalValue: number;
    }>;
  }>;
}
