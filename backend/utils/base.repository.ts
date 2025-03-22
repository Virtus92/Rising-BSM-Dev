import { PrismaClient } from '@prisma/client';
import { FilterOptions, PaginationOptions, PaginationResult } from '../types/controller-types';
import { QueryBuilder } from './query-builder';

export abstract class BaseRepository<T> {
  constructor(
    protected prisma: PrismaClient,
    protected model: any 
  ) {}
  
  /**
   * Find all records with pagination and filtering
   */
  async findAll(
    filters: FilterOptions,
    pagination: PaginationOptions,
    include: any = {},
    orderBy: any = { id: 'desc' }
  ): Promise<{data: T[], pagination: PaginationResult}> {
    const { page = 1, limit = 20 } = pagination;
    
    // Process pagination parameters
    const pageNumber = Math.max(1, Number(page));
    const pageSize = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNumber - 1) * pageSize;
    
    // Build where conditions
    const where = this.buildFilterConditions(filters);
    
    // Execute queries in parallel
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
   */
  async findById(id: number, include: any = {}): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
      include
    });
  }
  
  /**
   * Find a single record by custom criteria
   */
  async findOne(where: any, include: any = {}): Promise<T | null> {
    return this.model.findFirst({
      where,
      include
    });
  }
  
  /**
   * Create a new record
   */
  async create(data: any): Promise<T> {
    return this.model.create({
      data
    });
  }
  
  /**
   * Update a record by ID
   */
  async update(id: number, data: any): Promise<T> {
    return this.model.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }
  
  /**
   * Delete a record by ID
   */
  async delete(id: number): Promise<T> {
    return this.model.delete({
      where: { id }
    });
  }
  
  /**
   * Soft delete a record by ID
   */
  async softDelete(id: number): Promise<T> {
    return this.model.update({
      where: { id },
      data: {
        status: 'geloescht',
        updatedAt: new Date()
      }
    });
  }
  
  /**
   * Count records based on filter conditions
   */
  async count(filters: FilterOptions = {}): Promise<number> {
    const where = this.buildFilterConditions(filters);
    return this.model.count({ where });
  }
  
  /**
   * Execute a transaction with the given function
   */
  async transaction<U>(fn: (tx: any) => Promise<U>): Promise<U> {
    return this.prisma.$transaction(fn);
  }
  
  /**
   * Build query conditions from filter options
   * This method should be implemented by each repository subclass
   */
  protected abstract buildFilterConditions(filters: FilterOptions): any;
}
