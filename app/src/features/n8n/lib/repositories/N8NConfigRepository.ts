import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { PrismaClient } from '@prisma/client';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors';
import { N8NConfiguration } from '../entities/N8NConfiguration';

/**
 * Repository for N8N configuration
 */
export class N8NConfigRepository extends PrismaRepository<N8NConfiguration, number> {
  constructor(
    prisma: PrismaClient,
    entityName = 'N8NConfiguration',
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(prisma, entityName, logger, errorHandler);
  }
  
  /**
   * Get active configuration
   * 
   * @returns Active configuration or null
   */
  async getActiveConfig(): Promise<N8NConfiguration | null> {
    try {
      // Find first enabled configuration (should only be one)
      const config = await this.prisma.n8NConfiguration.findFirst({
        where: { enabled: true }
      });
      
      if (!config) {
        return null;
      }
      
      // Map to domain entity
      return this.mapToDomainEntity(config);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getActiveConfig`, {
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
    
    if (criteria.enabled !== undefined) {
      filter.enabled = criteria.enabled;
    }
    
    return filter;
  }

  /**
   * Map database entity to domain entity
   * @param data - Database entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(data: any): N8NConfiguration {
    return {
      id: data.id,
      baseUrl: data.baseUrl,
      apiKey: data.apiKey || '',
      enabled: data.enabled,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  /**
   * Map domain entity to database entity
   * @param entity - Domain entity
   * @returns Database entity
   */
  protected mapToORMEntity(entity: N8NConfiguration): any {
    return {
      id: entity.id,
      baseUrl: entity.baseUrl,
      apiKey: entity.apiKey || null,
      enabled: entity.enabled !== undefined ? entity.enabled : true
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
          entityType: 'N8NConfiguration',
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