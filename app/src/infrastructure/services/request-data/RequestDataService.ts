import { BaseService } from '../BaseService';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult, QueryOptions } from '@/domain/repositories/IBaseRepository';
import { RequestData } from '@/domain/entities/RequestData';
import { 
  RequestDataDto, 
  CreateRequestDataDto,
  UpdateRequestDataDto,
  RequestDataHistoryDto,
  mapRequestDataToDto 
} from '@/domain/dtos/RequestDataDtos';
import { IRequestDataService } from '@/domain/services/IRequestDataService';

/**
 * Interface for the repository handling request data operations
 */
interface IRequestDataRepository {
  create(data: any): Promise<any>;
  update(id: number, data: any): Promise<any>;
  findById(id: number, options?: any): Promise<any>;
  findAll(options?: any): Promise<PaginationResult<any>>;
  findOne(options: { criteria: any }): Promise<any>;
  createHistory(data: any): Promise<any>;
  count(criteria?: any): Promise<number>;
  findByCriteria(criteria: any, options?: QueryOptions): Promise<any[]>;
  findOneByCriteria(criteria: any, options?: QueryOptions): Promise<any>;
  delete(id: number): Promise<boolean>;
  bulkUpdate(criteria: any, data: Partial<RequestData>): Promise<number>;
  transaction<T>(operation: () => Promise<T>): Promise<T>;
}

/**
 * Interface for the repository handling requests
 */
interface IRequestRepository {
  findById(id: number, options?: any): Promise<any>;
}

/**
 * Service for managing structured request data
 * @implements IRequestDataService
 */
export class RequestDataService extends BaseService<RequestData, CreateRequestDataDto, UpdateRequestDataDto, RequestDataDto, number> implements IRequestDataService {
  /**
   * Constructor
   * 
   * @param requestDataRepository - Repository for request data operations
   * @param requestRepository - Repository for request operations
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handling service
   */
  constructor(
    protected requestDataRepository: IRequestDataRepository,
    protected requestRepository: IRequestRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    // The RequestDataRepository implements IRequestDataRepository which extends IBaseRepository
    // This provides the required interface for BaseService
    super(requestDataRepository, logger, validator, errorHandler);
  }
  
