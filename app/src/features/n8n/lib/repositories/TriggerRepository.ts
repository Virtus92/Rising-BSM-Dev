import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { PrismaClient } from '@prisma/client';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors';
import { N8NTrigger } from '../entities/N8NTrigger';

/**
 * Repository for N8N triggers
 */
export class TriggerRepository extends PrismaRepository<N8NTrigger, number> {
  constructor(
    prisma: PrismaClient,
    entityName = 'N8NTrigger',
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(prisma, entityName, logger, errorHandler);
  }
  
  /**
   * Find triggers by event type
   * 
   * @param eventType - Event type to find triggers for
   * @returns Matching triggers
   */
  async findByEventType(eventType: string): Promise<N8NTrigger[]> {
    try {
      const results = await this.prisma.n8NTrigger.findMany({
        where: { 
          eventType,
          enabled: true
        }
      });
      
      return results.map(result => this.mapToDomainEntity(result));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByEventType`, {
        error: error instanceof Error ? error.message : String(error),
        eventType
      });
      throw this.errorHandler.handle(error);
    }
  }
  
  /**
   * Find triggers by entity type
   * 
   * @param entityType - Entity type to find triggers for
   * @returns Matching triggers
   */
  async findByEntityType(entityType: string): Promise<N8NTrigger[]> {
    try {
      const results = await this.prisma.n8NTrigger.findMany({
        where: { 
          entityType,
          enabled: true
        }
      });
      
      return results.map(result => this.mapToDomainEntity(result));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByEntityType`, {
        error: error instanceof Error ? error.message : String(error),
        entityType
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
    
    if (criteria.eventType) {
      filter.eventType = criteria.eventType;
    }
    
    if (criteria.entityType) {
      filter.entityType = criteria.entityType;
    }
    
    if (criteria.enabled !== undefined) {
      filter.enabled = criteria.enabled;
    }
    
    if (criteria.workflowTemplateId) {
      filter.workflowTemplateId = criteria.workflowTemplateId;
    }
    
    return filter;
  }

  /**
   * Map database entity to domain entity
   * @param data - Database entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(data: any): N8NTrigger {
    return {
      id: data.id,
      name: data.name,
      eventType: data.eventType,
      entityType: data.entityType,
      configuration: data.configuration || {},
      enabled: data.enabled,
      workflowTemplateId: data.workflowTemplateId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  /**
   * Map domain entity to database entity
   * @param entity - Domain entity
   * @returns Database entity
   */
  protected mapToORMEntity(entity: N8NTrigger): any {
    return {
      id: entity.id,
      name: entity.name,
      eventType: entity.eventType,
      entityType: entity.entityType,
      configuration: entity.configuration || {},
      enabled: entity.enabled !== undefined ? entity.enabled : true,
      workflowTemplateId: entity.workflowTemplateId
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
          entityType: 'N8NTrigger',
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