import { IBaseRepository } from './IBaseRepository';
import { AutomationWebhook } from '../entities/AutomationWebhook';
import { AutomationSchedule } from '../entities/AutomationSchedule';
import { AutomationExecution, AutomationType, AutomationExecutionStatus } from '../entities/AutomationExecution';
import {
  WebhookFilterParamsDto,
  ScheduleFilterParamsDto,
  ExecutionFilterParamsDto
} from '../dtos/AutomationDtos';

/**
 * AutomationWebhook Repository Interface
 */
export interface IAutomationWebhookRepository extends IBaseRepository<AutomationWebhook> {
  /**
   * Find webhooks by entity type and operation
   */
  findByTrigger(entityType: string, operation: string): Promise<AutomationWebhook[]>;

  /**
   * Find active webhooks by entity type and operation
   */
  findActiveTriggers(entityType: string, operation: string): Promise<AutomationWebhook[]>;

  /**
   * Find webhooks with filters
   */
  findWithFilters(filters: WebhookFilterParamsDto): Promise<{
    data: AutomationWebhook[];
    total: number;
    page: number;
    pageSize: number;
  }>;

  /**
   * Toggle webhook active status
   */
  toggleActive(id: number): Promise<AutomationWebhook>;

  /**
   * Count active webhooks
   */
  countActive(): Promise<number>;

  /**
   * Count webhooks by entity type
   */
  countByEntityType(entityType: string): Promise<number>;
}

/**
 * AutomationSchedule Repository Interface
 */
export interface IAutomationScheduleRepository extends IBaseRepository<AutomationSchedule> {
  /**
   * Find due schedules (ready to execute)
   */
  findDueSchedules(): Promise<AutomationSchedule[]>;

  /**
   * Find active schedules
   */
  findActiveSchedules(): Promise<AutomationSchedule[]>;

  /**
   * Find schedules with filters
   */
  findWithFilters(filters: ScheduleFilterParamsDto): Promise<{
    data: AutomationSchedule[];
    total: number;
    page: number;
    pageSize: number;
  }>;

  /**
   * Update schedule next run time
   */
  updateNextRunTime(id: number, nextRunAt: Date): Promise<AutomationSchedule>;

  /**
   * Mark schedule as executed
   */
  markAsExecuted(id: number): Promise<AutomationSchedule>;

  /**
   * Toggle schedule active status
   */
  toggleActive(id: number): Promise<AutomationSchedule>;

  /**
   * Count active schedules
   */
  countActive(): Promise<number>;

  /**
   * Find schedules by timezone
   */
  findByTimezone(timezone: string): Promise<AutomationSchedule[]>;
}

/**
 * AutomationExecution Repository Interface
 */
export interface IAutomationExecutionRepository extends IBaseRepository<AutomationExecution> {
  /**
   * Find executions by automation
   */
  findByAutomation(automationType: AutomationType, automationId: number): Promise<AutomationExecution[]>;

  /**
   * Find executions with filters
   */
  findWithFilters(filters: ExecutionFilterParamsDto): Promise<{
    data: AutomationExecution[];
    total: number;
    page: number;
    pageSize: number;
  }>;

  /**
   * Find recent executions
   */
  findRecent(limit?: number): Promise<AutomationExecution[]>;

  /**
   * Find failed executions that can be retried
   */
  findRetryableFailures(): Promise<AutomationExecution[]>;

  /**
   * Get execution statistics
   */
  getExecutionStats(fromDate?: Date, toDate?: Date): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
  }>;

  /**
   * Get execution counts by status
   */
  getCountsByStatus(): Promise<Record<AutomationExecutionStatus, number>>;

  /**
   * Get execution counts by automation type
   */
  getCountsByType(): Promise<Record<AutomationType, number>>;

  /**
   * Get top failed automations
   */
  getTopFailedAutomations(limit?: number): Promise<{
    automationType: AutomationType;
    automationId: number;
    failureCount: number;
  }[]>;

  /**
   * Clean up old executions
   */
  cleanupOldExecutions(olderThanDays: number): Promise<number>;

  /**
   * Count executions by automation
   */
  countByAutomation(automationType: AutomationType, automationId: number): Promise<number>;

  /**
   * Count successful executions by automation
   */
  countSuccessfulByAutomation(automationType: AutomationType, automationId: number): Promise<number>;

  /**
   * Count failed executions by automation
   */
  countFailedByAutomation(automationType: AutomationType, automationId: number): Promise<number>;
}
