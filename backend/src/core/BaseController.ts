import { Request, Response } from 'express';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { AuthenticatedRequest } from '../interfaces/IAuthTypes.js';
import { IBaseController } from '../interfaces/IBaseController.js';
import { IBaseService } from '../interfaces/IBaseService.js';
import { FilterCriteria, QueryOptions, SortOptions } from '../interfaces/IBaseRepository.js';

/**
 * BaseController
 * 
 * Abstract base class for all controllers with standard methods and error handling.
 * Implements the IBaseController interface and provides generic CRUD operations.
 * 
 * @template T - Entity type
 * @template C - Create DTO type
 * @template U - Update DTO type
 * @template R - Response DTO type
 * @template ID - Primary key type (default: number)
 */
export abstract class BaseController<T, C, U, R, ID = number> implements IBaseController<T, ID> {
  /**
   * Creates a new BaseController instance
   * 
   * @param service - Service for entity operations
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    protected readonly service: IBaseService<T, C, U, R, ID>,
    protected readonly logger: ILoggingService,
    protected readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug(`Initialized ${this.constructor.name}`);
    
    // Bind methods to preserve 'this' context
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.search = this.search.bind(this);
    this.bulkUpdate = this.bulkUpdate.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  /**
   * Get all entities with optional filtering and pagination
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      // Extract query parameters
      const options = this.extractQueryOptions(req);
      
      // Get entities from service
      const result = await this.service.getAll(options);
      
      // Send response
      this.sendPaginatedResponse(
        res,
        result.data,
        result.pagination,
        'Entities successfully retrieved'
      );
    } catch (error) {
      this.handleError(error, res, 'Error retrieving all entities');
    }
  }

  /**
   * Get entity by ID
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = this.extractIdParam(req);
      const options = this.extractQueryOptions(req);
      
      // Get entity from service
      const entity = await this.service.getById(id, options);
      
      if (!entity) {
        throw this.errorHandler.createNotFoundError(`Entity with ID ${id} not found`);
      }
      
      // Send response
      this.sendSuccessResponse(res, entity, 'Entity successfully retrieved');
    } catch (error) {
      this.handleError(error, res, 'Error retrieving entity');
    }
  }

  /**
   * Create new entity
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as C;
      const options = this.extractQueryOptions(req);
      
      // Create entity with context
      const entity = await this.service.create(data, {
        ...options,
        context: {
          ...options.context,
          userId: this.getAuthenticatedUser(req)?.id,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendCreatedResponse(res, entity, 'Entity successfully created');
    } catch (error) {
      this.handleError(error, res, 'Error creating entity');
    }
  }

  /**
   * Update existing entity
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.extractIdParam(req);
      const data = req.body as U;
      const options = this.extractQueryOptions(req);
      
      // Update entity with context
      const entity = await this.service.update(id, data, {
        ...options,
        context: {
          ...options.context,
          userId: this.getAuthenticatedUser(req)?.id,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendSuccessResponse(res, entity, 'Entity successfully updated');
    } catch (error) {
      this.handleError(error, res, 'Error updating entity');
    }
  }

  /**
   * Delete entity
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = this.extractIdParam(req);
      const options = this.extractQueryOptions(req);
      
      // Delete entity with context
      const success = await this.service.delete(id, {
        ...options,
        context: {
          ...options.context,
          userId: this.getAuthenticatedUser(req)?.id,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendSuccessResponse(
        res,
        { id, deleted: success },
        'Entity successfully deleted'
      );
    } catch (error) {
      this.handleError(error, res, 'Error deleting entity');
    }
  }

  /**
   * Search for entities
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const criteria = this.extractFilterCriteria(req);
      const options = this.extractQueryOptions(req);
      
      // Search for entities from service
      const entities = await this.service.findByCriteria(criteria, options);
      
      // Send response
      this.sendSuccessResponse(res, entities, 'Entities successfully found');
    } catch (error) {
      this.handleError(error, res, 'Error searching for entities');
    }
  }

  /**
   * Update multiple entities at once
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async bulkUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { ids, data } = req.body;
      const options = this.extractQueryOptions(req);
      
      // Validate input
      if (!Array.isArray(ids) || ids.length === 0) {
        throw this.errorHandler.createValidationError('Invalid IDs', ['IDs must be a non-empty array']);
      }
      
      if (!data || Object.keys(data).length === 0) {
        throw this.errorHandler.createValidationError('Invalid update data', ['Update data is required']);
      }
      
      // Call service to update entities
      const updatedCount = await this.service.bulkUpdate(ids, data as U, {
        ...options,
        context: {
          ...options.context,
          userId: this.getAuthenticatedUser(req)?.id,
          ipAddress: req.ip
        }
      });
      
      // Send success response
      this.sendSuccessResponse(
        res,
        {
          count: updatedCount,
          ids
        },
        `${updatedCount} entities successfully updated`
      );
    } catch (error) {
      this.handleError(error, res, 'Error bulk updating entities');
    }
  }

  /**
   * Optional: Export method for derived classes
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async export?(req: Request, res: Response): Promise<void>;

  /**
   * Handle and format errors
   * 
   * @param error - Error object
   * @param res - HTTP response
   * @param customMessage - Optional custom error message
   */
  handleError(error: any, res: Response, customMessage?: string): void {
    // Log with appropriate context
    this.logger.error(
      `Fehler in ${this.constructor.name}${customMessage ? `: ${customMessage}` : ''}`,
      error instanceof Error ? error : String(error)
    );
    
    // Process error and respond
    const errorResponse = this.errorHandler.handleError(error);
    const statusCode = errorResponse.statusCode || 500;
    
    res.status(statusCode).json(errorResponse);
  }

