import { PrismaClient } from '@prisma/client';
import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { IAutomationWebhookRepository } from '@/domain/repositories/IAutomationRepository';
import { AutomationWebhook, AutomationEntityType, AutomationOperation } from '@/domain/entities/AutomationWebhook';
import { WebhookFilterParamsDto } from '@/domain/dtos/AutomationDtos';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors/';

/**
 * Implementation of the AutomationWebhookRepository
 * 
 * Uses Prisma as ORM for automation webhook operations
 */
export class AutomationWebhookRepository extends PrismaRepository<AutomationWebhook> implements IAutomationWebhookRepository {
  /**
   * Constructor
   * 
   * @param prisma - Prisma client
   * @param logger - Logging service
   * @param errorHandler - Error handling service
   */
  constructor(
    prisma: PrismaClient,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(prisma, 'automationWebhook', logger, errorHandler);
    this.logger.debug('Initialized AutomationWebhookRepository');
  }

  /**
   * Create a new webhook
   */
  async create(entity: AutomationWebhook): Promise<AutomationWebhook> {
    try {
      this.logger.debug('Creating AutomationWebhook', { entity });
      
      // Convert to ORM entity
      const ormEntity = this.mapToORMEntity(entity);
      
      const created = await this.prisma.automationWebhook.create({
        data: ormEntity
      });
      
      this.logger.info('AutomationWebhook created successfully', { id: created.id });
      return this.mapToDomainEntity(created);
    } catch (error) {
      this.logger.error('Error in AutomationWebhookRepository.create', { error, entity });
      throw this.handleError(error);
    }
  }

  /**
   * Find webhooks by entity type and operation
   */
  async findByTrigger(entityType: string, operation: string): Promise<AutomationWebhook[]> {
    try {
      this.logger.debug(`Finding webhooks by trigger: ${entityType}.${operation}`);
      const webhooks = await this.prisma.automationWebhook.findMany({
        where: {
          entityType,
          operation
        },
        orderBy: { name: 'asc' }
      });
      
      return webhooks.map(webhook => this.mapToDomainEntity(webhook));
    } catch (error) {
      this.logger.error('Error in AutomationWebhookRepository.findByTrigger', { error, entityType, operation });
      throw this.handleError(error);
    }
  }

  /**
   * Find active webhooks by entity type and operation
   */
  async findActiveTriggers(entityType: string, operation: string): Promise<AutomationWebhook[]> {
    try {
      this.logger.debug(`Finding active webhooks by trigger: ${entityType}.${operation}`);
      
      const webhooks = await this.prisma.automationWebhook.findMany({
        where: {
          entityType,
          operation,
          active: true
        },
        orderBy: { name: 'asc' }
      });
      
      return webhooks.map(webhook => this.mapToDomainEntity(webhook));
    } catch (error) {
      this.logger.error('Error in AutomationWebhookRepository.findActiveTriggers', { error, entityType, operation });
      throw this.handleError(error);
    }
  }

  /**
   * Find webhooks with filters
   */
  async findWithFilters(filters: WebhookFilterParamsDto): Promise<{
    data: AutomationWebhook[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      this.logger.debug('Finding webhooks with filters', { filters });
      
      // Build WHERE conditions
      const where: any = {};
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { webhookUrl: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      if (filters.entityType) where.entityType = filters.entityType;
      if (filters.operation) where.operation = filters.operation;
      if (filters.active !== undefined) where.active = filters.active;
      
      // Calculate pagination
      const page = filters.page || 1;
      const pageSize = filters.limit || 10;
      const skip = (page - 1) * pageSize;
      
      // Determine sorting
      const orderBy: any = {};
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortDirection || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }
      
      // Execute queries
      const [total, webhooks] = await Promise.all([
        this.prisma.automationWebhook.count({ where }),
        this.prisma.automationWebhook.findMany({
          where,
          skip,
          take: pageSize,
          orderBy
        })
      ]);
      
      return {
        data: webhooks.map(webhook => this.mapToDomainEntity(webhook)),
        total,
        page,
        pageSize
      };
    } catch (error) {
      this.logger.error('Error in AutomationWebhookRepository.findWithFilters', { error, filters });
      throw this.handleError(error);
    }
  }

