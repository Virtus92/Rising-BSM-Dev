/**
 * Base Repository
 * 
 * Generic base repository providing standardized CRUD operations and query building
 * for all domain entities. Implements a consistent interface for data access operations
 * with built-in pagination, filtering, and transaction support.
 */
import { PrismaClient } from '@prisma/client';
import { PaginationOptions, PaginationResult, FilterOptions } from '../types/controller.types.js';
import { RepositoryOptions, FindOptions, CreateOptions, UpdateOptions, DeleteOptions } from '../types/repository.types.js';
import { NotFoundError } from '../utils/error-handler.js';

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
    options: FindOptions = {}
  ): Promise<{ data: T[]; pagination: PaginationResult }> {
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
  }

  /**
   * Find a single record by ID
   * @param id - Record ID
   * @param options - Query options
   * @returns Entity or null if not found
   */
  async findById(id: number, options: FindOptions = {}): Promise<T | null> {
    const { include = {} } = options;

    return this.model.findUnique({
      where: { id },
      include
    });
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
    const { include = {} } = options;

    return this.model.findFirst({
      where,
      include
    });
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
    const { include = {} } = options;

    return this.model.create({
      data,
      include
    });
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
  }

  /**
   * Delete a record by ID
   * @param id - Record ID
   * @param options - Delete options
   * @returns Deleted entity
   * @throws NotFoundError if entity doesn't exist
   */
  async delete(id: number, options: DeleteOptions = {}): Promise<T> {
    const { checkExists = true } = options;

    // Check if record exists before deleting
    if (checkExists) {
      await this.findByIdOrThrow(id);
    }

    return this.model.delete({
      where: { id }
    });
  }

  /**
   * Soft delete a record by ID
   * @param id - Record ID
   * @param options - Delete options
   * @returns Updated entity
   * @throws NotFoundError if entity doesn't exist
   */
  async softDelete(id: number, options: DeleteOptions = {}): Promise<T> {
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
  }

  /**
   * Count records with optional filtering
   * @param filters - Filter criteria
   * @returns Count of matching records
   */
  async count(filters: TFilter = {} as TFilter): Promise<number> {
    const where = this.buildFilterConditions(filters);
    return this.model.count({ where });
  }

  /**
   * Execute operations within a transaction
   * @param callback - Function to execute within transaction
   * @returns Result of callback
   */
  async transaction<R>(callback: (tx: any) => Promise<R>): Promise<R> {
    return this.prisma.$transaction(async (tx) => {
      return await callback(tx);
    });
  }

  /**
   * Build query conditions from filter criteria
   * Must be implemented by each repository subclass
   * @param filters - Filter criteria
   * @returns Prisma-compatible where conditions
   */
  protected abstract buildFilterConditions(filters: TFilter): any;
}