  /**
   * Extract ID parameter from request
   * 
   * @param req - HTTP request
   * @returns Entity ID
   */
  protected extractIdParam(req: Request): ID {
    return Number(req.params.id) as unknown as ID;
  }

  /**
   * Extract query parameters and convert to query options
   * 
   * @param req - HTTP request
   * @returns Query options for repository/service calls
   */
  extractQueryOptions(req: Request): QueryOptions {
    const { page, limit, select, relations, withDeleted, sort, ...rest } = req.query;
    
    const options: QueryOptions = {};
    
    // Pagination
    if (page) options.page = Number(page);
    if (limit) options.limit = Number(limit);
    
    // Field selection and relations
    if (select && typeof select === 'string') options.select = select.split(',');
    if (relations && typeof relations === 'string') options.relations = relations.split(',');
    
    // Include deleted entries
    if (withDeleted) options.withDeleted = withDeleted === 'true';
    
    // Sorting
    if (sort && typeof sort === 'string') {
      const [field, direction] = sort.split(':');
      options.sort = {
        field,
        direction: direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
      };
    }
    
    // Add authenticated user
    const user = this.getAuthenticatedUser(req);
    if (user) {
      options.context = {
        userId: user.id,
        userRole: user.role
      };
    }
    
    return options;
  }

  /**
   * Extract filter criteria from request
   * 
   * @param req - HTTP request
   * @returns Filter criteria for repository/service calls
   */
  extractFilterCriteria(req: Request): FilterCriteria {
    const { page, limit, select, relations, withDeleted, sort, ...filters } = req.query;
    
    // Handle search text specially
    const criteria: FilterCriteria = {};
    
    if (filters.search) {
      criteria.search = filters.search;
    }
    
    // Add remaining filters
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'search') {
        criteria[key] = value;
      }
    });
    
    return criteria;
  }

  /**
   * Send success response
   * 
   * @param res - HTTP response
   * @param data - Response data
   * @param message - Success message
   * @param statusCode - HTTP status code
   */
  protected sendSuccessResponse(
    res: Response,
    data: any,
    message: string = 'Operation successful',
    statusCode: number = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      data,
      message
    });
  }
  
  /**
   * Send "Created" response
   * 
   * @param res - HTTP response
   * @param data - Response data
   * @param message - Success message
   */
  protected sendCreatedResponse(
    res: Response,
    data: any,
    message: string = 'Resource successfully created'
  ): void {
    this.sendSuccessResponse(res, data, message, 201);
  }
  
  /**
   * Send paginated response
   * 
   * @param res - HTTP response
   * @param data - Response data
   * @param pagination - Pagination information
   * @param message - Success message
   * @param meta - Additional metadata
   */
  protected sendPaginatedResponse(
    res: Response,
    data: any[],
    pagination: any,
    message: string = 'Operation successful',
    meta: any = {}
  ): void {
    res.status(200).json({
      success: true,
      data,
      meta: {
        pagination,
        ...meta
      },
      message
    });
  }
  
  /**
   * Get authenticated user from request
   * 
   * @param req - HTTP request
   * @returns Authenticated user or null
   */
  protected getAuthenticatedUser(req: Request): AuthenticatedRequest['user'] | null {
    return (req as AuthenticatedRequest).user || null;
  }
}