import { Service } from '../entities/Service.js';
import { IBaseRepository } from './IBaseRepository.js';
import { ServiceFilterParams } from '../dtos/ServiceDtos.js';

/**
 * Interface for service repository
 * Extends the base repository with service-specific methods
 */
export interface IServiceRepository extends IBaseRepository<Service, number> {
  /**
   * Find services by filter parameters
   * 
   * @param filters - Filter parameters
   * @returns Promise with services and pagination info
   */
  findServices(filters: ServiceFilterParams): Promise<{ data: Service[]; pagination: any }>;
  
  /**
   * Find active services
   * 
   * @param limit - Maximum number of services to return
   * @returns Promise with services
   */
  findActive(limit?: number): Promise<Service[]>;
  
  /**
   * Toggle service active status
   * 
   * @param id - Service ID
   * @param active - Active status
   * @returns Promise with updated service
   */
  toggleStatus(id: number, active: boolean): Promise<Service>;
  
  /**
   * Get service statistics
   * 
   * @param serviceId - Service ID
   * @returns Promise with statistics
   */
  getStatistics(serviceId: number): Promise<any>;
  
  /**
   * Log activity for a service
   * 
   * @param serviceId - Service ID
   * @param userId - User ID
   * @param userName - User name
   * @param action - Activity type
   * @param details - Activity details
   * @returns Promise with created activity log
   */
  logActivity(serviceId: number, userId: number, userName: string, action: string, details?: string): Promise<any>;
}
