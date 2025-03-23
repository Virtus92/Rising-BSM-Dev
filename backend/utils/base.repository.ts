/**
 * Base Repository
 * 
 * Generic base repository providing standardized CRUD operations and query building
 * for all domain entities. Implements a consistent interface for data access operations
 * with built-in pagination, filtering, and transaction support.
 */
import { PrismaClient } from '@prisma/client';
import { PaginationOptions, PaginationResult, FilterOptions } from '../types/controller.types.js';
import { DatabaseError, NotFoundError } from './errors.js';
import logger from './logger.js';

/**
 * Repository options for various operations
 */
export interface RepositoryOptions {
  /**
   * Whether to include soft-deleted records
   */
  includeDeleted?: boolean;
}

/**
 * Options for find operations
 */
export interface FindOptions extends RepositoryOptions {
  /**
   * Relations/models to include
   */
  include?: Record<string, boolean | object>;
  
  /**
   * Fields to select
   */
  select?: Record<string, boolean>;

  /**
   * Order by criteria
   */
  orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>;
}

/**
 * Options for findMany operations
 */
export interface FindManyOptions extends FindOptions {
  /**
   * Current page (1-based)
   */
  page?: number;
  
  /**
   * Items per page
   */
  limit?: number;
  
  /**
   * Number of items to skip
   */
  skip?: number;
  
  /**
   * Number of items to take
   */
  take?: number;
}

/**
 * Options for create operations
 */
export interface CreateOptions extends RepositoryOptions {
  /**
   * Relations/models to include in the result
   */
  include?: Record<string, boolean | object>;
  
  /**
   * Fields to select in the result
   */
  select?: Record<string, boolean>;
}

/**
 * Options for update operations
 */
export interface UpdateOptions extends RepositoryOptions {
  /**
   * Relations/models to include in the result
   */
  include?: Record<string, boolean | object>;
  
  /**
   * Fields to select in the result
   */
  select?: Record<string, boolean>;
  
  /**
   * Whether to check if the entity exists before updating
   */
  checkExists?: boolean;
}

/**
 * Options for delete operations
 */
export interface DeleteOptions extends RepositoryOptions {
  /**
   * Whether to check if the entity exists before deleting
   */
  checkExists?: boolean;
}

/**
 * Abstract base repository providing common data access operations
 * @template T - Entity type
 * @template TFilter - Filter criteria type
 */
