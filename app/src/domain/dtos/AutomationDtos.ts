import { BaseResponseDto, BaseFilterParamsDto } from './BaseDto';
import { AutomationEntityType, AutomationOperation, AutomationWebhook } from '../entities/AutomationWebhook';
import { AutomationSchedule } from '../entities/AutomationSchedule';
import { AutomationType, AutomationExecutionStatus, AutomationExecution } from '../entities/AutomationExecution';

// ============================================================================
// WEBHOOK DTOs
// ============================================================================

export interface AutomationWebhookDto {
  id: number;
  name: string;
  description?: string;
  entityType: AutomationEntityType;
  operation: AutomationOperation;
  webhookUrl: string;
  headers: Record<string, string>;
  payloadTemplate: Record<string, any>;
  active: boolean;
  retryCount: number;
  retryDelaySeconds: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: number;
  updatedBy?: number;
}

export interface CreateWebhookDto {
  name: string;
  description?: string;
  entityType: AutomationEntityType;
  operation: AutomationOperation;
  webhookUrl: string;
  headers?: Record<string, string>;
  payloadTemplate?: Record<string, any>;
  active?: boolean;
  retryCount?: number;
  retryDelaySeconds?: number;
}

export interface UpdateWebhookDto {
  name?: string;
  description?: string;
  entityType?: AutomationEntityType;
  operation?: AutomationOperation;
  webhookUrl?: string;
  headers?: Record<string, string>;
  payloadTemplate?: Record<string, any>;
  active?: boolean;
  retryCount?: number;
  retryDelaySeconds?: number;
}

export interface WebhookResponseDto extends BaseResponseDto {
  name: string;
  description?: string;
  entityType: AutomationEntityType;
  operation: AutomationOperation;
  webhookUrl: string;
  headers: Record<string, string>;
  payloadTemplate: Record<string, any>;
  active: boolean;
  retryCount: number;
  retryDelaySeconds: number;
  triggerKey: string;
  isValid: boolean;
  validationErrors?: string[];
}

// ============================================================================
// SCHEDULE DTOs
// ============================================================================

export interface AutomationScheduleDto {
  id: number;
  name: string;
  description?: string;
  cronExpression: string;
  webhookUrl: string;
  headers: Record<string, string>;
  payload: Record<string, any>;
  timezone: string;
  active: boolean;
  lastRunAt?: Date | string;
  nextRunAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: number;
  updatedBy?: number;
}

export interface CreateScheduleDto {
  name: string;
  description?: string;
  cronExpression: string;
  webhookUrl: string;
  headers?: Record<string, string>;
  payload?: Record<string, any>;
  timezone?: string;
  active?: boolean;
}

export interface UpdateScheduleDto {
  name?: string;
  description?: string;
  cronExpression?: string;
  webhookUrl?: string;
  headers?: Record<string, string>;
  payload?: Record<string, any>;
  timezone?: string;
  active?: boolean;
}

export interface ScheduleResponseDto extends BaseResponseDto {
  name: string;
  description?: string;
  cronExpression: string;
  webhookUrl: string;
  headers: Record<string, string>;
  payload: Record<string, any>;
  timezone: string;
  active: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  scheduleDescription: string;
  isDue: boolean;
  isValid: boolean;
  validationErrors?: string[];
}

// ============================================================================
// EXECUTION DTOs
// ============================================================================

