import { IActivityLogService } from '@/domain/services/IActivityLogService';
import { IActivityLogRepository } from '@/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/domain/entities/ActivityLog';
import { ActivityLogDto } from '@/domain/dtos/ActivityLogDto';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IValidationService } from '@/core/validation/IValidationService';
import { IErrorHandler } from '@/core/errors';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { EntityType } from '@/domain/enums/EntityTypes';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

/**
 * Base service implementation that ActivityLogService will extend
 */
class BaseService<TEntity, TCreateDto, TUpdateDto, TResponseDto> {
  constructor(
    protected readonly repository: any,
    protected readonly logger: ILoggingService,
    protected readonly validator: IValidationService,
    protected readonly errorHandler: IErrorHandler
  ) {}

  /**
   * Convert service options to repository options
   */
  protected mapToRepositoryOptions(options?: ServiceOptions): any {
    const repoOptions: any = {
      page: options?.filters?.page || 1,
      limit: options?.filters?.limit || 10
    };
    
    if (options?.filters?.orderBy) {
      repoOptions.orderBy = options.filters.orderBy;
    }
    
    if (options?.filters?.orderDirection) {
      repoOptions.orderDirection = options.filters.orderDirection;
    }
    
    return repoOptions;
  }

  /**
   * Handle errors consistently
   */
  protected handleError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    
    return new Error(typeof error === 'string' ? error : 'Unknown error');
  }
}

/**
 * Service for activity logs
 */
export class ActivityLogService extends BaseService<
  ActivityLog,
  Partial<ActivityLog>,
  Partial<ActivityLog>,
  ActivityLogDto
