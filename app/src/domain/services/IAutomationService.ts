import { IBaseService } from './IBaseService';
import { AutomationWebhook, AutomationEntityType, AutomationOperation } from '../entities/AutomationWebhook';
import { AutomationSchedule } from '../entities/AutomationSchedule';
import { AutomationExecution, AutomationType, AutomationExecutionStatus } from '../entities/AutomationExecution';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookResponseDto,
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleResponseDto,
  ExecutionResponseDto,
  WebhookFilterParamsDto,
  ScheduleFilterParamsDto,
  ExecutionFilterParamsDto,
  AutomationDashboardDto,
  TestWebhookDto,
  TestWebhookResponseDto
} from '../dtos/AutomationDtos';

/**
 * Automation Service Interface
 * 
 * Main service interface for automation management
 */
export interface IAutomationService extends IBaseService<
  AutomationWebhook, 
  CreateWebhookDto, 
  UpdateWebhookDto, 
  WebhookResponseDto, 
  number
> {
  // ============================================================================
  // WEBHOOK MANAGEMENT
  // ============================================================================

  /**
   * Create a new webhook
   */
  createWebhook(data: CreateWebhookDto, createdBy?: number): Promise<WebhookResponseDto>;

  /**
   * Update an existing webhook
   */
  updateWebhook(id: number, data: UpdateWebhookDto, updatedBy?: number): Promise<WebhookResponseDto>;

  /**
   * Get webhook by ID
   */
  getWebhookById(id: number): Promise<WebhookResponseDto | null>;

  /**
   * Get webhooks with filters
   */
  getWebhooks(filters?: WebhookFilterParamsDto): Promise<{
    data: WebhookResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }>;

  /**
   * Delete webhook
   */
  deleteWebhook(id: number): Promise<boolean>;

  /**
   * Toggle webhook active status
   */
  toggleWebhookActive(id: number): Promise<WebhookResponseDto>;

  /**
   * Test webhook configuration
   */
  testWebhook(data: TestWebhookDto): Promise<TestWebhookResponseDto>;

  /**
   * Trigger webhook for entity operation
   */
  triggerWebhook(entityType: AutomationEntityType, operation: AutomationOperation, entityData: any, entityId?: number): Promise<void>;

  // ============================================================================
  // SCHEDULE MANAGEMENT
  // ============================================================================

  /**
   * Create a new schedule
   */
  createSchedule(data: CreateScheduleDto, createdBy?: number): Promise<ScheduleResponseDto>;

  /**
   * Update an existing schedule
   */
  updateSchedule(id: number, data: UpdateScheduleDto, updatedBy?: number): Promise<ScheduleResponseDto>;

  /**
   * Get schedule by ID
   */
  getScheduleById(id: number): Promise<ScheduleResponseDto | null>;

  /**
   * Get schedules with filters
   */
  getSchedules(filters?: ScheduleFilterParamsDto): Promise<{
    data: ScheduleResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }>;

  /**
   * Delete schedule
   */
  deleteSchedule(id: number): Promise<boolean>;

  /**
   * Toggle schedule active status
   */
  toggleScheduleActive(id: number): Promise<ScheduleResponseDto>;

  /**
   * Execute schedule manually
   */
  executeSchedule(id: number): Promise<AutomationExecution>;

  /**
   * Get due schedules
   */
  getDueSchedules(): Promise<ScheduleResponseDto[]>;

  /**
   * Process due schedules (for scheduler service)
   */
  processDueSchedules(): Promise<void>;

  // ============================================================================
  // EXECUTION MANAGEMENT
  // ============================================================================

  /**
   * Get execution history with filters
   */
  getExecutions(filters?: ExecutionFilterParamsDto): Promise<{
    data: ExecutionResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }>;

  /**
   * Get execution by ID
   */
  getExecutionById(id: number): Promise<ExecutionResponseDto | null>;

  /**
   * Get executions for specific automation
   */
  getExecutionsByAutomation(automationType: AutomationType, automationId: number): Promise<ExecutionResponseDto[]>;

  /**
   * Retry failed execution
   */
  retryExecution(id: number): Promise<AutomationExecution>;

  /**
   * Clean up old executions
   */
  cleanupOldExecutions(olderThanDays?: number): Promise<number>;

  // ============================================================================
  // DASHBOARD & ANALYTICS
  // ============================================================================

  /**
   * Get automation dashboard data
   */
  getDashboardData(): Promise<AutomationDashboardDto>;

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
   * Get automation health status
   */
  getHealthStatus(): Promise<{
    isHealthy: boolean;
    totalWebhooks: number;
    activeWebhooks: number;
    totalSchedules: number;
    activeSchedules: number;
    recentFailures: number;
    avgExecutionTime: number;
  }>;

  // ============================================================================
  // SYSTEM MANAGEMENT
  // ============================================================================

  /**
   * Initialize automation system
   */
  initializeSystem(): Promise<void>;

  /**
   * Validate webhook configuration
   */
  validateWebhookConfig(data: CreateWebhookDto | UpdateWebhookDto): Promise<string[]>;

  /**
   * Validate schedule configuration
   */
  validateScheduleConfig(data: CreateScheduleDto | UpdateScheduleDto): Promise<string[]>;

  /**
   * Parse cron expression
   */
  parseCronExpression(cronExpression: string, timezone?: string): Promise<{
    isValid: boolean;
    description: string;
    nextRun?: Date;
    errors?: string[];
  }>;
}

/**
 * Automation Webhook Service Interface
 * 
 * Specialized service for webhook operations
 */
export interface IAutomationWebhookService {
  /**
   * Execute webhook with retry logic
   */
  executeWebhook(webhook: AutomationWebhook, payload: any, entityId?: number): Promise<AutomationExecution>;

  /**
   * Build webhook payload from template
   */
  buildPayload(template: Record<string, any>, entityData: any): Promise<Record<string, any>>;

  /**
   * Validate webhook URL
   */
  validateWebhookUrl(url: string): Promise<boolean>;
}

/**
 * Automation Schedule Service Interface
 * 
 * Specialized service for schedule operations
 */
export interface IAutomationScheduleService {
  /**
   * Execute scheduled job
   */
  executeScheduledJob(schedule: AutomationSchedule): Promise<AutomationExecution>;

  /**
   * Calculate next run time
   */
  calculateNextRun(cronExpression: string, timezone: string, fromDate?: Date): Promise<Date>;

  /**
   * Validate cron expression
   */
  validateCronExpression(cronExpression: string): Promise<{
    isValid: boolean;
    errors: string[];
  }>;

  /**
   * Get human-readable schedule description
   */
  getScheduleDescription(cronExpression: string): Promise<string>;
}

/**
 * Automation Execution Service Interface
 * 
 * Specialized service for execution tracking
 */
export interface IAutomationExecutionService {
  /**
   * Create execution record
   */
  createExecution(
    automationType: AutomationType,
    automationId: number,
    entityId?: number,
    entityType?: string
  ): Promise<AutomationExecution>;

  /**
   * Update execution status
   */
  updateExecutionStatus(
    executionId: number,
    status: AutomationExecutionStatus,
    responseStatus?: number,
    responseBody?: string,
    errorMessage?: string,
    executionTimeMs?: number
  ): Promise<AutomationExecution>;

  /**
   * Mark execution as failed with retry
   */
  markForRetry(executionId: number, retryAttempt: number): Promise<AutomationExecution>;

  /**
   * Process retry queue
   */
  processRetryQueue(): Promise<void>;
}