  /**
   * Counts entities matching criteria
   * 
   * @param options - Service options
   * @returns Count of matching entities
   */
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    try {
      const criteria = options?.filters || {};
      return await this.requestDataRepository.count(criteria);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.count`, {
        error: error instanceof Error ? error.message : String(error),
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Find all request data with pagination and filtering
   * 
   * @param options - Service options
   * @returns Paginated list of request data
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<RequestDataDto>> {
    try {
      const queryOptions: any = {};
      
      if (options?.filters) {
        queryOptions.criteria = options.filters;
      }
      
      if (options?.page) queryOptions.page = options.page;
      if (options?.limit) queryOptions.limit = options.limit;
      if (options?.relations) queryOptions.relations = options.relations;
      if (options?.sort) queryOptions.sort = options.sort;
      
      const result = await this.requestDataRepository.findAll(queryOptions);
      
      return {
        data: result.data.map(item => this.mapToDTO(item)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findAll`, {
        error: error instanceof Error ? error.message : String(error),
        options
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Find request data by request ID and optional category
   * 
   * @param requestId - ID of the request
   * @param category - Optional category filter
   * @param options - Service options
   * @returns List of request data items
   */
  async findRequestData(
    requestId: number, 
    category?: string, 
    options?: ServiceOptions
  ): Promise<RequestDataDto[]> {
    try {
      // Build criteria
      const criteria: any = { requestId };
      if (category) criteria.category = category;
      
      // Get data with ordering
      const results = await this.requestDataRepository.findAll({
        criteria,
        orderBy: { order: 'asc' }
      });
      
      return results.data.map(data => this.mapToDTO(data));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findRequestData`, {
        error: error instanceof Error ? error.message : String(error),
        requestId,
        category
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Create new request data
   * 
   * @param data - Data to create
   * @param options - Service options
   * @returns Created data
   */
  /**
   * Create new request data
   * 
   * @param data - Data to create
   * @param options - Service options
   * @returns Created data
   */
  async createRequestData(data: CreateRequestDataDto, options?: ServiceOptions): Promise<RequestDataDto> {
    try {
      // Validate request exists
      const request = await this.requestRepository.findById(data.requestId);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${data.requestId} not found`);
      }
      
      // Prepare data with context information
      const createData = { ...data };
      
      // Add creator information using proper method of BaseService
      // This uses BaseService's audit info functionality
      
      // Use the create method from BaseService
      const requestData = await this.create(createData, options) as unknown as RequestData;
      
      return this.mapToDTO(requestData);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.createRequestData`, {
        error: error instanceof Error ? error.message : String(error),
        data
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Update request data with version history
   * 
   * @param id - ID of the data to update
   * @param data - Updated data
   * @param options - Service options
   * @returns Updated data
   */
  /**
   * Update request data with version history
   * 
   * @param id - ID of the data to update
   * @param data - Updated data
   * @param options - Service options
   * @returns Updated data
   */
  async updateRequestData(id: number, data: UpdateRequestDataDto, options?: ServiceOptions): Promise<RequestDataDto> {
    try {
      // Find existing data
      const existingData = await this.requestDataRepository.findById(id);
      if (!existingData) {
        throw this.errorHandler.createNotFoundError(`Request data with ID ${id} not found`);
      }
      
      // Create a history record before updating
      await this.requestDataRepository.createHistory({
        requestDataId: id,
        data: existingData.data,
        changedBy: data.processedBy || 'manual',
        changeReason: data.changeReason || 'Data update',
        version: existingData.version,
        userId: options?.context?.userId
      });
      
      // Set version for update
      const updateData: UpdateRequestDataDto = {
        ...data,
        version: existingData.version + 1
      };
      
      // Use BaseService's update method
      const updatedData = await this.update(id, updateData, options) as unknown as RequestData;
      
      return this.mapToDTO(updatedData);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.updateRequestData`, {
        error: error instanceof Error ? error.message : String(error),
        id,
        data
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Get data history for a specific request data item
   * 
   * @param id - ID of the request data
   * @param options - Service options
   * @returns History entries
   */
  async getRequestDataHistory(id: number, options?: ServiceOptions): Promise<RequestDataHistoryDto[]> {
    try {
      // Find existing data
      const existingData = await this.requestDataRepository.findById(id, {
        relations: ['history']
      });
      
      if (!existingData) {
        throw this.errorHandler.createNotFoundError(`Request data with ID ${id} not found`);
      }
      
      // Return history in reverse chronological order
      return existingData.history
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((history: any) => ({
          id: history.id,
          requestDataId: history.requestDataId,
          data: history.data,
          changedBy: history.changedBy,
          changeReason: history.changeReason,
          version: history.version,
          createdAt: history.createdAt.toISOString(),
          userId: history.userId
        }));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getRequestDataHistory`, {
        error: error instanceof Error ? error.message : String(error),
        id
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Implementation of abstract toDTO method from BaseService
   *
   * @param entity - Entity to convert to DTO
   * @returns Entity DTO
   */
  public toDTO(entity: RequestData): RequestDataDto {
    if (!entity) return null as any;
    
    return {
      id: entity.id,
      requestId: entity.requestId,
      category: entity.category,
      label: entity.label,
      order: entity.order,
      dataType: entity.dataType,
      data: entity.data,
      isValid: entity.isValid,
      processedBy: entity.processedBy,
      version: entity.version,
      createdById: entity.createdById,
      createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
      updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt || entity.createdAt
    };
  }
  
  /**
   * Map domain entity to DTO
   * 
   * @param entity - Entity to map
   * @returns Mapped DTO
   */
  public mapToDTO(entity: RequestData): RequestDataDto {
    return this.toDTO(entity);
  }
  
  /**
   * Convert DTO to entity
   * 
   * @param dto - DTO to convert
   * @param existingEntity - Optional existing entity for updates
   * @returns Entity representation
   */
  protected toEntity(dto: CreateRequestDataDto | UpdateRequestDataDto, existingEntity?: RequestData): Partial<RequestData> {
    // Start with an empty entity or clone the existing one
    let entity: Partial<RequestData>;
    if (existingEntity) {
      entity = { ...existingEntity };
    } else {
      entity = new RequestData();
    }
    
    // Handle CreateRequestDataDto (has required requestId)
    if ('requestId' in dto && dto.requestId !== undefined) {
      entity.requestId = dto.requestId;
      entity.category = dto.category;
      entity.label = dto.label;
      entity.order = dto.order ?? 0;
      entity.dataType = dto.dataType;
      entity.data = dto.data;
      entity.isValid = dto.isValid ?? true;
      entity.processedBy = dto.processedBy;
      entity.version = 1; // Initial version
    } 
    // Handle UpdateRequestDataDto (optional fields)
    else {
      if (dto.category !== undefined) entity.category = dto.category;
      if (dto.label !== undefined) entity.label = dto.label;
      if (dto.order !== undefined) entity.order = dto.order;
      if (dto.dataType !== undefined) entity.dataType = dto.dataType;
      if (dto.data !== undefined) entity.data = dto.data;
      if (dto.isValid !== undefined) entity.isValid = dto.isValid;
      if (dto.processedBy !== undefined) entity.processedBy = dto.processedBy;
      if ('version' in dto && dto.version !== undefined) entity.version = dto.version;
    }
    
    return entity;
  }
  
  /**
   * Get validation schema for create operations
   * 
   * @returns Validation schema
   */
  protected getCreateValidationSchema(): any {
    return {
      requestId: { type: 'number', required: true },
      category: { type: 'string', required: true },
      label: { type: 'string', required: true },
      dataType: { type: 'string', required: true },
      data: { type: 'object', required: true }
    };
  }
  
  /**
   * Get validation schema for update operations
   * 
   * @returns Validation schema
   */
  protected getUpdateValidationSchema(): any {
    return {
      category: { type: 'string', required: false },
      label: { type: 'string', required: false },
      order: { type: 'number', required: false },
      dataType: { type: 'string', required: false },
      data: { type: 'object', required: false },
      isValid: { type: 'boolean', required: false },
      processedBy: { type: 'string', required: false },
      version: { type: 'number', required: false }
    };
  }
}