export interface AutomationExecutionDto {
  id: number;
  automationType: AutomationType;
  automationId: number;
  entityId?: number;
  entityType?: string;
  status: AutomationExecutionStatus;
  responseStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  executionTimeMs?: number;
  executedAt: Date | string;
  retryAttempt: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ExecutionResponseDto extends BaseResponseDto {
  automationType: AutomationType;
  automationId: number;
  automationName?: string;
  entityId?: number;
  entityType?: string;
  status: AutomationExecutionStatus;
  responseStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  executionTimeMs?: number;
  executedAt: string;
  retryAttempt: number;
  statusDescription: string;
  executionDuration: string;
  isSuccessful: boolean;
  isFailed: boolean;
  isRetrying: boolean;
  hasSuccessfulResponse: boolean;
}

// ============================================================================
// FILTER & SEARCH DTOs
// ============================================================================

export interface WebhookFilterParamsDto extends BaseFilterParamsDto {
  entityType?: AutomationEntityType;
  operation?: AutomationOperation;
  active?: boolean;
  sortDirection?: 'asc' | 'desc';
}

export interface ScheduleFilterParamsDto extends BaseFilterParamsDto {
  active?: boolean;
  timezone?: string;
  isDue?: boolean;
  sortDirection?: 'asc' | 'desc';
}

export interface ExecutionFilterParamsDto extends BaseFilterParamsDto {
  automationType?: AutomationType;
  automationId?: number;
  status?: AutomationExecutionStatus;
  entityType?: string;
  entityId?: number;
  dateFrom?: string;
  dateTo?: string;
  sortDirection?: 'asc' | 'desc';
}

// ============================================================================
// COMBINED DTOs
// ============================================================================

export interface AutomationDashboardDto {
  totalWebhooks: number;
  activeWebhooks: number;
  totalSchedules: number;
  activeSchedules: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  recentExecutions: ExecutionResponseDto[];
  topFailedAutomations: {
    id: number;
    name: string;
    type: AutomationType;
    failureCount: number;
  }[];
}

export interface TestWebhookDto {
  webhookUrl: string;
  headers?: Record<string, string>;
  payload?: Record<string, any>;
}

export interface TestWebhookResponseDto {
  success: boolean;
  responseStatus: number;
  responseBody: string;
  executionTimeMs: number;
  errorMessage?: string;
  // Additional metadata fields
  serviceType?: string;
  methodUsed?: string;
  validation?: {
    warnings: string[];
    recommendations: string[];
    errors: string[];
  };
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

/**
 * Maps an AutomationWebhook entity to a WebhookResponseDto
 */
export function mapWebhookToResponseDto(webhook: AutomationWebhook): WebhookResponseDto {
  return {
    id: webhook.id,
    name: webhook.name,
    description: webhook.description,
    entityType: webhook.entityType,
    operation: webhook.operation,
    webhookUrl: webhook.webhookUrl,
    headers: webhook.headers,
    payloadTemplate: webhook.payloadTemplate,
    active: webhook.active,
    retryCount: webhook.retryCount,
    retryDelaySeconds: webhook.retryDelaySeconds,
    triggerKey: webhook.getTriggerKey(),
    isValid: webhook.isValid(),
    validationErrors: webhook.isValid() ? undefined : webhook.validate(),
    createdAt: webhook.createdAt.toISOString(),
    updatedAt: webhook.updatedAt.toISOString(),
    createdBy: webhook.createdBy,
    updatedBy: webhook.updatedBy
  };
}

/**
 * Maps an AutomationSchedule entity to a ScheduleResponseDto
 */
export function mapScheduleToResponseDto(schedule: AutomationSchedule): ScheduleResponseDto {
  return {
    id: schedule.id,
    name: schedule.name,
    description: schedule.description,
    cronExpression: schedule.cronExpression,
    webhookUrl: schedule.webhookUrl,
    headers: schedule.headers,
    payload: schedule.payload,
    timezone: schedule.timezone,
    active: schedule.active,
    lastRunAt: schedule.lastRunAt?.toISOString(),
    nextRunAt: schedule.nextRunAt?.toISOString(),
    scheduleDescription: schedule.getScheduleDescription(),
    isDue: schedule.isDue(),
    isValid: schedule.isValid(),
    validationErrors: schedule.isValid() ? undefined : schedule.validate(),
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
    createdBy: schedule.createdBy,
    updatedBy: schedule.updatedBy
  };
}

/**
 * Maps an AutomationExecution entity to an ExecutionResponseDto
 */
export function mapExecutionToResponseDto(execution: AutomationExecution, automationName?: string): ExecutionResponseDto {
  return {
    id: execution.id,
    automationType: execution.automationType,
    automationId: execution.automationId,
    automationName,
    entityId: execution.entityId,
    entityType: execution.entityType,
    status: execution.status,
    responseStatus: execution.responseStatus,
    responseBody: execution.responseBody,
    errorMessage: execution.errorMessage,
    executionTimeMs: execution.executionTimeMs,
    executedAt: execution.executedAt.toISOString(),
    retryAttempt: execution.retryAttempt,
    statusDescription: execution.getStatusDescription(),
    executionDuration: execution.getExecutionDuration(),
    isSuccessful: execution.isSuccessful(),
    isFailed: execution.isFailed(),
    isRetrying: execution.isRetrying(),
    hasSuccessfulResponse: execution.hasSuccessfulResponse(),
    createdAt: execution.createdAt.toISOString(),
    updatedAt: execution.updatedAt.toISOString(),
    createdBy: execution.createdBy,
    updatedBy: execution.updatedBy
  };
}
