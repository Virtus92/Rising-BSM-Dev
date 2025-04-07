import { IBaseService } from './IBaseService';
import { Service } from '../entities/Service';
import { 
  ServiceCreateDto, 
  ServiceUpdateDto, 
  ServiceResponseDto, 
  ServiceStatusUpdateDto,
  ServiceFilterParams,
  ServiceStatisticsDto
} from '../dtos/ServiceDtos';
import { PaginatedResult, OperationOptions, FilterCriteria, ErrorDetails } from '@/types/core/shared';
import { AuthContext } from '@/types/core/auth';

export interface IServiceService extends IBaseService<
  Service, 
  ServiceCreateDto, 
  ServiceUpdateDto, 
  ServiceResponseDto
> {
  /**
   * Find services with advanced filtering
   * 
   * @param filters - Complex service filter parameters
   * @param options - Operation options
   * @returns Paginated service results
   */
  findServices(
    filters: ServiceFilterParams, 
    options?: OperationOptions
  ): Promise<PaginatedResult<ServiceResponseDto>>;
  
  /**
   * Find active services
   * 
   * @param limit - Maximum number of active services to return
   * @param options - Operation options with optional auth context
   * @returns Active service responses
   */
  findActive(
    limit?: number, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<ServiceResponseDto[]>;
  
  /**
   * Toggle service active status
   * 
   * @param id - Service ID
   * @param statusData - Status update details
   * @param options - Operation options with auth context
   * @returns Updated service response
   * @throws {ErrorDetails} When status update fails
   */
  toggleStatus(
    id: number, 
    statusData: ServiceStatusUpdateDto, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<ServiceResponseDto>;
  
  /**
   * Get comprehensive service statistics
   * 
   * @param id - Service ID
   * @param options - Operation options with auth context
   * @returns Service statistics
   */
  getServiceStatistics(
    id: number, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<ServiceStatisticsDto>;
  
  /**
   * Calculate price with VAT
   * 
   * @param id - Service ID
   * @param options - Operation options with auth context
   * @returns Price breakdown
   */
  getPriceWithVat(
    id: number, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<{
    basePrice: number;
    vatAmount: number;
    totalPrice: number;
  }>;
}
