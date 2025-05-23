import { IAutomationService } from '@/domain/services/IAutomationService';
import { BaseService } from '@/core/services/BaseService';
import { 
  IAutomationWebhookRepository, 
  IAutomationScheduleRepository, 
  IAutomationExecutionRepository 
} from '@/domain/repositories/IAutomationRepository';
import { AutomationWebhook, AutomationEntityType, AutomationOperation } from '@/domain/entities/AutomationWebhook';
import { AutomationSchedule } from '@/domain/entities/AutomationSchedule';
import { AutomationExecution, AutomationType, AutomationExecutionStatus } from '@/domain/entities/AutomationExecution';
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
  TestWebhookResponseDto,
  mapWebhookToResponseDto,
  mapScheduleToResponseDto,
  mapExecutionToResponseDto
} from '@/domain/dtos/AutomationDtos';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { AppError } from '@/types/errors';
import { buildPayload, validateTemplate, getDefaultTemplate, ENTITY_VARIABLES, SYSTEM_VARIABLES } from '../utils/payload-template';
import { validateWebhookConfig } from '../utils/webhook-validator';
import { validateCronExpression, describeCronExpression, getNextRunTime } from '../utils/cron-parser';
import { executeWebhook, testWebhookUrl } from '../utils/webhook-executor';

/**
 * Server-side implementation of the AutomationService
 * 
 * Handles all automation operations including webhooks, schedules, and executions
 */
export class AutomationService extends BaseService<
  AutomationWebhook, 
  CreateWebhookDto, 
  UpdateWebhookDto, 
  WebhookResponseDto, 
  number