export abstract class BaseRepository<T, TFilter extends FilterOptions = FilterOptions> {
  /**
   * Creates a new repository instance
   * @param prisma - PrismaClient instance
   * @param model - Prisma model to operate on
   */
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly model: any
  ) {}

  /**
   * Find all records with filtering and pagination
   * @param filters - Filter criteria
   * @param options - Query options including pagination, ordering, etc.
   * @returns Paginated list of entities with metadata
   */
  async findAll(
    filters: TFilter,
    options: FindManyOptions = {}
  ): Promise<{ data: T[]; pagination: PaginationResult }> {
    try {
      const { 
        page = 1, 
        limit = 20,
        include = {},
        orderBy = { id: 'desc' as const }
      } = options;

      // Apply pagination
      const pageNumber = Math.max(1, Number(page));
      const pageSize = Math.min(100, Math.max(1, Number(limit)));
      const skip = (pageNumber - 1) * pageSize;

      // Build query conditions
      const where = this.buildFilterConditions(filters);

      // Execute queries in parallel for better performance
      const [data, totalCount] = await Promise.all([
        this.model.findMany({
          where,
          include,
          orderBy,
          take: pageSize,
          skip
        }),
        this.model.count({ where })
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data,
        pagination: {
          current: pageNumber,
          limit: pageSize,
          total: totalPages,
          totalRecords: totalCount
        }
      };
    } catch (error) {
      logger.error('Error in BaseRepository.findAll', { 
        modelName: this.model.name, 
        error, 
        filters 
      });
      throw new DatabaseError('Failed to fetch records', { cause: error });
    }
  }

  /**
   * Find a single record by ID
   * @param id - Record ID
   * @param options - Query options
   * @returns Entity or null if not found
   */
  async findById(id: number, options: FindOptions = {}): Promise<T | null> {
    try {
      const { include = {} } = options;

      return this.model.findUnique({
        where: { id },
        include
      });
    } catch (error) {
      logger.error('Error in BaseRepository.findById', { 
        modelName: this.model.name, 
        error, 
        id 
      });
      throw new DatabaseError(`Failed to fetch record by ID: ${id}`, { cause: error });
    }
  }

  /**
   * Find a single record by ID with error handling
   * @param id - Record ID
   * @param options - Query options
   * @returns Entity
   * @throws NotFoundError if entity doesn't exist
   */
  async findByIdOrThrow(id: number, options: FindOptions = {}): Promise<T> {
    const entity = await this.findById(id, options);

    if (!entity) {
      throw new NotFoundError(
        `Entity with ID ${id} not found`,
        { entityId: id, entityName: this.model.name }
      );
    }

    return entity;
  }

  /**
   * Find a single record by custom criteria
   * @param where - Where conditions
   * @param options - Query options
   * @returns Entity or null if not found
   */
  async findOne(where: any, options: FindOptions = {}): Promise<T | null> {
    try {
      const { include = {} } = options;

      return this.model.findFirst({
        where,
        include
      });
    } catch (error) {
      logger.error('Error in BaseRepository.findOne', { 
        modelName: this.model.name, 
        error, 
        where 
      });
      throw new DatabaseError('Failed to fetch record', { cause: error });
    }
  }

  /**
   * Find a single record by custom criteria with error handling
   * @param where - Where conditions
   * @param options - Query options
   * @returns Entity
   * @throws NotFoundError if entity doesn't exist
   */
  async findOneOrThrow(where: any, options: FindOptions = {}): Promise<T> {
    const entity = await this.findOne(where, options);

    if (!entity) {
      throw new NotFoundError(
        `Entity not found`,
        { criteria: where, entityName: this.model.name }
      );
    }

    return entity;
  }

  /**
   * Create a new record
   * @param data - Entity data
   * @param options - Creation options
   * @returns Created entity
   */
  async create(data: any, options: CreateOptions = {}): Promise<T> {
    try {
      const { include = {} } = options;

      return this.model.create({
        data,
        include
      });
    } catch (error) {
      logger.error('Error in BaseRepository.create', { 
        modelName: this.model.name, 
        error 
      });
      throw new DatabaseError('Failed to create record', { cause: error });
    }
  }

  /**
   * Update a record by ID
   * @param id - Record ID
   * @param data - Update data
   * @param options - Update options
   * @returns Updated entity
   * @throws NotFoundError if entity doesn't exist
   */
  async update(id: number, data: any, options: UpdateOptions = {}): Promise<T> {
    try {
      const { include = {}, checkExists = true } = options;

      // Check if record exists before updating
      if (checkExists) {
        await this.findByIdOrThrow(id);
      }

      // Ensure updatedAt is set
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      return this.model.update({
        where: { id },
        data: updateData,
        include
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error in BaseRepository.update', { 
        modelName: this.model.name, 
        error, 
        id 
      });
      throw new DatabaseError(`Failed to update record with ID: ${id}`, { cause: error });
    }
  }

  /**
   * Delete a record by ID
   * @param id - Record ID
   * @param options - Delete options
   * @returns Deleted entity
   * @throws NotFoundError if entity doesn't exist
   */
  async delete(id: number, options: DeleteOptions = {}): Promise<T> {
    try {
      const { checkExists = true } = options;

      // Check if record exists before deleting
      if (checkExists) {
        await this.findByIdOrThrow(id);
      }

      return this.model.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error in BaseRepository.delete', { 
        modelName: this.model.name, 
        error, 
        id 
      });
      throw new DatabaseError(`Failed to delete record with ID: ${id}`, { cause: error });
    }
  }

  /**
   * Soft delete a record by ID (mark as deleted)
   * @param id - Record ID
   * @param options - Delete options
   * @returns Updated entity
   * @throws NotFoundError if entity doesn't exist
   */
  async softDelete(id: number, options: DeleteOptions = {}): Promise<T> {
    try {
      const { checkExists = true } = options;

      // Check if record exists before soft deleting
      if (checkExists) {
        await this.findByIdOrThrow(id);
      }

      // Mark as deleted instead of actual deletion
      return this.model.update({
        where: { id },
        data: {
          status: 'deleted',
          updatedAt: new Date()
        }
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error in BaseRepository.softDelete', { 
        modelName: this.model.name, 
        error, 
        id 
      });
      throw new DatabaseError(`Failed to soft delete record with ID: ${id}`, { cause: error });
    }
  }

  /**
   * Count records with optional filtering
   * @param filters - Filter criteria
   * @returns Count of matching records
   */
  async count(filters: TFilter = {} as TFilter): Promise<number> {
    try {
      const where = this.buildFilterConditions(filters);
      return this.model.count({ where });
    } catch (error) {
      logger.error('Error in BaseRepository.count', { 
        modelName: this.model.name, 
        error, 
        filters 
      });
      throw new DatabaseError('Failed to count records', { cause: error });
    }
  }

  /**
   * Execute operations within a transaction
   * @param callback - Function to execute within transaction
   * @returns Result of callback
   */
  async transaction<R>(callback: (tx: any) => Promise<R>): Promise<R> {
    try {
      return await this.prisma.$transaction(callback);
    } catch (error) {
      logger.error('Error in BaseRepository.transaction', { 
        modelName: this.model.name, 
        error 
      });
      throw new DatabaseError('Transaction failed', { cause: error });
    }
  }

  /**
   * Build query conditions from filter criteria
   * Must be implemented by each repository subclass
   * @param filters - Filter criteria
   * @returns Prisma-compatible where conditions
   */
  protected abstract buildFilterConditions(filters: TFilter): any;
}