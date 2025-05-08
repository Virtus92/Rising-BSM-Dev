import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { PrismaClient } from '@prisma/client';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors';
import { N8NExecution } from '../entities/N8NExecution';

/**
 * Repository for N8N workflow executions
 */
export class ExecutionRepository extends PrismaRepository<N8NExecution, number> {
  constructor(
    prisma: PrismaClient,
    entityName = 'N8NExecution',
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(prisma, entityName, logger, errorHandler);
  }
  
  /**
   * Find execution by external ID
   * 
   * @param externalId - External execution ID
   * @returns Execution or null if not found
   */
  async findByExternalId(externalId: string): Promise<N8NExecution | null> {
    try {
      const result = await this.prisma.n8NExecution.findFirst({
        where: { externalId }
      });
      
      if (!result) {
        return null;
      }
      
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByExternalId`, {
        error: error instanceof Error ? error.message : String(error),
        externalId
      });
      throw this.errorHandler.handle(error);
    }
  }
  
  /**
   * Find executions for a specific entity
   * 
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @param limit - Maximum number of executions to return
   * @returns Executions for the entity
   */
  async findByEntity(
    entityType: string,
    entityId: number,
    limit = 10
  ): Promise<N8NExecution[]> {
    try {
      const results = await this.prisma.n8NExecution.findMany({
        where: {
          entityType,
          entityId
        },
        orderBy: {
          startedAt: 'desc'
        },
        take: limit
      });
      
      return results.map(result => this.mapToDomainEntity(result));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByEntity`, {
        error: error instanceof Error ? error.message : String(error),
        entityType,
        entityId
      });
      throw this.errorHandler.handle(error);
    }
  }
  
  /**
   * Update execution status
   * 
   * @param id - Execution ID
   * @param status - New status
   * @param details - Additional details
   * @returns Updated execution
   */
  async updateStatus(
    id: number,
    status: string,
    details?: Record<string, any>
  ): Promise<N8NExecution> {
    try {
      const updateData: Record<string, any> = { status };
      
      // Add completion timestamp if completing
      if (status === 'completed' || status === 'failed') {
        updateData.completedAt = new Date();
      }
      
      // Add result or error if provided
      if (details) {
        if (status === 'failed' && details.error) {
          updateData.error = details.error;
        } else if (status === 'completed' && details.result) {
          updateData.result = details.result;
        }
      }
      
      const result = await this.prisma.n8NExecution.update({
        where: { id },
        data: updateData
      });
      
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.updateStatus`, {
        error: error instanceof Error ? error.message : String(error),
        id,
        status
      });
      throw this.errorHandler.handle(error);
    }
  }
  
  /**
   * Get execution history with filtering
   * 
   * @param filters - Filters for the query
   * @param page - Page number (1-based)
   * @param limit - Maximum items per page
   * @returns Execution history
   */
  async getHistory(
    filters: Record<string, any>,
    page = 1,
    limit = 20
  ): Promise<{
    executions: N8NExecution[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Create filter based on provided criteria
      const where = this.processHistoryFilters(filters);
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Execute queries
      const [results, total] = await Promise.all([
        this.prisma.n8NExecution.findMany({
          where,
          orderBy: {
            startedAt: 'desc'
          },
          skip,
          take: limit
        }),
        this.prisma.n8NExecution.count({ where })
      ]);
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        executions: results.map(result => this.mapToDomainEntity(result)),
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getHistory`, {
        error: error instanceof Error ? error.message : String(error),
        filters,
        page,
        limit
      });
      throw this.errorHandler.handle(error);
    }
  }
  
  /**
   * Process history filters into Prisma-compatible filter
   * 
   * @param filters - User-provided filters
   * @returns Prisma-compatible filter
   */
  private processHistoryFilters(filters: Record<string, any>): Record<string, any> {
    const where: Record<string, any> = {};
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.entityType) {
      where.entityType = filters.entityType;
    }
    
    if (filters.entityId !== undefined) {
      where.entityId = filters.entityId;
    }
    
    if (filters.triggerType) {
      where.triggerType = filters.triggerType;
    }
    
    if (filters.workflowTemplateId !== undefined) {
      where.workflowTemplateId = filters.workflowTemplateId;
    }
    
    if (filters.webhookId !== undefined) {
      where.webhookId = filters.webhookId;
    }
    
    // Date range filters
    if (filters.startDateFrom) {
      where.startedAt = {
        ...(where.startedAt || {}),
        gte: new Date(filters.startDateFrom)
      };
    }
    
    if (filters.startDateTo) {
      where.startedAt = {
        ...(where.startedAt || {}),
        lte: new Date(filters.startDateTo)
      };
    }
    
    return where;
  }

  /**
   * Process criteria into Prisma filter
   * @param criteria - Search criteria
   * @returns Prisma filter
   */
  protected processCriteria(criteria: Record<string, any>): Record<string, any> {
    const filter: Record<string, any> = {};
    
    if (criteria.id) {
      filter.id = criteria.id;
    }
    
    if (criteria.externalId) {
      filter.externalId = criteria.externalId;
    }
    
    if (criteria.status) {
      filter.status = criteria.status;
    }
    
    if (criteria.triggerType) {
      filter.triggerType = criteria.triggerType;
    }
    
    if (criteria.entityType) {
      filter.entityType = criteria.entityType;
    }
    
    if (criteria.entityId !== undefined) {
      filter.entityId = criteria.entityId;
    }
    
    if (criteria.workflowTemplateId !== undefined) {
      filter.workflowTemplateId = criteria.workflowTemplateId;
    }
    
    if (criteria.webhookId !== undefined) {
      filter.webhookId = criteria.webhookId;
    }
    
    return filter;
  }

  /**
   * Map database entity to domain entity
   * @param data - Database entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(data: any): N8NExecution {
    return {
      id: data.id,
      externalId: data.externalId,
      triggerType: data.triggerType,
      status: data.status,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      result: data.result || null,
      error: data.error || null,
      workflowTemplateId: data.workflowTemplateId,
      webhookId: data.webhookId,
      entityType: data.entityType,
      entityId: data.entityId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  /**
   * Map domain entity to database entity
   * @param entity - Domain entity
   * @returns Database entity
   */
  protected mapToORMEntity(entity: N8NExecution): any {
    return {
      id: entity.id,
      externalId: entity.externalId,
      triggerType: entity.triggerType,
      status: entity.status,
      startedAt: entity.startedAt || new Date(),
      completedAt: entity.completedAt,
      result: entity.result,
      error: entity.error,
      workflowTemplateId: entity.workflowTemplateId,
      webhookId: entity.webhookId,
      entityType: entity.entityType,
      entityId: entity.entityId
    };
  }

  /**
   * Log activity implementation
   * @param userId - User ID
   * @param action - Action
   * @param details - Details
   */
  protected async logActivityImplementation(
    userId: number,
    action: string,
    details?: string
  ): Promise<void> {
    // Implementation of activity logging for this repository
    try {
      await this.prisma.activityLog.create({
        data: {
          userId,
          action,
          details: details || '',
          entityType: 'N8NExecution',
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error(`Error logging activity in ${this.constructor.name}`, {
        error: error instanceof Error ? error.message : String(error),
        userId,
        action,
        details
      });
    }
  }
}