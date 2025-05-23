/**
 * API Client for automation management
 */
import { 
  WebhookResponseDto,
  ScheduleResponseDto,
  ExecutionResponseDto,
  CreateWebhookDto,
  UpdateWebhookDto,
  CreateScheduleDto,
  UpdateScheduleDto,
  WebhookFilterParamsDto,
  ScheduleFilterParamsDto,
  ExecutionFilterParamsDto,
  AutomationDashboardDto,
  TestWebhookDto,
  TestWebhookResponseDto
} from '@/domain/dtos/AutomationDtos';
import ApiClient, { ApiResponse, ApiRequestError } from '@/core/api/ApiClient';
import { validateId } from '@/shared/utils/validation-utils';

// API base URLs
const AUTOMATION_API_URL = '/automation';
const WEBHOOKS_API_URL = `${AUTOMATION_API_URL}/webhooks`;
const SCHEDULES_API_URL = `${AUTOMATION_API_URL}/schedules`;
const EXECUTIONS_API_URL = `${AUTOMATION_API_URL}/executions`;

/**
 * Client for automation API requests
 */
export class AutomationClient {
  // ============================================================================
  // WEBHOOK METHODS
  // ============================================================================

  /**
   * Gets all webhooks with optional filtering
   */
  static async getWebhooks(params: WebhookFilterParamsDto = {}): Promise<ApiResponse<{
    data: WebhookResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }>> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/api${WEBHOOKS_API_URL}${queryString ? `?${queryString}` : ''}`;
      
      return await ApiClient.get(url);
    } catch (error: unknown) {
      console.error('Failed to fetch webhooks:', error);
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to fetch webhooks',
        500
      );
    }
  }

  /**
   * Gets a webhook by ID
   */
  static async getWebhookById(id: number | string): Promise<ApiResponse<WebhookResponseDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid webhook ID format - must be a positive number', 400);
      }
      
      return await ApiClient.get(`/api${WEBHOOKS_API_URL}/${validatedId}`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to fetch webhook with ID ${id}`,
        500
      );
    }
  }

  /**
   * Creates a new webhook
   */
  static async createWebhook(data: CreateWebhookDto): Promise<ApiResponse<WebhookResponseDto>> {
    try {
      return await ApiClient.post(`/api${WEBHOOKS_API_URL}`, data);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to create webhook',
        500
      );
    }
  }

  /**
   * Updates a webhook
   */
  static async updateWebhook(id: number | string, data: UpdateWebhookDto): Promise<ApiResponse<WebhookResponseDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid webhook ID format - must be a positive number', 400);
      }
      
      return await ApiClient.put(`/api${WEBHOOKS_API_URL}/${validatedId}`, data);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to update webhook with ID ${id}`,
        500
      );
    }
  }

  /**
   * Deletes a webhook
   */
  static async deleteWebhook(id: number | string): Promise<ApiResponse<void>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid webhook ID format - must be a positive number', 400);
      }
      
      return await ApiClient.delete(`/api${WEBHOOKS_API_URL}/${validatedId}`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to delete webhook with ID ${id}`,
        500
      );
    }
  }

  /**
   * Toggles webhook active status
   */
  static async toggleWebhookActive(id: number | string): Promise<ApiResponse<WebhookResponseDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid webhook ID format - must be a positive number', 400);
      }
      
      return await ApiClient.patch(`/api${WEBHOOKS_API_URL}/${validatedId}/toggle`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to toggle webhook with ID ${id}`,
        500
      );
    }
  }

  /**
   * Tests a webhook configuration
   */
  static async testWebhook(data: TestWebhookDto): Promise<ApiResponse<TestWebhookResponseDto>> {
    try {
      return await ApiClient.post(`/api${WEBHOOKS_API_URL}/test`, data);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to test webhook',
        500
      );
    }
  }

  // ============================================================================
  // SCHEDULE METHODS
  // ============================================================================

  /**
   * Gets all schedules with optional filtering
   */
  static async getSchedules(params: ScheduleFilterParamsDto = {}): Promise<ApiResponse<{
    data: ScheduleResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }>> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/api${SCHEDULES_API_URL}${queryString ? `?${queryString}` : ''}`;
      
      return await ApiClient.get(url);
    } catch (error: unknown) {
      console.error('Failed to fetch schedules:', error);
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to fetch schedules',
        500
      );
    }
  }

  /**
   * Gets a schedule by ID
   */
  static async getScheduleById(id: number | string): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid schedule ID format - must be a positive number', 400);
      }
      
      return await ApiClient.get(`/api${SCHEDULES_API_URL}/${validatedId}`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to fetch schedule with ID ${id}`,
        500
      );
    }
  }

  /**
   * Creates a new schedule
   */
  static async createSchedule(data: CreateScheduleDto): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      return await ApiClient.post(`/api${SCHEDULES_API_URL}`, data);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to create schedule',
        500
      );
    }
  }

  /**
   * Updates a schedule
   */
  static async updateSchedule(id: number | string, data: UpdateScheduleDto): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid schedule ID format - must be a positive number', 400);
      }
      
      return await ApiClient.put(`/api${SCHEDULES_API_URL}/${validatedId}`, data);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to update schedule with ID ${id}`,
        500
      );
    }
  }

  /**
   * Deletes a schedule
   */
  static async deleteSchedule(id: number | string): Promise<ApiResponse<void>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid schedule ID format - must be a positive number', 400);
      }
      
      return await ApiClient.delete(`/api${SCHEDULES_API_URL}/${validatedId}`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to delete schedule with ID ${id}`,
        500
      );
    }
  }

  /**
   * Toggles schedule active status
   */
  static async toggleScheduleActive(id: number | string): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid schedule ID format - must be a positive number', 400);
      }
      
      return await ApiClient.patch(`/api${SCHEDULES_API_URL}/${validatedId}/toggle`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to toggle schedule with ID ${id}`,
        500
      );
    }
  }

  /**
   * Executes a schedule manually
   */
  static async executeSchedule(id: number | string): Promise<ApiResponse<ExecutionResponseDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid schedule ID format - must be a positive number', 400);
      }
      
      return await ApiClient.post(`/api${SCHEDULES_API_URL}/${validatedId}/execute`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to execute schedule with ID ${id}`,
        500
      );
    }
  }

  /**
   * Validates a cron expression
   */
  static async validateCronExpression(cronExpression: string, timezone?: string): Promise<ApiResponse<{
    isValid: boolean;
    description: string;
    nextRun?: string;
    errors?: string[];
  }>> {
    try {
      return await ApiClient.post(`/api${SCHEDULES_API_URL}/validate-cron`, {
        cronExpression,
        timezone
      });
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to validate cron expression',
        500
      );
    }
  }

  // ============================================================================
  // EXECUTION METHODS
  // ============================================================================

  /**
   * Gets execution history with optional filtering
   */
  static async getExecutions(params: ExecutionFilterParamsDto = {}): Promise<ApiResponse<{
    data: ExecutionResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }>> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/api${EXECUTIONS_API_URL}${queryString ? `?${queryString}` : ''}`;
      
      return await ApiClient.get(url);
    } catch (error: unknown) {
      console.error('Failed to fetch executions:', error);
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to fetch executions',
        500
      );
    }
  }

  /**
   * Gets an execution by ID
   */
  static async getExecutionById(id: number | string): Promise<ApiResponse<ExecutionResponseDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid execution ID format - must be a positive number', 400);
      }
      
      return await ApiClient.get(`/api${EXECUTIONS_API_URL}/${validatedId}`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to fetch execution with ID ${id}`,
        500
      );
    }
  }

  /**
   * Retries a failed execution
   */
  static async retryExecution(id: number | string): Promise<ApiResponse<ExecutionResponseDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid execution ID format - must be a positive number', 400);
      }
      
      return await ApiClient.post(`/api${EXECUTIONS_API_URL}/${validatedId}/retry`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to retry execution with ID ${id}`,
        500
      );
    }
  }

  /**
   * Cleans up old executions
   */
  static async cleanupOldExecutions(olderThanDays?: number): Promise<ApiResponse<{ deletedCount: number }>> {
    try {
      const params = olderThanDays ? `?olderThanDays=${olderThanDays}` : '';
      return await ApiClient.delete(`/api${EXECUTIONS_API_URL}/cleanup${params}`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to cleanup old executions',
        500
      );
    }
  }

  // ============================================================================
  // DASHBOARD & ANALYTICS METHODS
  // ============================================================================

  /**
   * Gets automation dashboard data
   */
  static async getDashboardData(): Promise<ApiResponse<AutomationDashboardDto>> {
    try {
      return await ApiClient.get(`/api${AUTOMATION_API_URL}/dashboard`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to fetch dashboard data',
        500
      );
    }
  }

  /**
   * Gets execution statistics
   */
  static async getExecutionStats(fromDate?: Date, toDate?: Date): Promise<ApiResponse<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
  }>> {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('fromDate', fromDate.toISOString());
      if (toDate) params.append('toDate', toDate.toISOString());
      
      const queryString = params.toString();
      const url = `/api${AUTOMATION_API_URL}/stats${queryString ? `?${queryString}` : ''}`;
      
      return await ApiClient.get(url);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to fetch execution statistics',
        500
      );
    }
  }

  /**
   * Gets automation health status
   */
  static async getHealthStatus(): Promise<ApiResponse<{
    isHealthy: boolean;
    totalWebhooks: number;
    activeWebhooks: number;
    totalSchedules: number;
    activeSchedules: number;
    recentFailures: number;
    avgExecutionTime: number;
  }>> {
    try {
      return await ApiClient.get(`/api${AUTOMATION_API_URL}/health`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to fetch health status',
        500
      );
    }
  }
}

export default AutomationClient;
