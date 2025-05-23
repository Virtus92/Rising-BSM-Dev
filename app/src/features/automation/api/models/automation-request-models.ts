/**
 * Automation API Request Models
 * 
 * Request models for automation API endpoints
 */

import { AutomationEntityType, AutomationOperation } from '@/domain/entities/AutomationWebhook';

// ============================================================================
// WEBHOOK REQUEST MODELS
// ============================================================================

/**
 * Create webhook request model
 */
export interface CreateWebhookRequest {
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

/**
 * Update webhook request model
 */
export interface UpdateWebhookRequest {
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

/**
 * Test webhook request model
 */
export interface TestWebhookRequest {
  webhookUrl: string;
  headers?: Record<string, string>;
  payload?: Record<string, any>;
}

// ============================================================================
// SCHEDULE REQUEST MODELS
// ============================================================================

/**
 * Create schedule request model
 */
export interface CreateScheduleRequest {
  name: string;
  description?: string;
  cronExpression: string;
  webhookUrl: string;
  headers?: Record<string, string>;
  payload?: Record<string, any>;
  timezone?: string;
  active?: boolean;
}

/**
 * Update schedule request model
 */
export interface UpdateScheduleRequest {
  name?: string;
  description?: string;
  cronExpression?: string;
  webhookUrl?: string;
  headers?: Record<string, string>;
  payload?: Record<string, any>;
  timezone?: string;
  active?: boolean;
}

// ============================================================================
// UTILITY REQUEST MODELS
// ============================================================================

/**
 * Parse cron expression request model
 */
export interface ParseCronExpressionRequest {
  cronExpression: string;
  timezone?: string;
}
