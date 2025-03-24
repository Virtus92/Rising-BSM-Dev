/**
 * Base Repository
 * 
 * Generic base repository providing common CRUD operations with Prisma.
 * Serves as a foundation for specialized entity repositories.
 */
import { PrismaClient } from '@prisma/client';
import logger from './logger.js';
import { 
  FindOptions, 
  FindManyOptions, 
  CreateOptions, 
  UpdateOptions, 
  DeleteOptions, 
  FilterCriteria,
} from '../types/repository.types.js';
import { PaginationResult } from '../types/core.types.js';
import { DatabaseError, NotFoundError } from './error.utils.js';

/**
 * Base repository providing common database operations
 * @template T Entity type
 * @template TFilter Filter criteria type
 */
export class BaseRepository<T, TFilter extends FilterCriteria = FilterCriteria> {
  /**
   * Creates a new BaseRepository instance
   * @param prisma PrismaClient instance
   * @param model Prisma model to use
   */
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly model: any
  ) {}

  /**
   * Build where conditions from filter criteria
   * @param filters Filter criteria
   * @returns Prisma-compatible where conditions
   */
  protected buildFilterConditions(filters: TFilter): any {
    // Default implementation returns an empty object
    // Override in subclasses to implement specific filtering logic
    return {};
  }

  /**
   * Find all entities matching filter criteria
   * @param filters Filter criteria
   * @param options Query options
   * @returns Paginated results
   */
  async findAll(
    filters: TFilter = {} as TFilter,
    options: FindManyOptions = {}
  ): Promise<{ data: T[]; pagination: PaginationResult }> {
    try {
      const where = this.buildFilterConditions(filters);
      
      // Process pagination
      const page = Math.max(1, options.page || 1);
      const limit = Math.max(1, options.limit || 20);
      const skip = (page - 1) * limit;
      
      // Build order by
      const orderBy: any = {};
      if (options.orderBy) {
        if (Array.isArray(options.orderBy)) {
          return this.findAllWithMultiSort(filters, { ...options, page, limit, skip });
        } else {
          for (const [key, direction] of Object.entries(options.orderBy)) {
            orderBy[key] = direction;
          }
        }
      } else {
        // Default sorting by ID if not specified
        orderBy.id = 'desc';
      }
      
      // Execute count query to get total results
      const total = await this.model.count({ where });
      
      // Execute main query with pagination
      const data = await this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: options.include,
        select: options.select
      });
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const pagination: PaginationResult = {
        current: page,
        limit,
        total: totalPages,
        totalRecords: total
      };
      
      return { data, pagination };
    } catch (error) {
      logger.error('Error in BaseRepository.findAll', { error, entity: this.model.name, filters });
      throw new DatabaseError('Failed to fetch entities', { cause: error });
    }
  }

  /**
   * Find all entities with complex multi-column sorting
   * Private helper for findAll to handle multiple sort columns
   */
  private async findAllWithMultiSort(
    filters: TFilter,
    options: FindManyOptions & { page: number; limit: number; skip: number }
  ): Promise<{ data: T[]; pagination: PaginationResult }> {
    try {
      const where = this.buildFilterConditions(filters);
      const { page, limit, skip, orderBy } = options;
      
      // Multi-column sorting requires a different approach
      let orderByArray = [];
      if (Array.isArray(orderBy)) {
        for (const sortItem of orderBy) {
          for (const [key, direction] of Object.entries(sortItem)) {
            orderByArray.push({ [key]: direction });
          }
        }
      }
      
      // Execute count query to get total results
      const total = await this.model.count({ where });
      
      // Execute main query with pagination
      const data = await this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderByArray,
        include: options.include,
        select: options.select
      });
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const pagination: PaginationResult = {
        current: page,
        limit,
        total: totalPages,
        totalRecords: total
      };
      
      return { data, pagination };
    } catch (error) {
      logger.error('Error in BaseRepository.findAllWithMultiSort', { error, entity: this.model.name, filters });
      throw new DatabaseError('Failed to fetch entities with complex sorting', { cause: error });
    }
  }

  /**
   * Find entity by ID
   * @param id Entity ID
   * @param options Query options
   * @returns Entity or null if not found
   */
  async findById(id: number, options: FindOptions = {}): Promise<T | null> {
    try {
      const entity = await this.model.findUnique({
        where: { id },
        include: options.include,
        select: options.select
      });
      
      return entity;
    } catch (error) {
      logger.error('Error in BaseRepository.findById', { error, entity: this.model.name, id });
      throw new DatabaseError(`Failed to fetch entity with ID ${id}`, { cause: error });
    }
  }

  /**
   * Find entity by ID or throw error if not found
   * @param id Entity ID
   * @param options Query options
   * @returns Entity
   * @throws NotFoundError if entity not found
   */
  async findByIdOrThrow(id: number, options: FindOptions = {}): Promise<T> {
    const entity = await this.findById(id, options);
    
    if (!entity) {
      throw new NotFoundError(`Entity with ID ${id} not found`);
    }
    
    return entity;
  }

  /**
   * Find a single entity by custom criteria
   * @param where Where conditions
   * @param options Query options
   * @returns Entity or null if not found
   */
  async findOne(where: any, options: FindOptions = {}): Promise<T | null> {
    try {
      const entity = await this.model.findFirst({
        where,
        include: options.include,
        select: options.select,
        orderBy: options.orderBy
      });
      
      return entity;
    } catch (error) {
      logger.error('Error in BaseRepository.findOne', { error, entity: this.model.name, where });
      throw new DatabaseError('Failed to fetch entity', { cause: error });
    }
  }

  /**
   * Create a new entity
   * @param data Entity data
   * @param options Create options
   * @returns Created entity
   */
  async create(data: Partial<T>, options: CreateOptions = {}): Promise<T> {
    try {
      const entity = await this.model.create({
        data,
        include: options.include,
        select: options.select
      });
      
      return entity;
    } catch (error) {
      logger.error('Error in BaseRepository.create', { error, entity: this.model.name, data });
      throw new DatabaseError('Failed to create entity', { cause: error });
    }
  }

  /**
   * Update an existing entity
   * @param id Entity ID
   * @param data Updated entity data
   * @param options Update options
   * @returns Updated entity
   * @throws NotFoundError if entity not found and checkExists is true
   */
  async update(id: number, data: Partial<T>, options: UpdateOptions = {}): Promise<T> {
    try {
      // Check if entity exists if required
      if (options.checkExists) {
        const exists = await this.model.findUnique({ where: { id } });
        if (!exists) {
          throw new NotFoundError(`Entity with ID ${id} not found`);
        }
      }
      
      // Update entity
      const entity = await this.model.update({
        where: { id },
        data,
        include: options.include,
        select: options.select
      });
      
      return entity;
    } catch (error) {
      // If error is already a NotFoundError, rethrow it
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error in BaseRepository.update', { error, entity: this.model.name, id, data });
      throw new DatabaseError(`Failed to update entity with ID ${id}`, { cause: error });
    }
  }

  /**
   * Delete an entity
   * @param id Entity ID
   * @param options Delete options
   * @returns Deleted entity
   * @throws NotFoundError if entity not found and checkExists is true
   */
  async delete(id: number, options: DeleteOptions = {}): Promise<T> {
    try {
      // Check if entity exists if required
      if (options.checkExists) {
        const exists = await this.model.findUnique({ where: { id } });
        if (!exists) {
          throw new NotFoundError(`Entity with ID ${id} not found`);
        }
      }
      
      // Delete entity
      const entity = await this.model.delete({
        where: { id }
      });
      
      return entity;
    } catch (error) {
      // If error is already a NotFoundError, rethrow it
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error in BaseRepository.delete', { error, entity: this.model.name, id });
      throw new DatabaseError(`Failed to delete entity with ID ${id}`, { cause: error });
    }
  }

  /**
   * Count entities with filter
   * @param filters Filter criteria
   * @param options Count options
   * @returns Entity count
   */
  async count(filters: TFilter = {} as TFilter, options: any = {}): Promise<number> {
    try {
      const where = this.buildFilterConditions(filters);
      
      return this.model.count({
        where,
        distinct: options.distinct
      });
    } catch (error) {
      logger.error('Error in BaseRepository.count', { error, entity: this.model.name, filters });
      throw new DatabaseError('Failed to count entities', { cause: error });
    }
  }

  /**
   * Execute operations within a transaction
   * @param callback Transaction callback
   * @param options Transaction options
   * @returns Result of the callback
   */
  async transaction<R>(
    callback: (tx: any) => Promise<R>,
    options: any = {}
  ): Promise<R> {
    try {
      // Execute transaction with prisma.$transaction
      return await this.prisma.$transaction(async (tx) => {
        return callback(tx);
      }, {
        timeout: options.timeout,
        isolationLevel: options.isolationLevel
      });
    } catch (error) {
      logger.error('Error in BaseRepository.transaction', { error, entity: this.model.name });
      throw new DatabaseError('Transaction failed', { cause: error });
    }
  }
}