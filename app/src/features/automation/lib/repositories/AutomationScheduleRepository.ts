import { PrismaClient } from '@prisma/client';
import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { IAutomationScheduleRepository } from '@/domain/repositories/IAutomationRepository';
import { AutomationSchedule } from '@/domain/entities/AutomationSchedule';
import { ScheduleFilterParamsDto } from '@/domain/dtos/AutomationDtos';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors/';

/**
 * Implementation of the AutomationScheduleRepository
 * 
 * Uses Prisma as ORM for automation schedule operations
 */
export class AutomationScheduleRepository extends PrismaRepository<AutomationSchedule> implements IAutomationScheduleRepository {
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
    super(prisma, 'automationSchedule', logger, errorHandler);
    this.logger.debug('Initialized AutomationScheduleRepository');
  }

  /**
   * Find due schedules (ready to execute)
   */
  async findDueSchedules(): Promise<AutomationSchedule[]> {
    try {
      this.logger.debug('Finding due schedules');
      
      const now = new Date();
      const schedules = await this.prisma.automationSchedule.findMany({
        where: {
          active: true,
          nextRunAt: {
            lte: now
          }
        },
        orderBy: { nextRunAt: 'asc' }
      });
      
      return schedules.map(schedule => this.mapToDomainEntity(schedule));
    } catch (error) {
      this.logger.error('Error in AutomationScheduleRepository.findDueSchedules', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Find active schedules
   */
  async findActiveSchedules(): Promise<AutomationSchedule[]> {
    try {
      this.logger.debug('Finding active schedules');
      
      const schedules = await this.prisma.automationSchedule.findMany({
        where: { active: true },
        orderBy: { name: 'asc' }
      });
      
      return schedules.map(schedule => this.mapToDomainEntity(schedule));
    } catch (error) {
      this.logger.error('Error in AutomationScheduleRepository.findActiveSchedules', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Find schedules with filters
   */
  async findWithFilters(filters: ScheduleFilterParamsDto): Promise<{
    data: AutomationSchedule[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      this.logger.debug('Finding schedules with filters', { filters });
      
      // Build WHERE conditions
      const where: any = {};
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { webhookUrl: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      if (filters.active !== undefined) where.active = filters.active;
      if (filters.timezone) where.timezone = filters.timezone;
      
      if (filters.isDue !== undefined) {
        if (filters.isDue) {
          where.nextRunAt = { lte: new Date() };
          where.active = true;
        } else {
          where.OR = [
            { nextRunAt: { gt: new Date() } },
            { active: false }
          ];
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
        orderBy.createdAt = 'desc';
      }
      
      // Execute queries
      const [total, schedules] = await Promise.all([
        this.prisma.automationSchedule.count({ where }),
        this.prisma.automationSchedule.findMany({
          where,
          skip,
          take: pageSize,
          orderBy,
          include: {
            creator: {
              select: { id: true, name: true, email: true }
            },
            updater: {
              select: { id: true, name: true, email: true }
            }
          }
        })
      ]);
      
      // Map to domain entities
      const data = schedules.map(schedule => this.mapToDomainEntity(schedule));
      
      return {
        data,
        total,
        page,
        pageSize
      };
    } catch (error) {
      this.logger.error('Error in AutomationScheduleRepository.findWithFilters', { error, filters });
      throw this.handleError(error);
    }
  }

  /**
   * Update schedule next run time
   */
  async updateNextRunTime(id: number, nextRunAt: Date): Promise<AutomationSchedule> {
    try {
      this.logger.debug(`Updating next run time for schedule ID: ${id}`, { nextRunAt });
      
      const updated = await this.prisma.automationSchedule.update({
        where: { id },
        data: {
          nextRunAt,
          updatedAt: new Date()
        }
      });
      
      return this.mapToDomainEntity(updated);
    } catch (error) {
      this.logger.error('Error in AutomationScheduleRepository.updateNextRunTime', { error, id, nextRunAt });
      throw this.handleError(error);
    }
  }

  /**
   * Mark schedule as executed
   */
  async markAsExecuted(id: number): Promise<AutomationSchedule> {
    try {
      this.logger.debug(`Marking schedule as executed for ID: ${id}`);
      
      const updated = await this.prisma.automationSchedule.update({
        where: { id },
        data: {
          lastRunAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      return this.mapToDomainEntity(updated);
    } catch (error) {
      this.logger.error('Error in AutomationScheduleRepository.markAsExecuted', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Toggle schedule active status
   */
  async toggleActive(id: number): Promise<AutomationSchedule> {
    try {
      this.logger.debug(`Toggling schedule active status for ID: ${id}`);
      
      // Get current status
      const current = await this.prisma.automationSchedule.findUnique({
        where: { id },
        select: { active: true }
      });
      
      if (!current) {
        throw new Error(`Schedule with ID ${id} not found`);
      }
      
      // Toggle status
      const updated = await this.prisma.automationSchedule.update({
        where: { id },
        data: {
          active: !current.active,
          updatedAt: new Date()
        }
      });
      
      return this.mapToDomainEntity(updated);
    } catch (error) {
      this.logger.error('Error in AutomationScheduleRepository.toggleActive', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Count active schedules
   */
  async countActive(): Promise<number> {
    try {
      return await this.prisma.automationSchedule.count({
        where: { active: true }
      });
    } catch (error) {
      this.logger.error('Error in AutomationScheduleRepository.countActive', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Find schedules by timezone
   */
  async findByTimezone(timezone: string): Promise<AutomationSchedule[]> {
    try {
      this.logger.debug(`Finding schedules by timezone: ${timezone}`);
      
      const schedules = await this.prisma.automationSchedule.findMany({
        where: { timezone },
        orderBy: { name: 'asc' }
      });
      
      return schedules.map(schedule => this.mapToDomainEntity(schedule));
    } catch (error) {
      this.logger.error('Error in AutomationScheduleRepository.findByTimezone', { error, timezone });
      throw this.handleError(error);
    }
  }

  /**
   * Maps a Prisma entity to a domain entity
   */
  protected mapToDomainEntity(ormEntity: any): AutomationSchedule {
    if (!ormEntity) {
      throw new Error('Cannot map null or undefined ORM entity to AutomationSchedule');
    }
    
    return new AutomationSchedule({
      id: ormEntity.id,
      name: ormEntity.name,
      description: ormEntity.description,
      cronExpression: ormEntity.cronExpression,
      webhookUrl: ormEntity.webhookUrl,
      headers: ormEntity.headers as Record<string, string>,
      payload: ormEntity.payload as Record<string, any>,
      timezone: ormEntity.timezone,
      active: ormEntity.active,
      lastRunAt: ormEntity.lastRunAt,
      nextRunAt: ormEntity.nextRunAt,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      createdBy: ormEntity.createdBy,
      updatedBy: ormEntity.updatedBy
    });
  }

  /**
   * Maps a domain entity to a Prisma entity
   */
  protected mapToORMEntity(domainEntity: Partial<AutomationSchedule>): any {
    const result: Record<string, any> = {};
    
    Object.entries(domainEntity).forEach(([key, value]) => {
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    if (!result.createdAt && !result.id) {
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
      // For automation schedules, we might want to log to a separate activity log
      // This is a placeholder implementation
      this.logger.info('Activity logged for automation schedule', {
        userId,
        actionType,
        details,
        ipAddress
      });
      
      return { success: true };
    } catch (error) {
      this.logger.error('Error logging activity for automation schedule', { error });
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
    if (criteria.active !== undefined) processed.active = criteria.active;
    if (criteria.timezone) processed.timezone = criteria.timezone;
    
    // Handle search across multiple fields
    if (criteria.search) {
      processed.OR = [
        { name: { contains: criteria.search, mode: 'insensitive' } },
        { description: { contains: criteria.search, mode: 'insensitive' } },
        { webhookUrl: { contains: criteria.search, mode: 'insensitive' } }
      ];
    }
    
    // Handle due schedules filter
    if (criteria.isDue !== undefined) {
      if (criteria.isDue) {
        processed.nextRunAt = { lte: new Date() };
        processed.active = true;
      } else {
        processed.OR = [
          { nextRunAt: { gt: new Date() } },
          { active: false }
        ];
      }
    }
    
    return processed;
  }
}
