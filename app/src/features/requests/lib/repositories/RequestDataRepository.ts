import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { RequestData } from '@/domain/entities/RequestData';
import { RequestDataHistory } from '@/domain/entities/RequestDataHistory';
import { IRequestDataRepository } from '@/domain/repositories/IRequestDataRepository';
import { PaginationResult, QueryOptions } from '@/domain/repositories/IBaseRepository';

/**
 * Repository implementation for RequestData entities
 */
export class RequestDataRepository extends PrismaRepository<RequestData> implements IRequestDataRepository {
  /**
   * Constructor
   * 
   * @param prisma - Prisma client
   * @param logger - Logger service
   * @param errorHandler - Error handler
   */
  constructor(prisma: any, logger: any, errorHandler: any) {
    // Pass 'requestData' as the model name to ensure Prisma can find it
    super(prisma, 'requestData', logger, errorHandler);
  }

  /**
   * Create a new RequestData record
   * 
   * @param data - RequestData to create
   * @returns Created RequestData
   */
  async create(data: Partial<RequestData>): Promise<RequestData> {
    try {
      const result = await this.executeQuery('create', this.mapToORMEntity(data));
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.create`, { 
        error: error instanceof Error ? error.message : String(error),
        data 
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Update an existing RequestData record
   * 
   * @param id - ID of the record to update
   * @param data - Updated data
   * @returns Updated RequestData
   */
  async update(id: number, data: Partial<RequestData>): Promise<RequestData> {
    try {
      const updateData = this.mapToORMEntity(data);
      const result = await this.executeQuery('update', id, updateData);
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.update`, { 
        error: error instanceof Error ? error.message : String(error),
        id,
        data 
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Find RequestData by ID
   * 
   * @param id - ID of the RequestData to find
   * @param options - Optional query options
   * @returns RequestData if found, null otherwise
   */
  async findById(id: number, options?: QueryOptions): Promise<RequestData | null> {
    try {
      const includeHistory = options?.relations?.includes('history');
      
      const queryOptions: any = {};
      if (includeHistory) {
        queryOptions.include = { history: true };
      }
      
      const result = await this.executeQuery('findById', id, queryOptions);
      
      if (!result) return null;
      
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findById`, { 
        error: error instanceof Error ? error.message : String(error),
        id,
        options 
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Find RequestData records by criteria
   * 
   * @param options - Query options with criteria
   * @returns Paginated RequestData results
   * @template U - Return entity type
   */
  async findAll<U = RequestData>(options?: QueryOptions & { criteria?: any }): Promise<PaginationResult<U>> {
    try {
      // Use criteria from the extended options interface
      const criteria = options?.criteria || {};
      const where = this.processCriteria(criteria);
      
      const queryOptions = this.buildQueryOptions(options);
      queryOptions.where = where;
      
      const [count, data] = await Promise.all([
        this.executeQuery('count', where),
        this.executeQuery('findByCriteria', where, queryOptions)
      ]);
      
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      
      return {
        data: data.map((item: any) => this.mapToDomainEntity(item)) as U[],
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
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
   * Find a single RequestData record by criteria
   * 
   * @param options - Query options
   * @returns RequestData if found, null otherwise
   */
  async findOne(options: { criteria: any }): Promise<RequestData | null> {
    try {
      const where = this.processCriteria(options.criteria);
      
      const result = await this.executeQuery('findOneByCriteria', where);
      
      if (!result) return null;
      
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findOne`, { 
        error: error instanceof Error ? error.message : String(error),
        options 
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Create a new history record for a RequestData
   * 
   * @param data - History data to create
   * @returns Created history record
   */
  async createHistory(data: Partial<RequestDataHistory>): Promise<RequestDataHistory> {
    try {
      // Create a data object that matches Prisma's expected types
      // Explicitly omit userId if not defined to avoid type conflicts
      const historyData: any = {
        requestDataId: data.requestDataId,
        data: data.data,
        changedBy: data.changedBy ?? undefined,
        changeReason: data.changeReason ?? undefined,
        version: data.version !== undefined ? data.version : 1
      };
      
      // Only add userId if it's explicitly provided (not undefined)
      if (data.userId !== undefined) {
        historyData.userId = data.userId;
      }
      
      // Use Prisma properly with our model name correctly referenced
      const result = await this.prisma.requestDataHistory.create({
        data: historyData
      });
      
      return new RequestDataHistory({
        id: result.id,
        requestDataId: result.requestDataId,
        data: result.data,
        changedBy: result.changedBy ?? undefined,
        changeReason: result.changeReason ?? undefined,
        version: result.version,
        userId: result.userId ?? undefined,
        createdAt: result.createdAt
      });
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.createHistory`, { 
        error: error instanceof Error ? error.message : String(error),
        data 
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Count RequestData records matching criteria
   * 
   * @param criteria - Filter criteria
   * @returns Count of matching records
   */
  async count(criteria?: any): Promise<number> {
    try {
      const where = criteria ? this.processCriteria(criteria) : {};
      return await this.executeQuery('count', where);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.count`, { 
        error: error instanceof Error ? error.message : String(error),
        criteria 
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Process criteria for Prisma queries
   * 
   * @param criteria - Raw criteria
   * @returns Processed criteria for Prisma
   */
  protected processCriteria(criteria: any): any {
    const where: any = {};
    
    if (criteria?.requestId !== undefined) where.requestId = criteria.requestId;
    if (criteria?.category !== undefined) where.category = criteria.category;
    if (criteria?.dataType !== undefined) where.dataType = criteria.dataType;
    if (criteria?.isValid !== undefined) where.isValid = criteria.isValid;
    if (criteria?.processedBy !== undefined) where.processedBy = criteria.processedBy;
    
    return where;
  }
  
  /**
   * Map database record to domain entity
   * 
   * @param record - Database record
   * @returns Domain entity
   */
  protected mapToDomainEntity(record: any): RequestData {
    if (!record) {
      // Return an empty RequestData object instead of null
      return new RequestData();
    }
    
    const entity = new RequestData({
      id: record.id,
      requestId: record.requestId,
      category: record.category,
      label: record.label,
      order: record.order,
      dataType: record.dataType,
      data: record.data,
      isValid: record.isValid,
      processedBy: record.processedBy,
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdById: record.createdById
    });
    
    // Include history if available
    if (record.history) {
      entity.history = record.history.map((history: any) => new RequestDataHistory({
        id: history.id,
        requestDataId: history.requestDataId,
        data: history.data,
        changedBy: history.changedBy ?? undefined,
        changeReason: history.changeReason ?? undefined,
        version: history.version,
        userId: history.userId ?? undefined,
        createdAt: history.createdAt
      }));
    }
    
    return entity;
  }
  
  /**
   * Map domain entity to database record
   * 
   * @param entity - Domain entity
   * @returns Database record
   */
  protected mapToORMEntity(entity: Partial<RequestData>): any {
    const result: any = {};
    
    if (entity.requestId !== undefined) result.requestId = entity.requestId;
    if (entity.category !== undefined) result.category = entity.category;
    if (entity.label !== undefined) result.label = entity.label;
    if (entity.order !== undefined) result.order = entity.order;
    if (entity.dataType !== undefined) result.dataType = entity.dataType;
    if (entity.data !== undefined) result.data = entity.data;
    if (entity.isValid !== undefined) result.isValid = entity.isValid;
    if (entity.processedBy !== undefined) result.processedBy = entity.processedBy;
    if (entity.version !== undefined) result.version = entity.version;
    if (entity.createdById !== undefined) result.createdById = entity.createdById;
    
    return result;
  }
  
  /**
   * Finds entities based on criteria
   * 
   * @param criteria - Filter criteria
   * @param options - Query options
   * @returns Matching entities
   */
  async findByCriteria(criteria: Record<string, any>, options?: QueryOptions): Promise<RequestData[]> {
    try {
      const where = this.processCriteria(criteria);
      const queryOptions = this.buildQueryOptions(options);
      queryOptions.where = where;
      
      const results = await this.executeQuery('findByCriteria', where, queryOptions);
      
      return results.map((item: any) => this.mapToDomainEntity(item));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByCriteria`, { 
        error: error instanceof Error ? error.message : String(error),
        criteria,
        options 
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Finds one entity based on criteria
   * 
   * @param criteria - Filter criteria
   * @param options - Query options
   * @returns Matching entity or null
   */
  async findOneByCriteria(criteria: Record<string, any>, options?: QueryOptions): Promise<RequestData | null> {
    try {
      const where = this.processCriteria(criteria);
      const queryOptions = this.buildQueryOptions(options);
      queryOptions.where = where;
      
      const result = await this.executeQuery('findOneByCriteria', where, queryOptions);
      
      if (!result) return null;
      
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findOneByCriteria`, { 
        error: error instanceof Error ? error.message : String(error),
        criteria,
        options 
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Deletes an entity
   * 
   * @param id - ID of the entity to delete
   * @returns Success indicator
   */
  async delete(id: number): Promise<boolean> {
    try {
      const result = await this.executeQuery('delete', id);
      return !!result;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.delete`, { 
        error: error instanceof Error ? error.message : String(error),
        id 
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Updates multiple entities in bulk
   * 
   * @param ids - IDs of entities to update
   * @param data - Update data
   * @returns Count of updated entities
   */
  async bulkUpdate(ids: number[], data: Partial<RequestData>): Promise<number> {
    try {
      const updateData = this.mapToORMEntity(data);
      
      // Use Prisma's updateMany method directly with the model
      const result = await this.prisma.requestData.updateMany({
        where: { id: { in: ids } },
        data: updateData
      });
      
      return result.count;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.bulkUpdate`, { 
        error: error instanceof Error ? error.message : String(error),
        ids,
        data 
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Executes operation within a transaction
   * 
   * @param callback - Transaction callback
   * @returns Transaction result
   */
  async transaction<R>(callback: (repo?: IRequestDataRepository) => Promise<R>): Promise<R> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        try {
          // Create a new repository with the transaction client
          const repoWithTx = new RequestDataRepository(
            tx,
            this.logger,
            this.errorHandler
          );
          
          // Execute the callback with the transaction repository
          return await callback();
        } catch (error) {
          throw error;
        }
      });
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.transaction`, { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw this.handleError(error);
    }
  }

  /**
   * Required by PrismaRepository, but not used for RequestData
   */
  /**
   * Find request data by request ID
   * 
   * @param requestId - Request ID
   * @returns Request data related to the request
   */
  async findByRequestId(requestId: number): Promise<RequestData[]> {
    try {
      const where = this.processCriteria({ requestId });
      const results = await this.prisma.requestData.findMany({
        where,
        orderBy: { order: 'asc' }
      });
      
      return results.map(result => this.mapToDomainEntity(result));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByRequestId`, { 
        error: error instanceof Error ? error.message : String(error),
        requestId 
      });
      throw this.handleError(error);
    }
  }

  protected logActivityImplementation(
    userId: number, 
    actionType: string, 
    details?: string, 
    ipAddress?: string
  ): Promise<any> {
    // RequestData doesn't need activity logging
    return Promise.resolve(null);
  }
}