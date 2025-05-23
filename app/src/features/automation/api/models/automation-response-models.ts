/**
 * Automation API Models
 * 
 * Central export for automation API models
 * We use the DTOs from the domain layer directly for responses
 */

// Request Models
export * from './automation-request-models';

// Response Models - Re-export DTOs from domain layer
export type {
  WebhookResponseDto,
  ScheduleResponseDto,
  ExecutionResponseDto,
  AutomationDashboardDto,
  TestWebhookResponseDto
} from '@/domain/dtos/AutomationDtos';
