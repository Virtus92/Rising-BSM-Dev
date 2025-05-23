import { PrismaClient } from '@prisma/client';
import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { IAutomationExecutionRepository } from '@/domain/repositories/IAutomationRepository';
import { AutomationExecution, AutomationType, AutomationExecutionStatus } from '@/domain/entities/AutomationExecution';
import { ExecutionFilterParamsDto } from '@/domain/dtos/AutomationDtos';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors/';

/**
 * Implementation of the AutomationExecutionRepository
 * 
 * Uses Prisma as ORM for automation execution operations
 */
export class AutomationExecutionRepository extends PrismaRepository<AutomationExecution, number> implements IAutomationExecutionRepository {
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
    super(prisma, 'automationExecution', logger, errorHandler);
    this.logger.debug('Initialized AutomationExecutionRepository');
  }

  /**
   * Find executions by automation
   */
  async findByAutomation(automationType: AutomationType, automationId: number): Promise<AutomationExecution[]> {
    try {
      this.logger.debug(`Finding executions by automation: ${automationType}:${automationId}`);
      
      const executions = await this.prisma.automationExecution.findMany({
        where: {
          automationType,
          automationId
        },
        orderBy: { executedAt: 'desc' }
      });
      
      return executions.map(execution => this.mapToDomainEntity(execution));
    } catch (error) {
      this.logger.error('Error in AutomationExecutionRepository.findByAutomation', { error, automationType, automationId });
      throw this.handleError(error);
    }
  }

  /**
   * Find executions with filters
   */
  async findWithFilters(filters: ExecutionFilterParamsDto): Promise<{
    data: AutomationExecution[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      this.logger.debug('Finding executions with filters', { filters });
      
      // Build WHERE conditions
      const where: any = {};
      
      if (filters.automationType) where.automationType = filters.automationType;
      if (filters.automationId) where.automationId = filters.automationId;
      if (filters.status) where.status = filters.status;
      if (filters.entityType) where.entityType = filters.entityType;
      if (filters.entityId) where.entityId = filters.entityId;
      
      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        where.executedAt = {};
        if (filters.dateFrom) {
          where.executedAt.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          where.executedAt.lte = new Date(filters.dateTo);
        }
      }
      
      // Calculate pagination
      const page = filters.page || 1;
      const pageSize = filters.limit || 10;
      const skip = (page - 1) * pageSize;
      
      // Determine sorting
      const orderBy: any = {};
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortDirection || 'desc';
      } else {
        orderBy.executedAt = 'desc';
      }
      
      // Execute queries
      const [total, executions] = await Promise.all([
        this.prisma.automationExecution.count({ where }),
        this.prisma.automationExecution.findMany({
          where,
          skip,
          take: pageSize,
          orderBy
        })
      ]);
      
      // Map to domain entities
      const data = executions.map(execution => this.mapToDomainEntity(execution));
      
      return {
        data,
        total,
        page,
        pageSize
      };
    } catch (error) {
      this.logger.error('Error in AutomationExecutionRepository.findWithFilters', { error, filters });
      throw this.handleError(error);
    }
  }

  /**
   * Find recent executions
   */
  async findRecent(limit: number = 10): Promise<AutomationExecution[]> {
    try {
      this.logger.debug(`Finding recent executions (limit: ${limit})`);
      
      const executions = await this.prisma.automationExecution.findMany({
        take: limit,
        orderBy: { executedAt: 'desc' }
      });
      
      return executions.map(execution => this.mapToDomainEntity(execution));
    } catch (error) {
      this.logger.error('Error in AutomationExecutionRepository.findRecent', { error, limit });
      throw this.handleError(error);
    }
  }

  /**
   * Find failed executions that can be retried
   */
  async findRetryableFailures(): Promise<AutomationExecution[]> {
    try {
      this.logger.debug('Finding retryable failed executions');
      
      const executions = await this.prisma.automationExecution.findMany({
        where: {
          status: AutomationExecutionStatus.FAILED,
          retryAttempt: { lt: 3 } // Max 3 retry attempts
        },
        orderBy: { executedAt: 'asc' }
      });
      
      return executions.map(execution => this.mapToDomainEntity(execution));
    } catch (error) {
      this.logger.error('Error in AutomationExecutionRepository.findRetryableFailures', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(fromDate?: Date, toDate?: Date): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
  }> {
    try {
      this.logger.debug('Getting execution statistics', { fromDate, toDate });
      
      const where: any = {};
      
      if (fromDate || toDate) {
        where.executedAt = {};
        if (fromDate) where.executedAt.gte = fromDate;
        if (toDate) where.executedAt.lte = toDate;
      }
      
      const [total, successful, failed] = await Promise.all([
        this.prisma.automationExecution.count({ where }),
        this.prisma.automationExecution.count({
          where: { ...where, status: AutomationExecutionStatus.SUCCESS }
        }),
        this.prisma.automationExecution.count({
          where: { ...where, status: AutomationExecutionStatus.FAILED }
        })
      ]);
      
      const successRate = total > 0 ? (successful / total) * 100 : 0;
      
      return {
        totalExecutions: total,
        successfulExecutions: successful,
        failedExecutions: failed,
        successRate: Math.round(successRate * 100) / 100
      };
    } catch (error) {
      this.logger.error('Error in AutomationExecutionRepository.getExecutionStats', { error, fromDate, toDate });
      throw this.handleError(error);
    }
  }

  /**
   * Get execution counts by status
   */
  async getCountsByStatus(): Promise<Record<AutomationExecutionStatus, number>> {
    try {
      this.logger.debug('Getting execution counts by status');
      
      const counts = await this.prisma.automationExecution.groupBy({
        by: ['status'],
        _count: { status: true }
      });
      
      const result: Record<AutomationExecutionStatus, number> = {
        [AutomationExecutionStatus.SUCCESS]: 0,
        [AutomationExecutionStatus.FAILED]: 0,
        [AutomationExecutionStatus.RETRYING]: 0
      };
      
      counts.forEach(count => {
        result[count.status as AutomationExecutionStatus] = count._count.status;
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error in AutomationExecutionRepository.getCountsByStatus', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Get execution counts by automation type
   */
  async getCountsByType(): Promise<Record<AutomationType, number>> {
    try {
      this.logger.debug('Getting execution counts by type');
      const counts = await this.prisma.automationExecution.groupBy({
        by: ['automationType'],
        _count: { automationType: true }
      });
      
      const result: Record<AutomationType, number> = {
        [AutomationType.WEBHOOK]: 0,
        [AutomationType.SCHEDULE]: 0
      };
      
      counts.forEach(count => {
        result[count.automationType as AutomationType] = count._count.automationType;
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error in AutomationExecutionRepository.getCountsByType', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Get top failed automations
   */
  async getTopFailedAutomations(limit: number = 5): Promise<{
    automationType: AutomationType;
    automationId: number;
    failureCount: number;
  }[]> {
    try {
      this.logger.debug(`Getting top failed automations (limit: ${limit})`);
      
      const failedAutomations = await this.prisma.automationExecution.groupBy({
        by: ['automationType', 'automationId'],
        where: { status: AutomationExecutionStatus.FAILED },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit
      });
      
      return failedAutomations.map(automation => ({
        automationType: automation.automationType as AutomationType,
        automationId: automation.automationId,
        failureCount: automation._count.id
      }));
    } catch (error) {
      this.logger.error('Error in AutomationExecutionRepository.getTopFailedAutomations', { error, limit });
      throw this.handleError(error);
    }
  }

  /**
   * Clean up old executions
   */
  async cleanupOldExecutions(olderThanDays: number): Promise<number> {
    try {
      this.logger.debug(`Cleaning up executions older than ${olderThanDays} days`);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const result = await this.prisma.automationExecution.deleteMany({
        where: {
          executedAt: { lt: cutoffDate }
        }
      });
      
      this.logger.info(`Cleaned up ${result.count} old execution records`);
      return result.count;
    } catch (error) {
      this.logger.error('Error in AutomationExecutionRepository.cleanupOldExecutions', { error, olderThanDays });
      throw this.handleError(error);
    }
  }

  /**
   * Count executions by automation
   */
  async countByAutomation(automationType: AutomationType, automationId: number): Promise<number> {
    try {
      return await this.prisma.automationExecution.count({
        where: { automationType, automationId }
      });
    } catch (error) {
      this.logger.error('Error in AutomationExecutionRepository.countByAutomation', { error, automationType, automationId });
      throw this.handleError(error);
    }
  }

  /**
   * Count successful executions by automation
   */
  async countSuccessfulByAutomation(automationType: AutomationType, automationId: number): Promise<number> {
    try {
      return await this.prisma.automationExecution.count({
        where: {
          automationType,
          automationId,
          status: AutomationExecutionStatus.SUCCESS
        }
      });
    } catch (error) {
      this.logger.error('Error in AutomationExecutionRepository.countSuccessfulByAutomation', { error, automationType, automationId });
      throw this.handleError(error);
    }
  }

  /**
   * Count failed executions by automation
   */
  async countFailedByAutomation(automationType: AutomationType, automationId: number): Promise<number> {
    try {
      return await this.prisma.automationExecution.count({
        where: {
          automationType,
          automationId,
          status: AutomationExecutionStatus.FAILED
        }
      });
    } catch (error) {
      this.logger.error('Error in AutomationExecutionRepository.countFailedByAutomation', { error, automationType, automationId });
      throw this.handleError(error);
    }
  }

  /**
   * Maps a Prisma entity to a domain entity
   */
  protected mapToDomainEntity(ormEntity: any): AutomationExecution {
    if (!ormEntity) {
      throw new Error('Cannot map null or undefined ORM entity to AutomationExecution');
    }
    
    return new AutomationExecution({
      id: ormEntity.id,
      automationType: ormEntity.automationType as AutomationType,
      automationId: ormEntity.automationId,
      entityId: ormEntity.entityId,
      entityType: ormEntity.entityType,
      status: ormEntity.status as AutomationExecutionStatus,
      responseStatus: ormEntity.responseStatus,
      responseBody: ormEntity.responseBody,
      errorMessage: ormEntity.errorMessage,
      executionTimeMs: ormEntity.executionTimeMs,
      executedAt: ormEntity.executedAt,
      retryAttempt: ormEntity.retryAttempt,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt
    });
  }

  /**
   * Maps a domain entity to a Prisma entity
   */
  protected mapToORMEntity(domainEntity: Partial<AutomationExecution>): any {
    const result: Record<string, any> = {};
    
    Object.entries(domainEntity).forEach(([key, value]) => {
      // Exclude id field if it's 0 or undefined (for new records)
      if (key === 'id' && (!value || value === 0)) {
        return; // Skip the id field for new records
      }
      
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    if (!result.createdAt && !domainEntity.id) {
      result.createdAt = new Date();
    }
    
    result.updatedAt = new Date();
    
    return result;
  }

  /**
   * Implementation of activity logging
   * 
   * @param userId - User ID
   * @param actionType - Action type
   * @param details - Details
   * @param ipAddress - IP address
   * @returns Promise with log result
   */
  protected async logActivityImplementation(
    userId: number, 
    actionType: string, 
    details?: string, 
    ipAddress?: string
  ): Promise<any> {
    try {
      // For automation executions, we might want to log to a separate activity log
      // This is a placeholder implementation
      this.logger.info('Activity logged for automation execution', {
        userId,
        actionType,
        details,
        ipAddress
      });
      
      return { success: true };
    } catch (error) {
      this.logger.error('Error logging activity for automation execution', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Process criteria for database queries
   * 
   * @param criteria - Raw criteria
   * @returns Processed criteria
   */
  protected processCriteria(criteria: any): any {
    if (!criteria) return {};
    
    const processed: any = {};
    
    // Map common filter fields
    if (criteria.automationType) processed.automationType = criteria.automationType;
    if (criteria.automationId) processed.automationId = criteria.automationId;
    if (criteria.status) processed.status = criteria.status;
    if (criteria.entityType) processed.entityType = criteria.entityType;
    if (criteria.entityId) processed.entityId = criteria.entityId;
    
    // Handle date range filters
    if (criteria.dateFrom || criteria.dateTo) {
      processed.executedAt = {};
      if (criteria.dateFrom) {
        processed.executedAt.gte = new Date(criteria.dateFrom);
      }
      if (criteria.dateTo) {
        processed.executedAt.lte = new Date(criteria.dateTo);
      }
    }
    
    return processed;
  }
}
