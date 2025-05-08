import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { PrismaClient } from '@prisma/client';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors';
import { N8NApiEndpoint } from '../entities/N8NApiEndpoint';

/**
 * Repository for N8N API endpoints
 */
export class ApiEndpointRepository extends PrismaRepository<N8NApiEndpoint, number> {
  constructor(
    prisma: PrismaClient,
    entityName = 'N8NAPIEndpoint',
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(prisma, entityName, logger, errorHandler);
  }
  
  /**
   * Find API endpoint by path and method
   * 
   * @param path - Endpoint path
   * @param method - HTTP method
   * @returns Matched endpoint or null
   */
  async findByPathAndMethod(path: string, method: string): Promise<N8NApiEndpoint | null> {
    try {
      const result = await this.prisma.n8NAPIEndpoint.findFirst({
        where: {
          path,
          method
        }
      });
      
      if (!result) {
        return null;
      }
      
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByPathAndMethod`, {
        error: error instanceof Error ? error.message : String(error),
        path,
        method
      });
      throw this.errorHandler.handle(error);
    }
  }
  
  /**
   * Find all public API endpoints
   * 
   * @returns List of public endpoints
   */
  async findAllPublic(): Promise<N8NApiEndpoint[]> {
    try {
      const results = await this.prisma.n8NAPIEndpoint.findMany({
        where: {
          isPublic: true,
          isDeprecated: false
        }
      });
      
      return results.map(result => this.mapToDomainEntity(result));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findAllPublic`, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw this.errorHandler.handle(error);
    }
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
    
    if (criteria.path) {
      filter.path = {
        contains: criteria.path,
        mode: 'insensitive'
      };
    }
    
    if (criteria.method) {
      filter.method = criteria.method;
    }
    
    if (criteria.isPublic !== undefined) {
      filter.isPublic = criteria.isPublic;
    }
    
    if (criteria.isDeprecated !== undefined) {
      filter.isDeprecated = criteria.isDeprecated;
    }
    
    return filter;
  }

  /**
   * Map database entity to domain entity
   * @param data - Database entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(data: any): N8NApiEndpoint {
    return {
      id: data.id,
      path: data.path,
      method: data.method,
      description: data.description || '',
      parameters: data.parameters || {},
      responseFormat: data.responseFormat || {},
      isPublic: data.isPublic,
      isDeprecated: data.isDeprecated,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  /**
   * Map domain entity to database entity
   * @param entity - Domain entity
   * @returns Database entity
   */
  protected mapToORMEntity(entity: N8NApiEndpoint): any {
    return {
      id: entity.id,
      path: entity.path,
      method: entity.method,
      description: entity.description || null,
      parameters: entity.parameters || {},
      responseFormat: entity.responseFormat || {},
      isPublic: entity.isPublic !== undefined ? entity.isPublic : false,
      isDeprecated: entity.isDeprecated !== undefined ? entity.isDeprecated : false
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
          entityType: 'N8NAPIEndpoint',
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