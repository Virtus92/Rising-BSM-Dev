import { IBaseService, ServiceOptions, PaginatedResult } from './IBaseService.js';
import { Service } from '../entities/Service.js';
import { 
  ServiceCreateDto, 
  ServiceUpdateDto, 
  ServiceResponseDto, 
  ServiceStatusUpdateDto,
  ServiceFilterParams,
  ServiceStatisticsDto
} from '../dtos/ServiceDtos.js';

/**
 * Interface for service service
 * Extends the base service with service-specific methods
 */
export interface IServiceService extends IBaseService<Service, ServiceCreateDto, ServiceUpdateDto, ServiceResponseDto> {
  /**
   * Find services with filtering
   * 
   * @param filters - Filter parameters
   * @returns Promise with services and pagination info
   */
  findServices(filters: ServiceFilterParams): Promise<PaginatedResult<ServiceResponseDto>>;
  
  /**
   * Find active services
   * 
   * @param limit - Maximum number of services to return
   * @param options - Service options
   * @returns Promise with services
   */
  findActive(limit?: number, options?: ServiceOptions): Promise<ServiceResponseDto[]>;
  
  /**
   * Toggle service active status
   * 
   * @param id - Service ID
   * @param statusData - Status update data
   * @param options - Service options
   * @returns Promise with updated service
   */
  toggleStatus(id: number, statusData: ServiceStatusUpdateDto, options?: ServiceOptions): Promise<ServiceResponseDto>;
  
  /**
   * Get service statistics
   * 
   * @param id - Service ID
   * @param options - Service options
   * @returns Promise with statistics
   */
  getServiceStatistics(id: number, options?: ServiceOptions): Promise<ServiceStatisticsDto>;
  
  /**
   * Get price with VAT
   * 
   * @param id - Service ID
   * @param options - Service options
   * @returns Promise with price information
   */
  getPriceWithVat(id: number, options?: ServiceOptions): Promise<{ basePrice: number; vatAmount: number; totalPrice: number }>;
}
