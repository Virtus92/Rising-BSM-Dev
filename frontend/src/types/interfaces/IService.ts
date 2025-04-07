/**
 * Service options for context and metadata
 */
export interface ServiceOptions {
  /**
   * Context information
   */
  context?: {
    /**
     * User ID performing the operation
     */
    userId?: number;
    
    /**
     * IP address of the request
     */
    ipAddress?: string;
    
    /**
     * User agent information
     */
    userAgent?: string;
    
    /**
     * Additional context metadata
     */
    metadata?: Record<string, any>;
  };
  
  /**
   * Whether to validate the request data
   */
  validate?: boolean;
  
  /**
   * Whether to throw validation errors
   */
  throwOnError?: boolean;
}

/**
 * Base Service Interface
 * Defines common business operations for all services
 */
export interface IService<T, CreateDTO, UpdateDTO, ResponseDTO> {
  /**
   * Get all entities with optional filtering
   */
  getAll(options?: ServiceOptions): Promise<ResponseDTO[]>;
  
  /**
   * Get an entity by ID
   */
  getById(id: any, options?: ServiceOptions): Promise<ResponseDTO | null>;
  
  /**
   * Create a new entity
   */
  create(data: CreateDTO, options?: ServiceOptions): Promise<ResponseDTO>;
  
  /**
   * Update an existing entity
   */
  update(id: any, data: UpdateDTO, options?: ServiceOptions): Promise<ResponseDTO>;
  
  /**
   * Delete an entity
   */
  delete(id: any, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Find entities by criteria
   */
  findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<ResponseDTO[]>;
  
  /**
   * Validate data against schema
   */
  validate(data: any, isUpdate?: boolean): Promise<{
    valid: boolean;
    errors: string[];
  }>;
}
