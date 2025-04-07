import { IBaseRepository } from './IBaseRepository';
import { Service } from '../entities/Service';
import { ServiceFilterParams } from '../dtos/ServiceDtos';
import { 
  PaginatedResult, 
  OperationOptions,
  FilterCriteria,
  ErrorDetails 
} from '@/types/core/shared';

export interface IServiceRepository extends IBaseRepository<Service, number, ServiceFilterParams> {
  /**
   * Find services with advanced filtering
   * 
   * @param filters - Complex service filter parameters
   * @param options - Query options
   * @returns Paginated service results
   */
  findServices(
    filters: ServiceFilterParams, 
    options?: OperationOptions
  ): Promise<PaginatedResult<Service>>;
  
  /**
   * Find active services
   * 
   * @param limit - Maximum number of active services to return
   * @param options - Query options
   * @returns Active service entities
   */
  findActive(
    limit?: number, 
    options?: OperationOptions
  ): Promise<Service[]>;
  
  /**
   * Toggle service active status
   * 
   * @param id - Service ID
   * @param active - New active status
   * @returns Updated service entity
   */
  toggleStatus(
    id: number, 
    active: boolean
  ): Promise<Service>;
  
  /**
   * Get comprehensive service statistics
   * 
   * @param serviceId - Service ID
   * @returns Detailed service statistics
   */
  getStatistics(
    serviceId: number
  ): Promise<{
    totalRevenue: number;
    usageCount: number;
    averagePrice: number;
    topCustomers: Array<{
      customerId: number;
      customerName: string;
      revenue: number;
    }>;
    monthlyRevenue: Array<{
      month: string;
      revenue: number;
    }>;
  }>;
}
