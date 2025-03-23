import { PrismaClient } from '@prisma/client';
import { FilterOptions } from '../types/controller.types.js';
import { DatabaseError } from './errors.js';
import logger from './logger.js';

/**
 * Base repository class providing common data access methods
 * @template T - Entity type
 * @template F - Filter type (defaults to FilterOptions)
 */
export abstract class BaseRepository<T, F = FilterOptions> {
  /**
   * Creates a new BaseRepository instance
   * @param prisma - PrismaClient instance
   * @param model - Prisma model for the entity
   */
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly model: any
  ) {}

  /**
   * Build filter conditions for queries
   * @param filters - Filter criteria
   * @returns Prisma-compatible where conditions
   */
  protected abstract buildFilterConditions(filters: F): any;

  /**
   * Find all entities matching filters
   * @param filters - Filter criteria
   * @param options - Query options
   * @returns Paginated list of entities
   */
  async findAll(
    filters: F,
    options: {
      page?: number;
      limit?: number;
      orderBy?: any;
      include?: any;
    } = {}
  ): Promise<{ data: T[]; pagination: any }> {
    try {
      const { page = 1, limit = 10, orderBy, include } = options;
      const skip = (page - 1) * limit;
      
      // Build where conditions from filters
      const where = this.buildFilterConditions(filters);
      
      // Execute count query
      const total = await this.model.count({ where });
      
      // Execute find query
      const data = await this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include
      });
      
      // Calculate pagination metadata
      const lastPage = Math.ceil(total / limit);
      
      return {
        data,
        pagination: {
          total,
          lastPage,
          currentPage: page,
          perPage: limit,
          prev: page > 1 ? page - 1 : null,
          next: page < lastPage ? page + 1 : null
        }
      };
    } catch (error) {
      logger.error('Error in BaseRepository.findAll', { entity: this.model.name, error, filters });
      throw new DatabaseError('Failed to fetch records', { cause: error });
    }
  }

  /**
   * Find entity by ID
   * @param id - Entity ID
   * @param options - Query options
   * @returns Entity or null if not found
   */
  async findById(id: number, options: any = {}): Promise<T | null> {
    try {
      return this.model.findUnique({
        where: { id },
        ...options
      });
    } catch (error) {
      logger.error('Error in BaseRepository.findById', { entity: this.model.name, error, id });
      throw new DatabaseError(`Failed to fetch record with ID ${id}`, { cause: error });
    }
  }

  /**
   * Find first entity matching conditions
   * @param where - Query conditions
   * @param options - Query options
   * @returns Entity or null if not found
   */
  async findOne(where: any, options: any = {}): Promise<T | null> {
    try {
      return this.model.findFirst({
        where,
        ...options
      });
    } catch (error) {
      logger.error('Error in BaseRepository.findOne', { entity: this.model.name, error, where });
      throw new DatabaseError('Failed to fetch record', { cause: error });
    }
  }

  /**
   * Create a new entity
   * @param data - Entity data
   * @returns Created entity
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      return this.model.create({
        data
      });
    } catch (error) {
      logger.error('Error in BaseRepository.create', { entity: this.model.name, error });
      throw new DatabaseError('Failed to create record', { cause: error });
    }
  }

  /**
   * Update an existing entity
   * @param id - Entity ID
   * @param data - Entity data
   * @returns Updated entity
   */
  async update(id: number, data: Partial<T>): Promise<T> {
    try {
      return this.model.update({
        where: { id },
        data
      });
    } catch (error) {
      logger.error('Error in BaseRepository.update', { entity: this.model.name, error, id });
      throw new DatabaseError(`Failed to update record with ID ${id}`, { cause: error });
    }
  }

  /**
   * Delete an entity
   * @param id - Entity ID
   * @returns Deleted entity
   */
  async delete(id: number): Promise<T> {
    try {
      return this.model.delete({
        where: { id }
      });
    } catch (error) {
      logger.error('Error in BaseRepository.delete', { entity: this.model.name, error, id });
      throw new DatabaseError(`Failed to delete record with ID ${id}`, { cause: error });
    }
  }

  /**
   * Count entities matching conditions
   * @param where - Query conditions
   * @returns Count of matching entities
   */
  async count(where: any = {}): Promise<number> {
    try {
      return this.model.count({ where });
    } catch (error) {
      logger.error('Error in BaseRepository.count', { entity: this.model.name, error, where });
      throw new DatabaseError('Failed to count records', { cause: error });
    }
  }

  /**
   * Execute operations in a transaction
   * @param callback - Transaction callback
   * @returns Result of the transaction
   */
  async transaction<R>(
    callback: (tx: any) => Promise<R>
  ): Promise<R> {
    try {
      return this.prisma.$transaction(callback);
    } catch (error) {
      logger.error('Error in BaseRepository.transaction', { entity: this.model.name, error });
      throw new DatabaseError('Transaction failed', { cause: error });
    }
  }
}