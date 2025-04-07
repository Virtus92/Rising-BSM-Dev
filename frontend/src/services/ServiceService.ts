import { BaseService } from '../lib/core/BaseService.js';
import { IServiceService } from '../lib/interfaces/IServiceService.js';
import { IServiceRepository } from '../lib/interfaces/IServiceRepository.js';
import { Service } from '../entities/Service.js';
import { 
  ServiceCreateDto, 
  ServiceUpdateDto, 
  ServiceResponseDto, 
  ServiceStatusUpdateDto,
  ServiceFilterParams,
  ServiceStatisticsDto,
  serviceCreateValidationSchema,
  serviceUpdateValidationSchema
} from '../dtos/ServiceDtos.js';
import { ILoggingService } from '../lib/interfaces/ILoggingService.js';
import { IErrorHandler } from '../lib/interfaces/IErrorHandler.js';
import { IValidationService } from '../lib/interfaces/IValidationService.js';
import { PaginatedResult, ServiceOptions } from '../interfaces/IBaseService.js';

/**
 * Implementation of IServiceService for service operations.
 */
export class ServiceService extends BaseService<Service, ServiceCreateDto, ServiceUpdateDto, ServiceResponseDto> implements IServiceService {
  /**
   * Creates a new ServiceService instance
   * 
   * @param repository - Service repository
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly serviceRepository: IServiceRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    super(serviceRepository, logger, validator, errorHandler);
    
    this.logger.debug('Initialized ServiceService');
  }

  /**
   * Find services with filtering
   * 
   * @param filters - Filter parameters
   * @returns Promise with services and pagination info
   */
  async findServices(filters: ServiceFilterParams): Promise<PaginatedResult<ServiceResponseDto>> {
    try {
      // Validate filters using the validate method from IValidationService
      const filterSchema = {
        status: { type: 'string', enum: ['active', 'inactive'], required: false },
        search: { type: 'string', required: false },
        page: { type: 'number', min: 1, required: false },
        limit: { type: 'number', min: 1, max: 100, required: false },
        sortBy: { type: 'string', required: false },
        sortDirection: { type: 'string', enum: ['asc', 'desc'], required: false }
      };
      
      this.validator.validate(filters, filterSchema);
      
      // Find services
      const result = await this.serviceRepository.findServices(filters);
      
      // Map to response DTOs
      const data = result.data.map(service => this.toDTO(service));
      
      return {
        data,
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error in ServiceService.findServices', error instanceof Error ? error : String(error), { filters });
      throw this.handleError(error);
    }
  }

  /**
   * Find active services
   * 
   * @param limit - Maximum number of services to return
   * @param options - Service options
   * @returns Promise with services
   */
  async findActive(limit?: number, options?: ServiceOptions): Promise<ServiceResponseDto[]> {
    try {
      // Validate limit
      if (limit !== undefined) {
        const validationRule = { type: 'number', min: 1, max: 100 };
        this.validator.validate(limit, { value: validationRule });
      }
      
      // Find active services
      const services = await this.serviceRepository.findActive(limit);
      
      // Map to response DTOs
      return services.map(service => this.toDTO(service));
    } catch (error) {
      this.logger.error('Error in ServiceService.findActive', error instanceof Error ? error : String(error), { limit });
      throw this.handleError(error);
    }
  }

  /**
   * Toggle service active status
   * 
   * @param id - Service ID
   * @param statusData - Status update data
   * @param options - Service options
   * @returns Promise with updated service
   */
  async toggleStatus(id: number, statusData: ServiceStatusUpdateDto, options?: ServiceOptions): Promise<ServiceResponseDto> {
    try {
      // Validate status data
      const statusSchema = {
        active: { type: 'boolean', required: true }
      };
      
      this.validator.validate(statusData, statusSchema);
      
      // Get service to check if it exists
      const service = await this.serviceRepository.findById(id);
      if (!service) {
        throw this.errorHandler.createNotFoundError(`Service with ID ${id} not found`);
      }
      
      // Toggle status
      const updatedService = await this.serviceRepository.toggleStatus(id, statusData.active);
      
      // Map to response DTO
      return this.toDTO(updatedService);
    } catch (error) {
      this.logger.error('Error in ServiceService.toggleStatus', error instanceof Error ? error : String(error), { id, statusData });
      throw this.handleError(error);
    }
  }

  /**
   * Get service statistics
   * 
   * @param id - Service ID
   * @param options - Service options
   * @returns Promise with statistics
   */
  async getServiceStatistics(id: number, options?: ServiceOptions): Promise<ServiceStatisticsDto> {
    try {
      // Get service to check if it exists
      const service = await this.serviceRepository.findById(id);
      if (!service) {
        throw this.errorHandler.createNotFoundError(`Service with ID ${id} not found`);
      }
      
      // Get statistics
      const statistics = await this.serviceRepository.getStatistics(id);
      
      return statistics as ServiceStatisticsDto;
    } catch (error) {
      this.logger.error('Error in ServiceService.getServiceStatistics', error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Get price with VAT
   * 
   * @param id - Service ID
   * @param options - Service options
   * @returns Promise with price information
   */
  async getPriceWithVat(id: number, options?: ServiceOptions): Promise<{ basePrice: number; vatAmount: number; totalPrice: number }> {
    try {
      // Get service
      const service = await this.serviceRepository.findById(id);
      
      if (!service) {
        throw this.errorHandler.createNotFoundError(`Service with ID ${id} not found`);
      }
      
      // Calculate prices
      const basePrice = service.basePrice;
      const vatAmount = service.getVatAmount();
      const totalPrice = service.getPriceWithVat();
      
      return {
        basePrice,
        vatAmount,
        totalPrice
      };
    } catch (error) {
      this.logger.error('Error in ServiceService.getPriceWithVat', error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Map domain entity to response DTO
   * 
   * @param entity - Domain entity
   * @returns Response DTO
   */
  toDTO(entity: Service): ServiceResponseDto {
    if (!entity) {
      return null as any;
    }
    
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      basePrice: entity.basePrice,
      formattedBasePrice: entity.getFormattedBasePrice(),
      vatRate: entity.vatRate,
      active: entity.active,
      statusLabel: entity.getStatusLabel(),
      unit: entity.unit,
      priceWithUnit: entity.getPriceWithUnit(),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  /**
   * Map DTO to domain entity
   * 
   * @param dto - DTO data
   * @param existingEntity - Existing entity (for updates)
   * @returns Domain entity
   */
  protected toEntity(dto: ServiceCreateDto | ServiceUpdateDto, existingEntity?: Service): Partial<Service> {
    if (existingEntity) {
      // Handle update case
      const service: Partial<Service> = {};
      const updateDto = dto as ServiceUpdateDto;
      
      if (updateDto.name !== undefined) service.name = updateDto.name;
      if (updateDto.description !== undefined) service.description = updateDto.description;
      if (updateDto.basePrice !== undefined) service.basePrice = updateDto.basePrice;
      if (updateDto.vatRate !== undefined) service.vatRate = updateDto.vatRate;
      if (updateDto.active !== undefined) service.active = updateDto.active;
      if (updateDto.unit !== undefined) service.unit = updateDto.unit;
      
      return service;
    } else {
      // Handle create case
      const createDto = dto as ServiceCreateDto;
      
      return new Service({
        name: createDto.name,
        description: createDto.description,
        basePrice: createDto.basePrice,
        vatRate: createDto.vatRate !== undefined ? createDto.vatRate : 20, // Default VAT rate
        active: createDto.active !== undefined ? createDto.active : true,
        unit: createDto.unit
      });
    }
  }

  /**
   * Get validation schema for create operation
   */
  protected getCreateValidationSchema(): any {
    return serviceCreateValidationSchema;
  }

  /**
   * Get validation schema for update operation
   */
  protected getUpdateValidationSchema(): any {
    return serviceUpdateValidationSchema;
  }
}