> implements IAutomationService {
  private webhookRepository: IAutomationWebhookRepository;
  private scheduleRepository: IAutomationScheduleRepository;
  private executionRepository: IAutomationExecutionRepository;
  protected logger: ILoggingService;

  constructor(
    webhookRepository: IAutomationWebhookRepository,
    scheduleRepository: IAutomationScheduleRepository,
    executionRepository: IAutomationExecutionRepository,
    logger: ILoggingService,
    validator: any,
    errorHandler: any
  ) {
    super(webhookRepository, logger, validator, errorHandler);
    this.webhookRepository = webhookRepository;
    this.scheduleRepository = scheduleRepository;
    this.executionRepository = executionRepository;
    this.logger = logger;
    
    this.logger.info('AutomationService initialized');
  }

  // ============================================================================
  // WEBHOOK MANAGEMENT
  // ============================================================================

  async createWebhook(data: CreateWebhookDto, createdBy?: number): Promise<WebhookResponseDto> {
    try {
      this.logger.info('Creating new webhook', { data, createdBy });
      
      // Use default template if none provided
      if (!data.payloadTemplate || Object.keys(data.payloadTemplate).length === 0) {
        data.payloadTemplate = getDefaultTemplate(data.entityType, data.operation);
      }
      
      // Validate webhook configuration
      const urlValidation = validateWebhookConfig({
        name: data.name,
        webhookUrl: data.webhookUrl,
        headers: data.headers,
        payloadTemplate: data.payloadTemplate,
        retryCount: data.retryCount,
        retryDelaySeconds: data.retryDelaySeconds
      });
      
      if (!urlValidation.isValid) {
        throw new AppError(`Webhook validation failed: ${urlValidation.errors.join(', ')}`, 400);
      }
      
      // Validate template
      const templateValidation = validateTemplate(data.payloadTemplate);
      if (!templateValidation.isValid) {
        throw new AppError(`Template validation failed: ${templateValidation.errors.join(', ')}`, 400);
      }
      
      // Create webhook entity
      const webhook = new AutomationWebhook({
        name: data.name,
        description: data.description,
        entityType: data.entityType,
        operation: data.operation,
        webhookUrl: data.webhookUrl,
        headers: data.headers || {},
        payloadTemplate: data.payloadTemplate || {},
        active: data.active !== undefined ? data.active : true,
        retryCount: data.retryCount || 3,
        retryDelaySeconds: data.retryDelaySeconds || 30,
        createdBy: createdBy
      });
      
      // Validate entity
      const entityErrors = webhook.validate();
      if (entityErrors.length > 0) {
        throw new AppError(`Webhook entity validation failed: ${entityErrors.join(', ')}`, 400);
      }
      
      // Save to database
      const savedWebhook = await this.webhookRepository.create(webhook);
      
      this.logger.info('Webhook created successfully', { webhookId: savedWebhook.id });
      return mapWebhookToResponseDto(savedWebhook);
    } catch (error) {
      this.logger.error('Error creating webhook', { error, data });
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create webhook', 500);
    }
  }

  async updateWebhook(id: number, data: UpdateWebhookDto, updatedBy?: number): Promise<WebhookResponseDto> {
    try {
      this.logger.info('Updating webhook', { id, data, updatedBy });
      
      // Get existing webhook
      const existingWebhook = await this.webhookRepository.findById(id);
      if (!existingWebhook) {
        throw new AppError(`Webhook with ID ${id} not found`, 404);
      }
      
      // Validate partial webhook configuration if URL is being updated
      if (data.webhookUrl || data.headers || data.payloadTemplate || data.retryCount !== undefined || data.retryDelaySeconds !== undefined) {
        const validation = validateWebhookConfig({
          name: data.name || existingWebhook.name,
          webhookUrl: data.webhookUrl || existingWebhook.webhookUrl,
          headers: data.headers || existingWebhook.headers,
          payloadTemplate: data.payloadTemplate || existingWebhook.payloadTemplate,
          retryCount: data.retryCount !== undefined ? data.retryCount : existingWebhook.retryCount,
          retryDelaySeconds: data.retryDelaySeconds !== undefined ? data.retryDelaySeconds : existingWebhook.retryDelaySeconds
        });
        
        if (!validation.isValid) {
          throw new AppError(`Webhook validation failed: ${validation.errors.join(', ')}`, 400);
        }
      }
      
      // Update webhook
      const updatedWebhook = await this.webhookRepository.update(id, {
        ...data,
        updatedBy
      });
      
      this.logger.info('Webhook updated successfully', { webhookId: id });
      return mapWebhookToResponseDto(updatedWebhook);
    } catch (error) {
      this.logger.error('Error updating webhook', { error, id, data });
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to update webhook with ID ${id}`, 500);
    }
  }

  async getWebhookById(id: number): Promise<WebhookResponseDto | null> {
    try {
      this.logger.debug('Getting webhook by ID', { id });
      
      const webhook = await this.webhookRepository.findById(id);
      if (!webhook) {
        return null;
      }
      
      return mapWebhookToResponseDto(webhook);
    } catch (error) {
      this.logger.error('Error getting webhook by ID', { error, id });
      throw new AppError(`Failed to get webhook with ID ${id}`, 500);
    }
  }

  async getWebhooks(filters?: WebhookFilterParamsDto): Promise<{
    data: WebhookResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      this.logger.debug('Getting webhooks with filters', { filters });
      
      const result = await this.webhookRepository.findWithFilters(filters || {});
      
      return {
        data: result.data.map(webhook => mapWebhookToResponseDto(webhook)),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize
      };
    } catch (error) {
      this.logger.error('Error getting webhooks', { error, filters });
      throw new AppError('Failed to get webhooks', 500);
    }
  }

  async deleteWebhook(id: number): Promise<boolean> {
    try {
      this.logger.info('Deleting webhook', { id });
      
      const webhook = await this.webhookRepository.findById(id);
      if (!webhook) {
        throw new AppError(`Webhook with ID ${id} not found`, 404);
      }
      
      await this.webhookRepository.delete(id);
      
      this.logger.info('Webhook deleted successfully', { webhookId: id });
      return true;
    } catch (error) {
      this.logger.error('Error deleting webhook', { error, id });
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to delete webhook with ID ${id}`, 500);
    }
  }

  async toggleWebhookActive(id: number): Promise<WebhookResponseDto> {
    try {
      this.logger.info('Toggling webhook active status', { id });
      
      const updatedWebhook = await this.webhookRepository.toggleActive(id);
      
      this.logger.info('Webhook active status toggled', { webhookId: id, active: updatedWebhook.active });
      return mapWebhookToResponseDto(updatedWebhook);
    } catch (error) {
      this.logger.error('Error toggling webhook active status', { error, id });
      throw new AppError(`Failed to toggle webhook with ID ${id}`, 500);
    }
  }

  async testWebhook(data: TestWebhookDto): Promise<TestWebhookResponseDto> {
    try {
      this.logger.info('Testing webhook', { 
        url: data.webhookUrl,
        hasHeaders: !!data.headers && Object.keys(data.headers).length > 0
      });
      
      // Test the webhook URL
      const result = await testWebhookUrl(
        data.webhookUrl,
        data.headers,
        data.payload
      );
      
      this.logger.info('Webhook test completed', {
        url: data.webhookUrl,
        success: result.success,
        statusCode: result.statusCode,
        responseTime: result.responseTime
      });
      
      return {
        success: result.success,
        responseStatus: result.statusCode || 0,
        responseBody: result.responseBody || '',
        executionTimeMs: result.responseTime,
        errorMessage: result.error
      };
      
    } catch (error) {
      this.logger.error('Error testing webhook', { error, data });
      
      return {
        success: false,
        responseStatus: 500,
        responseBody: '',
        executionTimeMs: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async triggerWebhook(
    entityType: AutomationEntityType, 
    operation: AutomationOperation, 
    entityData: any, 
    entityId?: number
  ): Promise<void> {
    try {
      this.logger.debug('Triggering webhooks', { entityType, operation, entityId });
      
      // Find active webhooks for this trigger
      const webhooks = await this.webhookRepository.findActiveTriggers(entityType, operation);
      
      if (webhooks.length === 0) {
        this.logger.debug('No active webhooks found for trigger', { entityType, operation });
        return;
      }
      
      this.logger.info(`Found ${webhooks.length} webhooks to trigger`, { entityType, operation });
      
      // Execute webhooks asynchronously
      const promises = webhooks.map(webhook => 
        this.executeWebhook(webhook, entityData, entityId).catch(error => {
          this.logger.error('Error executing webhook', { error, webhookId: webhook.id });
        })
      );
      
      await Promise.allSettled(promises);
    } catch (error) {
      this.logger.error('Error triggering webhooks', { error, entityType, operation });
      // Don't throw error to avoid breaking the main operation
    }
  }

  // ============================================================================
  // SCHEDULE MANAGEMENT
  // ============================================================================

  async createSchedule(data: CreateScheduleDto, createdBy?: number): Promise<ScheduleResponseDto> {
    try {
      this.logger.info('Creating new schedule', { data, createdBy });
      
      // Validate cron expression
      const cronValidation = validateCronExpression(data.cronExpression);
      if (!cronValidation.isValid) {
        throw new AppError(`Invalid cron expression: ${cronValidation.errors.join(', ')}`, 400);
      }
      
      // Calculate next run time
      const nextRunAt = getNextRunTime(data.cronExpression, data.timezone || 'UTC');
      
      // Create schedule entity
      const schedule = new AutomationSchedule({
        name: data.name,
        description: data.description,
        cronExpression: data.cronExpression,
        webhookUrl: data.webhookUrl,
        headers: data.headers || {},
        payload: data.payload || {},
        timezone: data.timezone || 'UTC',
        active: data.active !== undefined ? data.active : true,
        nextRunAt,
        createdBy: createdBy
      });
      
      // Validate entity
      const entityErrors = schedule.validate();
      if (entityErrors.length > 0) {
        throw new AppError(`Schedule entity validation failed: ${entityErrors.join(', ')}`, 400);
      }
      
      // Save to database
      const savedSchedule = await this.scheduleRepository.create(schedule);
      
      this.logger.info('Schedule created successfully', { scheduleId: savedSchedule.id });
      return mapScheduleToResponseDto(savedSchedule);
    } catch (error) {
      this.logger.error('Error creating schedule', { error, data });
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create schedule', 500);
    }
  }

  async updateSchedule(id: number, data: UpdateScheduleDto, updatedBy?: number): Promise<ScheduleResponseDto> {
    try {
      this.logger.info('Updating schedule', { id, data, updatedBy });
      
      // Get existing schedule
      const existingSchedule = await this.scheduleRepository.findById(id);
      if (!existingSchedule) {
        throw new AppError(`Schedule with ID ${id} not found`, 404);
      }
      
      // Validate cron expression if it's being updated
      let nextRunAt = existingSchedule.nextRunAt;
      if (data.cronExpression) {
        const cronValidation = validateCronExpression(data.cronExpression);
        if (!cronValidation.isValid) {
          throw new AppError(`Invalid cron expression: ${cronValidation.errors.join(', ')}`, 400);
        }
        
        // Recalculate next run time
        nextRunAt = getNextRunTime(
          data.cronExpression, 
          data.timezone || existingSchedule.timezone
        );
      } else if (data.timezone && data.timezone !== existingSchedule.timezone) {
        // Recalculate if timezone changed
        nextRunAt = getNextRunTime(
          existingSchedule.cronExpression, 
          data.timezone
        );
      }
      
      // Update schedule
      const updatedSchedule = await this.scheduleRepository.update(id, {
        ...data,
        nextRunAt,
        updatedBy
      });
      
      this.logger.info('Schedule updated successfully', { scheduleId: id });
      return mapScheduleToResponseDto(updatedSchedule);
    } catch (error) {
      this.logger.error('Error updating schedule', { error, id, data });
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to update schedule with ID ${id}`, 500);
    }
  }

  async getScheduleById(id: number): Promise<ScheduleResponseDto | null> {
    try {
      this.logger.debug('Getting schedule by ID', { id });
      
      const schedule = await this.scheduleRepository.findById(id);
      if (!schedule) {
        return null;
      }
      
      return mapScheduleToResponseDto(schedule);
    } catch (error) {
      this.logger.error('Error getting schedule by ID', { error, id });
      throw new AppError(`Failed to get schedule with ID ${id}`, 500);
    }
  }

  async getSchedules(filters?: ScheduleFilterParamsDto): Promise<{
    data: ScheduleResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      this.logger.debug('Getting schedules with filters', { filters });
      
      const result = await this.scheduleRepository.findWithFilters(filters || {});
      
      return {
        data: result.data.map(schedule => mapScheduleToResponseDto(schedule)),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize
      };
    } catch (error) {
      this.logger.error('Error getting schedules', { error, filters });
      throw new AppError('Failed to get schedules', 500);
    }
  }

  async deleteSchedule(id: number): Promise<boolean> {
    try {
      this.logger.info('Deleting schedule', { id });
      
      const schedule = await this.scheduleRepository.findById(id);
      if (!schedule) {
        throw new AppError(`Schedule with ID ${id} not found`, 404);
      }
      
      await this.scheduleRepository.delete(id);
      
      this.logger.info('Schedule deleted successfully', { scheduleId: id });
      return true;
    } catch (error) {
      this.logger.error('Error deleting schedule', { error, id });
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to delete schedule with ID ${id}`, 500);
    }
  }

  async toggleScheduleActive(id: number): Promise<ScheduleResponseDto> {
    try {
      this.logger.info('Toggling schedule active status', { id });
      
      const updatedSchedule = await this.scheduleRepository.toggleActive(id);
      
      this.logger.info('Schedule active status toggled', { scheduleId: id, active: updatedSchedule.active });
      return mapScheduleToResponseDto(updatedSchedule);
    } catch (error) {
      this.logger.error('Error toggling schedule active status', { error, id });
      throw new AppError(`Failed to toggle schedule with ID ${id}`, 500);
    }
  }

  async executeSchedule(id: number): Promise<AutomationExecution> {
    try {
      this.logger.info('Manually executing schedule', { id });
      
      const schedule = await this.scheduleRepository.findById(id);
      if (!schedule) {
        throw new AppError(`Schedule with ID ${id} not found`, 404);
      }
      
      // Execute the scheduled job
      const execution = await this.executeScheduledJob(schedule);
      
      // Mark schedule as executed
      await this.scheduleRepository.markAsExecuted(id);
      
      this.logger.info('Schedule executed successfully', { scheduleId: id, executionId: execution.id });
      return execution;
    } catch (error) {
      this.logger.error('Error executing schedule', { error, id });
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to execute schedule with ID ${id}`, 500);
    }
  }

  async getDueSchedules(): Promise<ScheduleResponseDto[]> {
    try {
      this.logger.debug('Getting due schedules');
      
      const schedules = await this.scheduleRepository.findDueSchedules();
      return schedules.map(schedule => mapScheduleToResponseDto(schedule));
    } catch (error) {
      this.logger.error('Error getting due schedules', { error });
      throw new AppError('Failed to get due schedules', 500);
    }
  }

  async processDueSchedules(): Promise<void> {
    try {
      this.logger.info('Processing due schedules');
      
      const dueSchedules = await this.scheduleRepository.findDueSchedules();
      
      if (dueSchedules.length === 0) {
        this.logger.debug('No due schedules found');
        return;
      }
      
      this.logger.info(`Processing ${dueSchedules.length} due schedules`);
      
      for (const schedule of dueSchedules) {
        try {
          // Execute the scheduled job
          await this.executeScheduledJob(schedule);
          
          // Mark as executed and calculate next run time
          const nextRunAt = getNextRunTime(schedule.cronExpression, schedule.timezone);
          await this.scheduleRepository.updateNextRunTime(schedule.id, nextRunAt);
          await this.scheduleRepository.markAsExecuted(schedule.id);
          
          this.logger.info('Schedule processed successfully', { 
            scheduleId: schedule.id, 
            nextRunAt 
          });
        } catch (error) {
          this.logger.error('Error processing schedule', { 
            error, 
            scheduleId: schedule.id 
          });
        }
      }
    } catch (error) {
      this.logger.error('Error processing due schedules', { error });
      // Don't throw error to avoid breaking the scheduler
    }
  }

  // ============================================================================
  // EXECUTION MANAGEMENT
  // ============================================================================

  async getExecutions(filters?: ExecutionFilterParamsDto): Promise<{
    data: ExecutionResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      this.logger.debug('Getting executions with filters', { filters });
      
      const result = await this.executionRepository.findWithFilters(filters || {});
      
      // Ensure we have valid data
      const executions = result?.data || [];
      const mappedExecutions = executions.map(execution => {
        try {
          return mapExecutionToResponseDto(execution);
        } catch (e) {
          this.logger.warn('Failed to map execution', { execution, error: e });
          return null;
        }
      }).filter(Boolean) as ExecutionResponseDto[];
      
      return {
        data: mappedExecutions,
        total: result?.total || 0,
        page: result?.page || filters?.page || 1,
        pageSize: result?.pageSize || filters?.limit || 10
      };
    } catch (error) {
      this.logger.error('Error getting executions', { error, filters });
      // Return empty result instead of throwing
      return {
        data: [],
        total: 0,
        page: filters?.page || 1,
        pageSize: filters?.limit || 10
      };
    }
  }

  async getExecutionById(id: number): Promise<ExecutionResponseDto | null> {
    try {
      this.logger.debug('Getting execution by ID', { id });
      
      const execution = await this.executionRepository.findById(id);
      if (!execution) {
        return null;
      }
      
      return mapExecutionToResponseDto(execution);
    } catch (error) {
      this.logger.error('Error getting execution by ID', { error, id });
      throw new AppError(`Failed to get execution with ID ${id}`, 500);
    }
  }

  async getExecutionsByAutomation(automationType: AutomationType, automationId: number): Promise<ExecutionResponseDto[]> {
    try {
      this.logger.debug('Getting executions by automation', { automationType, automationId });
      
      const executions = await this.executionRepository.findByAutomation(automationType, automationId);
      
      return executions.map(execution => mapExecutionToResponseDto(execution));
    } catch (error) {
      this.logger.error('Error getting executions by automation', { error, automationType, automationId });
      throw new AppError(`Failed to get executions for ${automationType}:${automationId}`, 500);
    }
  }

  async retryExecution(id: number): Promise<AutomationExecution> {
    try {
      this.logger.info('Retrying execution', { id });
      
      const execution = await this.executionRepository.findById(id);
      if (!execution) {
        throw new AppError(`Execution with ID ${id} not found`, 404);
      }
      
      if (execution.status !== AutomationExecutionStatus.FAILED) {
        throw new AppError('Only failed executions can be retried', 400);
      }
      
      // Get the original automation to retry
      if (execution.automationType === AutomationType.WEBHOOK) {
        const webhook = await this.webhookRepository.findById(execution.automationId);
        if (!webhook) {
          throw new AppError('Original webhook not found', 404);
        }
        
        // Retry webhook execution
        const retryExecution = await this.executeWebhook(webhook, {}, execution.entityId);
        return retryExecution;
      } else if (execution.automationType === AutomationType.SCHEDULE) {
        const schedule = await this.scheduleRepository.findById(execution.automationId);
        if (!schedule) {
          throw new AppError('Original schedule not found', 404);
        }
        
        // Retry schedule execution
        const retryExecution = await this.executeScheduledJob(schedule);
        return retryExecution;
      }
      
      throw new AppError('Unsupported automation type for retry', 400);
    } catch (error) {
      this.logger.error('Error retrying execution', { error, id });
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to retry execution with ID ${id}`, 500);
    }
  }

  async cleanupOldExecutions(olderThanDays: number = 30): Promise<number> {
    try {
      this.logger.info('Cleaning up old executions', { olderThanDays });
      
      const deletedCount = await this.executionRepository.cleanupOldExecutions(olderThanDays);
      
      this.logger.info('Old executions cleaned up', { deletedCount });
      return deletedCount;
    } catch (error) {
      this.logger.error('Error cleaning up old executions', { error, olderThanDays });
      throw new AppError('Failed to cleanup old executions', 500);
    }
  }

  // ============================================================================
  // DASHBOARD & ANALYTICS
  // ============================================================================

  async getDashboardData(): Promise<AutomationDashboardDto> {
    try {
      this.logger.debug('Getting automation dashboard data');
      
      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled([
        this.webhookRepository.count(),
        this.webhookRepository.countActive(),
        this.scheduleRepository.count(),
        this.scheduleRepository.countActive(),
        this.executionRepository.getExecutionStats(),
        this.executionRepository.findRecent(10),
        this.executionRepository.getTopFailedAutomations(5)
      ]);
      
      // Extract values with defaults for failed promises
      const totalWebhooks = results[0].status === 'fulfilled' ? results[0].value : 0;
      const activeWebhooks = results[1].status === 'fulfilled' ? results[1].value : 0;
      const totalSchedules = results[2].status === 'fulfilled' ? results[2].value : 0;
      const activeSchedules = results[3].status === 'fulfilled' ? results[3].value : 0;
      
      const executionStats = results[4].status === 'fulfilled' ? results[4].value : {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        successRate: 0
      };
      
      const recentExecutions = results[5].status === 'fulfilled' ? results[5].value : [];
      const topFailedAutomations = results[6].status === 'fulfilled' ? results[6].value : [];
      
      return {
        totalWebhooks,
        activeWebhooks,
        totalSchedules,
        activeSchedules,
        totalExecutions: executionStats.totalExecutions || 0,
        successfulExecutions: executionStats.successfulExecutions || 0,
        failedExecutions: executionStats.failedExecutions || 0,
        successRate: executionStats.successRate || 0,
        recentExecutions: recentExecutions.map(execution => mapExecutionToResponseDto(execution)),
        topFailedAutomations: topFailedAutomations.map(item => ({
          id: item.automationId,
          name: `${item.automationType} #${item.automationId}`,
          type: item.automationType,
          failureCount: item.failureCount
        }))
      };
    } catch (error) {
      this.logger.error('Error getting dashboard data', { error });
      // Return empty dashboard data instead of throwing
      return {
        totalWebhooks: 0,
        activeWebhooks: 0,
        totalSchedules: 0,
        activeSchedules: 0,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        successRate: 0,
        recentExecutions: [],
        topFailedAutomations: []
      };
    }
  }

  async getExecutionStats(fromDate?: Date, toDate?: Date): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
  }> {
    try {
      this.logger.debug('Getting execution statistics', { fromDate, toDate });
      
      return await this.executionRepository.getExecutionStats(fromDate, toDate);
    } catch (error) {
      this.logger.error('Error getting execution statistics', { error, fromDate, toDate });
      throw new AppError('Failed to get execution statistics', 500);
    }
  }

  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    totalWebhooks: number;
    activeWebhooks: number;
    totalSchedules: number;
    activeSchedules: number;
    recentFailures: number;
    avgExecutionTime: number;
  }> {
    try {
      this.logger.debug('Getting automation health status');
      
      const [
        totalWebhooks,
        activeWebhooks,
        totalSchedules,
        activeSchedules,
        recentExecutions
      ] = await Promise.all([
        this.webhookRepository.count(),
        this.webhookRepository.countActive(),
        this.scheduleRepository.count(),
        this.scheduleRepository.countActive(),
        this.executionRepository.findRecent(50)
      ]);
      
      // Calculate recent failures and average execution time
      const recentFailures = recentExecutions.filter(exec => 
        exec.status === AutomationExecutionStatus.FAILED
      ).length;
      
      const executionsWithTime = recentExecutions.filter(exec => exec.executionTimeMs);
      const avgExecutionTime = executionsWithTime.length > 0
        ? executionsWithTime.reduce((sum, exec) => sum + (exec.executionTimeMs || 0), 0) / executionsWithTime.length
        : 0;
      
      // System is healthy if recent failure rate is below 20%
      const isHealthy = recentExecutions.length === 0 || (recentFailures / recentExecutions.length) < 0.2;
      
      return {
        isHealthy,
        totalWebhooks,
        activeWebhooks,
        totalSchedules,
        activeSchedules,
        recentFailures,
        avgExecutionTime: Math.round(avgExecutionTime)
      };
    } catch (error) {
      this.logger.error('Error getting health status', { error });
      throw new AppError('Failed to get health status', 500);
    }
  }

  // ============================================================================
  // SYSTEM MANAGEMENT
  // ============================================================================

  async initializeSystem(): Promise<void> {
    try {
      this.logger.info('Initializing automation system');
      
      // Initialize any system components if needed
      // For now, this is a placeholder for future initialization logic
      
      this.logger.info('Automation system initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing automation system', { error });
      throw new AppError('Failed to initialize automation system', 500);
    }
  }

  async validateWebhookConfig(data: CreateWebhookDto | UpdateWebhookDto): Promise<string[]> {
    try {
      const validation = validateWebhookConfig({
        name: 'name' in data && data.name ? data.name : 'test',
        webhookUrl: 'webhookUrl' in data && data.webhookUrl ? data.webhookUrl : 'https://example.com',
        headers: data.headers,
        payloadTemplate: data.payloadTemplate,
        retryCount: data.retryCount,
        retryDelaySeconds: data.retryDelaySeconds
      });
      
      return validation.errors;
    } catch (error) {
      this.logger.error('Error validating webhook config', { error, data });
      return ['Validation error occurred'];
    }
  }

  async validateScheduleConfig(data: CreateScheduleDto | UpdateScheduleDto): Promise<string[]> {
    try {
      const errors: string[] = [];
      
      // Validate cron expression if present
      if ('cronExpression' in data && data.cronExpression) {
        const cronValidation = validateCronExpression(data.cronExpression);
        if (!cronValidation.isValid) {
          errors.push(...cronValidation.errors);
        }
      }
      
      // Validate webhook URL if present
      if ('webhookUrl' in data && data.webhookUrl) {
        const urlValidation = validateWebhookConfig({
          name: 'name' in data ? data.name || 'test' : 'test',
          webhookUrl: data.webhookUrl,
          headers: data.headers,
          payloadTemplate: data.payload
        });
        errors.push(...urlValidation.errors);
      }
      
      return errors;
    } catch (error) {
      this.logger.error('Error validating schedule config', { error, data });
      return ['Validation error occurred'];
    }
  }

  async parseCronExpression(cronExpression: string, timezone: string = 'UTC'): Promise<{
    isValid: boolean;
    description: string;
    nextRun?: Date;
    errors?: string[];
  }> {
    try {
      const validation = validateCronExpression(cronExpression);
      
      if (!validation.isValid) {
        return {
          isValid: false,
          description: 'Invalid cron expression',
          errors: validation.errors
        };
      }
      
      const description = describeCronExpression(cronExpression);
      const nextRun = getNextRunTime(cronExpression, timezone);
      
      return {
        isValid: true,
        description,
        nextRun
      };
    } catch (error) {
      this.logger.error('Error parsing cron expression', { error, cronExpression, timezone });
      return {
        isValid: false,
        description: 'Error parsing cron expression',
        errors: ['Failed to parse cron expression']
      };
    }
  }

  // ============================================================================
  // TEMPLATE HELPER METHODS
  // ============================================================================

  async getAvailableVariables(entityType: AutomationEntityType): Promise<{
    entityVariables: string[];
    systemVariables: string[];
  }> {
    return {
      entityVariables: ENTITY_VARIABLES[entityType] || [],
      systemVariables: SYSTEM_VARIABLES
    };
  }

  async getDefaultTemplateForEntity(entityType: AutomationEntityType, operation: AutomationOperation): Promise<Record<string, any>> {
    return getDefaultTemplate(entityType, operation);
  }

  async previewTemplate(
    template: Record<string, any>,
    entityType: AutomationEntityType,
    operation: AutomationOperation
  ): Promise<string> {
    try {
      // Generate sample data
      const sampleData = this.generateSampleData(entityType);
      
      // Build payload
      const payload = buildPayload(template, sampleData, {
        entityType,
        operation,
        webhookName: 'Sample Webhook',
        webhookId: 1
      });
      
      // Return formatted JSON
      return JSON.stringify(payload, null, 2);
    } catch (error) {
      this.logger.error('Error previewing template', { error });
      return '{"error": "Failed to preview template"}';
    }
  }

  private generateSampleData(entityType: AutomationEntityType): any {
    const now = new Date();
    
    switch (entityType) {
      case AutomationEntityType.USER:
        return {
          id: 123,
          email: 'john.doe@example.com',
          username: 'johndoe',
          firstName: 'John',
          lastName: 'Doe',
          role: 'admin',
          status: 'active',
          lastLogin: now.toISOString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };
        
      case AutomationEntityType.CUSTOMER:
        return {
          id: 456,
          name: 'Acme Corporation',
          email: 'contact@acme.com',
          phone: '+1-555-1234',
          company: 'Acme Corp',
          notes: 'Important client',
          status: 'active',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          createdBy: 123
        };
        
      case AutomationEntityType.APPOINTMENT:
        return {
          id: 789,
          title: 'Project Review Meeting',
          description: 'Quarterly project review',
          startDate: now.toISOString(),
          endDate: new Date(now.getTime() + 3600000).toISOString(),
          location: 'Conference Room A',
          status: 'scheduled',
          customerId: 456,
          customerName: 'Acme Corporation',
          customerEmail: 'contact@acme.com',
          userId: 123,
          userName: 'John Doe',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };
        
      case AutomationEntityType.REQUEST:
        return {
          id: 321,
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1-555-5678',
          subject: 'Website Redesign',
          message: 'We need a complete website redesign...',
          service: 'Web Development',
          budget: '$10,000 - $25,000',
          urgency: 'high',
          status: 'new',
          source: 'website',
          customerId: null,
          assignedTo: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };
        
      default:
        return {
          id: 999,
          type: entityType,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async executeWebhook(webhook: AutomationWebhook, entityData: any, entityId?: number): Promise<AutomationExecution> {
    const startTime = Date.now();
    
    try {
      // Execute webhook using simplified executor
      const result = await executeWebhook(
        {
          id: webhook.id,
          name: webhook.name,
          webhookUrl: webhook.webhookUrl,
          headers: webhook.headers,
          payloadTemplate: webhook.payloadTemplate,
          entityType: webhook.entityType,
          operation: webhook.operation
        },
        entityData,
        entityId
      );
      
      // Create execution record
      const execution = new AutomationExecution({
        automationType: AutomationType.WEBHOOK,
        automationId: webhook.id,
        entityId,
        entityType: webhook.entityType,
        status: result.success ? AutomationExecutionStatus.SUCCESS : AutomationExecutionStatus.FAILED,
        responseStatus: result.statusCode,
        responseBody: result.responseBody,
        errorMessage: result.error,
        executionTimeMs: result.responseTime,
        executedAt: new Date(),
        retryAttempt: 0
      });
      
      // Save execution record
      const savedExecution = await this.executionRepository.create(execution);
      
      this.logger.info('Webhook executed', {
        webhookId: webhook.id,
        executionId: savedExecution.id,
        status: savedExecution.status,
        executionTime: savedExecution.executionTimeMs
      });
      
      return savedExecution;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Create failed execution record
      const execution = new AutomationExecution({
        automationType: AutomationType.WEBHOOK,
        automationId: webhook.id,
        entityId,
        entityType: webhook.entityType,
        status: AutomationExecutionStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: executionTime,
        executedAt: new Date(),
        retryAttempt: 0
      });
      
      return await this.executionRepository.create(execution);
    }
  }

  private async executeScheduledJob(schedule: AutomationSchedule): Promise<AutomationExecution> {
    const startTime = Date.now();
    
    // Create execution record
    const execution = new AutomationExecution({
      automationType: AutomationType.SCHEDULE,
      automationId: schedule.id,
      status: AutomationExecutionStatus.SUCCESS,
      executedAt: new Date(),
      retryAttempt: 0
    });
    
    try {
      // Make HTTP request with schedule payload
      const response = await fetch(schedule.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Rising-BSM-Automation/1.0',
          ...schedule.headers
        },
        body: JSON.stringify({
          ...schedule.payload,
          scheduleName: schedule.name,
          scheduledAt: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      const executionTime = Date.now() - startTime;
      const responseBody = await response.text();
      
      if (response.ok) {
        execution.markAsSuccessful(response.status, responseBody, executionTime);
      } else {
        execution.markAsFailed(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          responseBody,
          executionTime
        );
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      execution.markAsFailed(
        error instanceof Error ? error.message : 'Unknown error',
        undefined,
        undefined,
        executionTime
      );
    }
    
    // Save execution record
    const savedExecution = await this.executionRepository.create(execution);
    
    this.logger.info('Scheduled job executed', {
      scheduleId: schedule.id,
      executionId: savedExecution.id,
      status: savedExecution.status,
      executionTime: savedExecution.executionTimeMs
    });
    
    return savedExecution;
  }

  // ============================================================================
  // BASESERVICE ABSTRACT METHOD IMPLEMENTATIONS
  // ============================================================================

  /**
   * Convert entity to DTO
   */
  toDTO(entity: AutomationWebhook): WebhookResponseDto {
    return mapWebhookToResponseDto(entity);
  }

  /**
   * Convert DTO to entity
   */
  protected toEntity(dto: CreateWebhookDto | UpdateWebhookDto, existingEntity?: AutomationWebhook): Partial<AutomationWebhook> {
    const result: Partial<AutomationWebhook> = {};
    
    if ('name' in dto && dto.name !== undefined) result.name = dto.name;
    if ('description' in dto && dto.description !== undefined) result.description = dto.description;
    if ('entityType' in dto && dto.entityType !== undefined) result.entityType = dto.entityType;
    if ('operation' in dto && dto.operation !== undefined) result.operation = dto.operation;
    if ('webhookUrl' in dto && dto.webhookUrl !== undefined) result.webhookUrl = dto.webhookUrl;
    if (dto.headers !== undefined) result.headers = dto.headers;
    if (dto.payloadTemplate !== undefined) result.payloadTemplate = dto.payloadTemplate;
    if (dto.active !== undefined) result.active = dto.active;
    if (dto.retryCount !== undefined) result.retryCount = dto.retryCount;
    if (dto.retryDelaySeconds !== undefined) result.retryDelaySeconds = dto.retryDelaySeconds;
    
    return result;
  }

  /**
   * Get validation schema for creation
   */
  protected getCreateValidationSchema(): any {
    return {
      name: { required: true, type: 'string', maxLength: 100 },
      description: { required: false, type: 'string' },
      entityType: { required: true, type: 'string' },
      operation: { required: true, type: 'string' },
      webhookUrl: { required: true, type: 'string', format: 'url' },
      headers: { required: false, type: 'object' },
      payloadTemplate: { required: false, type: 'object' },
      active: { required: false, type: 'boolean' },
      retryCount: { required: false, type: 'number', min: 0, max: 10 },
      retryDelaySeconds: { required: false, type: 'number', min: 1, max: 3600 }
    };
  }

  /**
   * Get validation schema for updates
   */
  protected getUpdateValidationSchema(): any {
    return {
      name: { required: false, type: 'string', maxLength: 100 },
      description: { required: false, type: 'string' },
      entityType: { required: false, type: 'string' },
      operation: { required: false, type: 'string' },
      webhookUrl: { required: false, type: 'string', format: 'url' },
      headers: { required: false, type: 'object' },
      payloadTemplate: { required: false, type: 'object' },
      active: { required: false, type: 'boolean' },
      retryCount: { required: false, type: 'number', min: 0, max: 10 },
      retryDelaySeconds: { required: false, type: 'number', min: 1, max: 3600 }
    };
  }
}
