import { PaginationResult } from '../repositories/IBaseRepository';

/**
 * Service Options
 */
export interface ServiceOptions {
  /**
   * Operation context
   */
  context?: {
    /**
     * User ID
     */
    userId?: number;
    
    /**
     * IP Address
     */
    ipAddress?: string;
    
    /**
     * Custom data
     */
    [key: string]: any;
  };
  
  /**
   * Relations to load
   */
  relations?: string[];
  
  /**
   * Include deleted entries
   */
  withDeleted?: boolean;

  /**
   * Pagination page
   */
  page?: number;

  /**
   * Items per page
   */
  limit?: number;

  /**
   * Filter parameters
   */
  filters?: Record<string, any>;

  /**
   * Sort parameters
   */
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
    order?: string; // For compatibility with some APIs
  };
  
  /**
   * Number of days to include in date range queries
   */
  days?: number;
  
  /**
   * User ID performing the operation (shorthand for context.userId)
   */
  userId?: number;
  
  /**
   * IP address of the client (shorthand for context.ipAddress)
   */
  ip?: string;
  
  /**
   * Include activity logs in responses
   */
  includeActivity?: boolean;
  
  /**
   * Perform hard delete instead of soft delete
   */
  hardDelete?: boolean;

  /**
   * Timeout for the operation
   **/
  timeout?: number;

  /**
   * Custom params
   */
  params?: Record<string, any>;
}

/**
 * Service Error
 */
export class ServiceError extends Error {
  /**
   * Error code
   */
  code: string;
  
  /**
   * Status code
   */
  statusCode: number;
  
  /**
   * Error data
   */
  data?: any;
  
  /**
   * Constructor
   * 
   * @param message - Error message
   * @param code - Error code
   * @param statusCode - Status code
   * @param data - Error data
   */
  constructor(message: string, code: string, statusCode: number = 400, data?: any) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Base Service Interface
 * 
 * Defines common business operations for all entities.
 * 
 * @template T - Entity type
 * @template C - Create DTO type
 * @template U - Update DTO type
 * @template R - Response DTO type
 * @template ID - Primary key type
 */
export interface IBaseService<T, C, U, R, ID = number> {
  /**
   * Count entities with optional filtering
   * 
   * @param options - Service options with filters
   * @returns Number of entities matching criteria or object with count property
   */
  count(options?: { context?: any; filters?: Record<string, any> }): Promise<number | { count: number }>;

  /**
   * Get all entities
   * 
   * @param options - Service options
   * @returns Entities with pagination
   * @throws ServiceError - On errors
   */
  getAll(options?: ServiceOptions): Promise<PaginationResult<R>>;
  
  /**
   * Get an entity by its ID
   * 
   * @param id - Entity ID
   * @param options - Service options
   * @returns Found entity or null
   * @throws ServiceError - On errors
   */
  getById(id: ID, options?: ServiceOptions): Promise<R | null>;
  
  /**
   * Create a new entity
   * 
   * @param data - Creation data
   * @param options - Service options
   * @returns Created entity
   * @throws ServiceError - On errors
   */
  create(data: C, options?: ServiceOptions): Promise<R>;
  
  /**
   * Update an existing entity
   * 
   * @param id - Entity ID
   * @param data - Update data
   * @param options - Service options
   * @returns Updated entity
   * @throws ServiceError - On errors
   */
  update(id: ID, data: U, options?: ServiceOptions): Promise<R>;
  
  /**
   * Delete an entity
   * 
   * @param id - Entity ID
   * @param options - Service options
   * @returns Operation success
   * @throws ServiceError - On errors
   */
  delete(id: ID, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Find entities by criteria
   * 
   * @param criteria - Filter criteria
   * @param options - Service options
   * @returns Found entities
   * @throws ServiceError - On errors
   */
  findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<R[]>;
  
  /**
   * Validate data
   * 
   * @param data - Data to validate
   * @param isUpdate - Whether it's an update
   * @param entityId - Entity ID (for updates)
   * @returns Validation result
   * @throws ServiceError - On validation errors
   */
  validate(data: C | U, isUpdate?: boolean, entityId?: number): Promise<import('../dtos/ValidationDto').ValidationResultDto>;
  
  /**
   * Execute a transaction
   * 
   * @param callback - Callback function
   * @returns Transaction result
   * @throws ServiceError - On errors
   */
  transaction<r>(callback: (service: IBaseService<T, C, U, R, ID>) => Promise<r>): Promise<r>;
  
  /**
   * Perform a bulk update
   * 
   * @param ids - Entity IDs
   * @param data - Update data
   * @param options - Service options
   * @returns Number of updated entities
   * @throws ServiceError - On errors
   */
  bulkUpdate(ids: ID[], data: U, options?: ServiceOptions): Promise<number>;
  
  /**
   * Convert an entity to a response DTO
   * 
   * @param entity - Entity
   * @returns Response DTO
   */
  toDTO(entity: T): R;
  
  /**
   * Convert a DTO to an entity
   * 
   * @param dto - DTO
   * @returns Entity
   */
  fromDTO(dto: C | U): Partial<T>;
  
  /**
   * Advanced search
   * 
   * @param searchText - Search term
   * @param options - Service options
   * @returns Search results
   * @throws ServiceError - On errors
   */
  search(searchText: string, options?: ServiceOptions): Promise<R[]>;
  
  /**
   * Check if an entity exists
   * 
   * @param id - Entity ID
   * @param options - Service options
   * @returns Whether the entity exists
   */
  exists(id: ID, options?: ServiceOptions): Promise<boolean>;

  /**
   * Get access to the repository
   * @returns The repository instance
   */
  getRepository(): any;

  /**
   * Find all entries with pagination and filtering
   * @param options Service options including pagination and filters
   * @returns Paginated results
   */
  findAll(options?: ServiceOptions): Promise<PaginationResult<R>>;
}