  /**
   * Toggle webhook active status
   */
  async toggleActive(id: number): Promise<AutomationWebhook> {
    try {
      this.logger.debug(`Toggling active status for webhook: ${id}`);
      
      // Get current webhook
      const currentWebhook = await this.prisma.automationWebhook.findUnique({
        where: { id }
      });
      
      if (!currentWebhook) {
        throw new Error(`Webhook with ID ${id} not found`);
      }
      
      // Toggle active status
      const updatedWebhook = await this.prisma.automationWebhook.update({
        where: { id },
        data: {
          active: !currentWebhook.active,
          updatedAt: new Date()
        }
      });
      
      return this.mapToDomainEntity(updatedWebhook);
    } catch (error) {
      this.logger.error('Error in AutomationWebhookRepository.toggleActive', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Count active webhooks
   */
  async countActive(): Promise<number> {
    try {
      return await this.prisma.automationWebhook.count({
        where: { active: true }
      });
    } catch (error) {
      this.logger.error('Error in AutomationWebhookRepository.countActive', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Count webhooks by entity type
   */
  async countByEntityType(entityType: string): Promise<number> {
    try {
      return await this.prisma.automationWebhook.count({
        where: { entityType }
      });
    } catch (error) {
      this.logger.error('Error in AutomationWebhookRepository.countByEntityType', { error, entityType });
      throw this.handleError(error);
    }
  }

  /**
   * Map a domain entity to an ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<AutomationWebhook>): any {
    const result: Record<string, any> = {};
    
    // Copy all properties except id if it's 0 or undefined
    Object.entries(domainEntity).forEach(([key, value]) => {
      if (key === 'id' && (!value || value === 0)) {
        // Skip id field for new entities
        return;
      }
      
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    // Set timestamps for creation
    if (!domainEntity.id || domainEntity.id === 0) {
      result.createdAt = new Date();
    }
    
    result.updatedAt = new Date();
    
    return result;
  }

  /**
   * Map an ORM entity to a domain entity
   * 
   * @param ormEntity - ORM entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(ormEntity: any): AutomationWebhook {
    if (!ormEntity) {
      throw new Error('Cannot map null or undefined entity to AutomationWebhook');
    }
    
    return new AutomationWebhook({
      id: ormEntity.id,
      name: ormEntity.name,
      description: ormEntity.description,
      entityType: ormEntity.entityType as AutomationEntityType,
      operation: ormEntity.operation as AutomationOperation,
      webhookUrl: ormEntity.webhookUrl,
      headers: ormEntity.headers || {},
      payloadTemplate: ormEntity.payloadTemplate || {},
      active: ormEntity.active,
      retryCount: ormEntity.retryCount,
      retryDelaySeconds: ormEntity.retryDelaySeconds,
      createdAt: ormEntity.createdAt ? new Date(ormEntity.createdAt) : new Date(),
      updatedAt: ormEntity.updatedAt ? new Date(ormEntity.updatedAt) : new Date(),
      createdBy: ormEntity.createdBy,
      updatedBy: ormEntity.updatedBy
    });
  }

  /**
   * Process criteria for the ORM
   * 
   * @param criteria - Filter criteria
   * @returns ORM-specific criteria
   */
  protected processCriteria(criteria: Record<string, any>): any {
    const where: any = {};
    
    // Process each criterion
    for (const [key, value] of Object.entries(criteria)) {
      // Handle complex criteria
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Object with operators like {eq, gt, lt, etc.}
        const operators: Record<string, any> = {};
        
        for (const [op, opValue] of Object.entries(value)) {
          switch (op) {
            case 'eq':
              operators.equals = opValue;
              break;
            case 'neq':
              operators.not = opValue;
              break;
            case 'gt':
              operators.gt = opValue;
              break;
            case 'gte':
              operators.gte = opValue;
              break;
            case 'lt':
              operators.lt = opValue;
              break;
            case 'lte':
              operators.lte = opValue;
              break;
            case 'contains':
              operators.contains = opValue;
              operators.mode = 'insensitive';
              break;
            case 'startsWith':
              operators.startsWith = opValue;
              break;
            case 'endsWith':
              operators.endsWith = opValue;
              break;
            case 'in':
              operators.in = opValue;
              break;
            case 'notIn':
              operators.notIn = opValue;
              break;
            default:
              // Unknown operator, just pass it through
              operators[op] = opValue;
          }
        }
        
        where[key] = operators;
      } else {
        // Simple equality
        where[key] = value;
      }
    }
    
    return where;
  }

  /**
   * Implementation of activity logging (required by base class)
   */
  protected async logActivityImplementation(
    userId: number, 
    actionType: string, 
    details?: string,
    ipAddress?: string
  ): Promise<any> {
    // Automation webhooks don't need activity logging
    return null;
  }
}