> implements IActivityLogService {
  /**
   * Constructor
   * 
   * @param repository - Repository for data access
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handling service
   */
  constructor(
    protected readonly activityLogRepository: IActivityLogRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    super(activityLogRepository, logger, validator, errorHandler);
    
    this.logger.debug('Initialized ActivityLogService');
  }

  /**
   * Gets the repository instance
   * This allows direct repository access when needed for specific operations
   * 
   * @returns The repository instance
   */
  getRepository(): IActivityLogRepository {
    return this.activityLogRepository;
  }

  /**
   * Count activity logs with optional filtering
   * 
   * @param options Options with filters
   * @returns Number of logs matching criteria
   */
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    try {
      const criteria: Record<string, any> = {};
      
      if (options?.filters) {
        if (options.filters.entityType) {
          criteria.entityType = options.filters.entityType;
        }
        
        if (options.filters.entityId) {
          criteria.entityId = options.filters.entityId;
        }
        
        if (options.filters.userId) {
          criteria.userId = options.filters.userId;
        }
        
        if (options.filters.action) {
          criteria.action = options.filters.action;
        }
        
        if (options.filters.startDate && options.filters.endDate) {
          criteria.createdAtRange = {
            start: options.filters.startDate,
            end: options.filters.endDate
          };
        }
      }
      
      return await this.repository.count(criteria);
    } catch (error) {
      this.logger.error('Error in ActivityLogService.count', { 
        error, 
        filters: options?.filters 
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Find all activity logs with pagination and filtering
   * 
   * @param options Service options including pagination and filters
   * @returns Paginated results
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<ActivityLogDto>> {
    try {
      // Convert service options to repository options
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Add filter criteria if provided in options
      if (options?.filters) {
        repoOptions.criteria = {};
        
        if (options.filters.entityType) {
          repoOptions.criteria.entityType = options.filters.entityType;
        }
        
        if (options.filters.entityId) {
          repoOptions.criteria.entityId = options.filters.entityId;
        }
        
        if (options.filters.userId) {
          repoOptions.criteria.userId = options.filters.userId;
        }
        
        if (options.filters.action) {
          repoOptions.criteria.action = options.filters.action;
        }
        
        if (options.filters.startDate && options.filters.endDate) {
          repoOptions.criteria.createdAtRange = {
            start: options.filters.startDate,
            end: options.filters.endDate
          };
        } else if (options.filters.startDate) {
          repoOptions.criteria.createdAtAfter = options.filters.startDate;
        } else if (options.filters.endDate) {
          repoOptions.criteria.createdAtBefore = options.filters.endDate;
        }
      }
      
      // Get logs from repository
      const result = await this.repository.findAll(repoOptions);
      
      // Map entities to DTOs
      return {
        data: result.data.map((log: ActivityLog) => this.toDTO(log)),
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
   * Creates a new log entry
   * 
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @param userId - User ID
   * @param action - Action type
   * @param details - Details
   * @param options - Service options
   * @returns Created log entry
   */
  async createLog(
    entityType: EntityType,
    entityId: number,
    userId: number | undefined,
    action: string,
    details?: Record<string, any>,
    options?: ServiceOptions
  ): Promise<ActivityLogDto> {
    try {
      this.logger.debug(`Creating activity log for ${entityType} ${entityId}, action: ${action}`);
      
      // Create the log entry
      const activityLog = await this.activityLogRepository.createLog(
        entityType,
        entityId,
        userId,
        action,
        details
      );
      
      // Convert to DTO
      return this.toDTO(activityLog);
    } catch (error) {
      this.logger.error('Error in ActivityLogService.createLog', { 
        error, 
        entityType, 
        entityId, 
        action 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Finds log entries for a specific entity
   * 
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @param options - Service options
   * @returns Log entries
   */
  async findByEntity(
    entityType: EntityType, 
    entityId: number, 
    options?: ServiceOptions
  ): Promise<ActivityLogDto[]> {
    try {
      const logs = await this.activityLogRepository.findByEntity(entityType, entityId);
      return logs.map((log: ActivityLog) => this.toDTO(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogService.findByEntity', { 
        error, 
        entityType, 
        entityId 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Finds log entries for a user
   * 
   * @param userId - User ID
   * @param limit - Maximum number of results
   * @param options - Service options
   * @returns Log entries
   */
  async findByUser(
    userId: number, 
    limit?: number, 
    options?: ServiceOptions
  ): Promise<ActivityLogDto[]> {
    try {
      const logs = await this.activityLogRepository.findByUser(userId, limit);
      return logs.map((log: ActivityLog) => this.toDTO(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogService.findByUser', { 
        error, 
        userId
      });
      throw this.handleError(error);
    }
  }

  /**
   * Finds log entries for a specific action
   * 
   * @param action - Action type
   * @param limit - Maximum number of results
   * @param options - Service options
   * @returns Log entries
   */
  async findByAction(
    action: string, 
    limit?: number, 
    options?: ServiceOptions
  ): Promise<ActivityLogDto[]> {
    try {
      const logs = await this.activityLogRepository.findByAction(action, limit);
      return logs.map((log: ActivityLog) => this.toDTO(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogService.findByAction', { 
        error, 
        action
      });
      throw this.handleError(error);
    }
  }

  /**
   * Finds the latest log entries
   * 
   * @param limit - Maximum number of results
   * @param options - Service options
   * @returns Latest log entries
   */
  async getLatest(
    limit?: number, 
    options?: ServiceOptions
  ): Promise<ActivityLogDto[]> {
    try {
      const logs = await this.activityLogRepository.findLatest(limit);
      return logs.map((log: ActivityLog) => this.toDTO(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogService.getLatest', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Deletes all log entries for a specific entity
   * 
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @param options - Service options
   * @returns Number of deleted entries
   */
  async deleteByEntity(
    entityType: EntityType, 
    entityId: number, 
    options?: ServiceOptions
  ): Promise<number> {
    try {
      return await this.activityLogRepository.deleteByEntity(entityType, entityId);
    } catch (error) {
      this.logger.error('Error in ActivityLogService.deleteByEntity', { 
        error, 
        entityType, 
        entityId 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Cleans up old log entries
   * 
   * @param olderThan - Date before which entries should be deleted
   * @param options - Service options
   * @returns Number of deleted entries
   */
  async cleanupOldLogs(
    olderThan: Date, 
    options?: ServiceOptions
  ): Promise<number> {
    try {
      this.logger.info(`Cleaning up activity logs older than ${olderThan}`);
      return await this.activityLogRepository.deleteOldLogs(olderThan);
    } catch (error) {
      this.logger.error('Error in ActivityLogService.cleanupOldLogs', { 
        error, 
        olderThan 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Searches log entries
   * 
   * @param searchText - Search term
   * @param filters - Filter options
   * @param options - Service options
   * @returns Found log entries with pagination
   */
  async searchLogs(
    searchText: string,
    filters?: {
      entityType?: EntityType;
      userId?: number;
      startDate?: Date;
      endDate?: Date;
      actions?: string[];
    },
    options?: ServiceOptions
  ): Promise<PaginationResult<ActivityLogDto>> {
    try {
      const result = await this.activityLogRepository.searchLogs(searchText, filters);
      
      return {
        data: result.data.map((log: ActivityLog) => this.toDTO(log)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error in ActivityLogService.searchLogs', { 
        error, 
        searchText, 
        filters 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Maps an entity to a response DTO
   * 
   * @param entity - Entity to map
   * @returns Response DTO
   */
  toDTO(entity: ActivityLog): ActivityLogDto {
    if (!entity) {
      throw new Error('Cannot convert null or undefined ActivityLog to DTO');
    }
    
    return {
      id: entity.id,
      entityType: entity.entityType,
      entityId: entity.entityId,
      userId: entity.userId,
      action: entity.action,
      details: entity.details,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt?.toISOString() || entity.createdAt.toISOString(),
      // Format date for display
      formattedDate: this.formatDate(entity.createdAt)
    };
  }

  /**
   * Converts a DTO to an entity
   * 
   * @param dto - DTO
   * @returns Entity
   */
  fromDTO(dto: Partial<ActivityLog>): Partial<ActivityLog> {
    if (!dto) {
      throw new Error('Cannot convert null or undefined DTO to ActivityLog');
    }
    
    return {
      id: dto.id,
      entityType: dto.entityType,
      entityId: dto.entityId,
      userId: dto.userId,
      action: dto.action,
      details: dto.details,
      createdAt: dto.createdAt instanceof Date ? dto.createdAt : new Date(dto.createdAt || Date.now()),
      updatedAt: dto.updatedAt instanceof Date ? dto.updatedAt : new Date(dto.updatedAt || Date.now())
    };
  }

  /**
   * Maps a DTO to an entity
   * 
   * @param dto - DTO data
   * @param existingEntity - Existing entity (for updates)
   * @returns Entity data
   */
  protected toEntity(
    dto: Partial<ActivityLog>,
    existingEntity?: ActivityLog
  ): Partial<ActivityLog> {
    // For activity logs, there are no updates, only creations
    return {
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Returns the validation schema for creation
   */
  protected getCreateValidationSchema(): any {
    return {
      type: 'object',
      required: ['entityType', 'entityId', 'action'],
      properties: {
        entityType: { type: 'string', enum: Object.values(EntityType) },
        entityId: { type: 'number', minimum: 1 },
        userId: { type: 'number', minimum: 1 },
        action: { type: 'string', minLength: 1 },
        details: { type: 'object' }
      }
    };
  }

  /**
   * Returns the validation schema for updates
   */
  protected getUpdateValidationSchema(): any {
    // Activity logs are not updated
    return this.getCreateValidationSchema();
  }

  /**
   * Formats a date
   * 
   * @param date - Date to format
   * @returns Formatted date
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get all entities (BaseService method implementation)
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<ActivityLogDto>> {
    return this.findAll(options);
  }

  /**
   * Get entity by ID (BaseService method implementation)
   */
  async getById(id: number, options?: ServiceOptions): Promise<ActivityLogDto | null> {
    try {
      const entity = await this.repository.findById(id);
      if (!entity) return null;
      return this.toDTO(entity);
    } catch (error) {
      this.logger.error('Error in getById', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Create entity (BaseService method implementation)
   */
  async create(data: Partial<ActivityLog>, options?: ServiceOptions): Promise<ActivityLogDto> {
    try {
      // Create entity
      const entity = await this.repository.create(data);
      return this.toDTO(entity);
    } catch (error) {
      this.logger.error('Error in create', { error, data });
      throw this.handleError(error);
    }
  }

  /**
   * Update entity (BaseService method implementation)
   */
  async update(id: number, data: Partial<ActivityLog>, options?: ServiceOptions): Promise<ActivityLogDto> {
    try {
      // Activity logs are not updated
      throw new Error('Activity logs cannot be updated');
    } catch (error) {
      this.logger.error('Error in update', { error, id, data });
      throw this.handleError(error);
    }
  }

  /**
   * Delete entity (BaseService method implementation)
   */
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      this.logger.error('Error in delete', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Implementation of required BaseService methods
   */
  async search(term: string, options?: ServiceOptions): Promise<ActivityLogDto[]> {
    try {
      const result = await this.repository.search(term);
      return result.map((entity: ActivityLog) => this.toDTO(entity));
    } catch (error) {
      this.logger.error('Error in search', { error, term });
      throw this.handleError(error);
    }
  }

  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      return await this.repository.exists(id);
    } catch (error) {
      this.logger.error('Error in exists', { error, id });
      throw this.handleError(error);
    }
  }

  async existsByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<boolean> {
    try {
      return await this.repository.existsByCriteria(criteria);
    } catch (error) {
      this.logger.error('Error in existsByCriteria', { error, criteria });
      throw this.handleError(error);
    }
  }

  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<ActivityLogDto[]> {
    try {
      const entities = await this.repository.findByCriteria(criteria);
      return entities.map((entity: ActivityLog) => this.toDTO(entity));
    } catch (error) {
      this.logger.error('Error in findByCriteria', { error, criteria });
      throw this.handleError(error);
    }
  }

  async validate(data: any, schema: any): Promise<any> {
    return this.validator.validate(data, schema);
  }

  async transaction<T>(callback: (service: any) => Promise<T>, context?: any): Promise<T> {
    return callback(this);
  }

  async bulkUpdate(ids: number[], data: Partial<ActivityLog>): Promise<number> {
    // Not implemented for activity logs
    return 0;
  }
}