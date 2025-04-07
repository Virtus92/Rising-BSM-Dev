import { Project } from '../entities/Project.js';
import { IBaseRepository } from './IBaseRepository.js';
import { ProjectFilterParams } from '../dtos/ProjectDtos.js';

/**
 * Interface for project repository
 * Extends the base repository with project-specific methods
 */
export interface IProjectRepository extends IBaseRepository<Project, number> {
  /**
   * Find projects by filter parameters
   * 
   * @param filters - Filter parameters
   * @returns Promise with projects and pagination info
   */
  findProjects(filters: ProjectFilterParams): Promise<{ data: Project[]; pagination: any }>;
  
  /**
   * Find projects for a customer
   * 
   * @param customerId - Customer ID
   * @returns Promise with projects
   */
  findByCustomer(customerId: number): Promise<Project[]>;
  
  /**
   * Find projects for a service
   * 
   * @param serviceId - Service ID
   * @returns Promise with projects
   */
  findByService(serviceId: number): Promise<Project[]>;
  
  /**
   * Find active projects
   * 
   * @param limit - Maximum number of projects to return
   * @returns Promise with projects
   */
  findActive(limit?: number): Promise<Project[]>;
  
  /**
   * Get project with detailed relations
   * 
   * @param id - Project ID
   * @returns Promise with project including all related data
   */
  findByIdWithDetails(id: number): Promise<Project | null>;
  
  /**
   * Add a note to a project
   * 
   * @param projectId - Project ID
   * @param userId - User ID
   * @param userName - User name
   * @param text - Note text
   * @returns Promise with created note
   */
  addNote(projectId: number, userId: number, userName: string, text: string): Promise<any>;
  
  /**
   * Get all notes for a project
   * 
   * @param projectId - Project ID
   * @returns Promise with notes
   */
  getNotes(projectId: number): Promise<any[]>;
  
  /**
   * Log activity for a project
   * 
   * @param projectId - Project ID
   * @param userId - User ID
   * @param userName - User name
   * @param action - Activity type
   * @param details - Activity details
   * @returns Promise with created activity log
   */
  logActivity(projectId: number, userId: number, userName: string, action: string, details?: string): Promise<any>;
  
  /**
   * Get project statistics
   * 
   * @param filters - Optional filter parameters
   * @returns Promise with statistics
   */
  getStatistics(filters?: Partial<ProjectFilterParams>): Promise<any>;
}
