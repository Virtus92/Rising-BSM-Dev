import { PrismaClient } from '@prisma/client';
import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors';
import { N8NWebhook } from '../entities/N8NWebhook';

/**
 * Repository for N8N webhooks
 */
export class WebhookRepository extends PrismaRepository<N8NWebhook, number> {
  constructor(
    prisma: PrismaClient,
    entityName = 'N8NWebhook',
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(prisma, entityName, logger, errorHandler);
  }

  /**
   * Find webhooks matching specific criteria
   * 
   * @param criteria - Search criteria
   * @returns Matched webhooks
   */
  async findByCriteria(criteria: any): Promise<N8NWebhook[]> {
    try {
      // Convert criteria to prisma filter
      const filter = this.processCriteria(criteria);
      
      // Execute query with filter
      const results = await this.prisma.n8NWebhook.findMany({
        where: filter
      });
      
      // Map results to domain entities
      return results.map(result => this.mapToDomainEntity(result));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByCriteria`, {
        error: error instanceof Error ? error.message : String(error),
        criteria
      });
      throw this.errorHandler.handle(error);
    }
  }

  /**
   * Find webhook by path
   * 
   * @param path - Webhook path
   * @returns Matched webhook or null
   */
  async findByPath(path: string): Promise<N8NWebhook | null> {
    try {
      const result = await this.prisma.n8NWebhook.findFirst({
        where: { path }
      });
      
      if (!result) {
        return null;
      }
      
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByPath`, {
        error: error instanceof Error ? error.message : String(error),
        path
      });
      throw this.errorHandler.handle(error);
    }
  }

  /**
   * Find webhooks for a specific event
   * 
   * @param eventName - Event name
   * @returns Webhooks for the event
   */
  async findByEvent(eventName: string): Promise<N8NWebhook[]> {
    try {
      const results = await this.prisma.n8NWebhook.findMany({
        where: {
          events: {
            has: eventName
          },
          enabled: true
        }
      });
      
      return results.map(result => this.mapToDomainEntity(result));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByEvent`, {
        error: error instanceof Error ? error.message : String(error),
        eventName
      });
      throw this.errorHandler.handle(error);
    }
  }

  /**
   * Create a new webhook
   * 
   * @param webhook - Webhook data
   * @returns Created webhook
   */
  async create(webhook: Omit<N8NWebhook, 'id' | 'createdAt' | 'updatedAt'>): Promise<N8NWebhook> {
    try {
      const entity = this.mapToORMEntity(webhook as N8NWebhook);
      
      const result = await this.prisma.n8NWebhook.create({
        data: {
          name: entity.name,
          description: entity.description,
          url: entity.url,
          workflowId: entity.workflowId,
          active: entity.active,
          category: entity.category
        }
      });
      
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.create`, {
        error: error instanceof Error ? error.message : String(error),
        webhook
      });
      throw this.errorHandler.handle(error);
    }
  }

  /**
   * Process query criteria into Prisma filter
   * @param criteria - Search criteria
   * @returns Prisma filter
   */
  protected processCriteria(criteria: Record<string, any>): Record<string, any> {
    const filter: Record<string, any> = {};
    
    if (criteria.id) {
      filter.id = criteria.id;
    }
    
    if (criteria.name) {
      filter.name = {
        contains: criteria.name,
        mode: 'insensitive'
      };
    }
    
    if (criteria.enabled !== undefined) {
      filter.active = criteria.enabled;
    }
    
    if (criteria.category) {
      filter.category = criteria.category;
    }
    
    return filter;
  }

  /**
   * Map database entity to domain entity
   * @param data - Database entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(data: any): N8NWebhook {
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      url: data.url,
      workflowId: data.workflowId,
      active: data.active,
      category: data.category,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  /**
   * Map domain entity to database entity
   * @param entity - Domain entity
   * @returns Database entity
   */
  protected mapToORMEntity(entity: N8NWebhook): any {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || null,
      url: entity.url,
      workflowId: entity.workflowId || null,
      active: entity.active !== undefined ? entity.active : true,
      category: entity.category || 'general'
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
          entityType: 'N8NWebhook',
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