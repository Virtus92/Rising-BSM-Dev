import { BaseEntity } from './BaseEntity';

/**
 * Automation type enumeration
 */
export enum AutomationType {
  WEBHOOK = 'webhook',
  SCHEDULE = 'schedule'
}

/**
 * Execution status enumeration
 */
export enum AutomationExecutionStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

/**
 * AutomationExecution Entity
 * 
 * Represents the execution history and status of automations
 */
export class AutomationExecution extends BaseEntity {
  /**
   * Type of automation (webhook or schedule)
   */
  automationType: AutomationType;

  /**
   * ID of the automation (webhook or schedule)
   */
  automationId: number;

  /**
   * ID of the entity that triggered the automation (for webhooks)
   */
  entityId?: number;

  /**
   * Type of entity that triggered the automation (for webhooks)
   */
  entityType?: string;

  /**
   * Execution status
   */
  status: AutomationExecutionStatus;

  /**
   * HTTP response status code
   */
  responseStatus?: number;

  /**
   * HTTP response body
   */
  responseBody?: string;

  /**
   * Error message if execution failed
   */
  errorMessage?: string;

  /**
   * Execution time in milliseconds
   */
  executionTimeMs?: number;

  /**
   * Execution timestamp
   */
  executedAt: Date;

  /**
   * Current retry attempt number
   */
  retryAttempt: number;

  /**
   * Constructor
   * 
   * @param data - Initialization data
   */
  constructor(data: Partial<AutomationExecution> = {}) {
    super(data);
    
    this.automationType = data.automationType || AutomationType.WEBHOOK;
    this.automationId = data.automationId || 0;
    this.entityId = data.entityId;
    this.entityType = data.entityType;
    this.status = data.status || AutomationExecutionStatus.SUCCESS;
    this.responseStatus = data.responseStatus;
    this.responseBody = data.responseBody;
    this.errorMessage = data.errorMessage;
    this.executionTimeMs = data.executionTimeMs;
    this.executedAt = data.executedAt ? new Date(data.executedAt) : new Date();
    this.retryAttempt = data.retryAttempt || 0;
  }

  /**
   * Checks if the execution was successful
   */
  isSuccessful(): boolean {
    return this.status === AutomationExecutionStatus.SUCCESS;
  }

  /**
   * Checks if the execution failed
   */
  isFailed(): boolean {
    return this.status === AutomationExecutionStatus.FAILED;
  }

  /**
   * Checks if the execution is retrying
   */
  isRetrying(): boolean {
    return this.status === AutomationExecutionStatus.RETRYING;
  }

  /**
   * Checks if the HTTP response indicates success
   */
  hasSuccessfulResponse(): boolean {
    return this.responseStatus !== undefined && 
           this.responseStatus >= 200 && 
           this.responseStatus < 300;
  }

  /**
   * Gets a human-readable status description
   */
  getStatusDescription(): string {
    switch (this.status) {
      case AutomationExecutionStatus.SUCCESS:
        return 'Execution completed successfully';
      case AutomationExecutionStatus.FAILED:
        return this.errorMessage || 'Execution failed';
      case AutomationExecutionStatus.RETRYING:
        return `Retrying (attempt ${this.retryAttempt})`;
      default:
        return 'Unknown status';
    }
  }

  /**
   * Gets execution duration as human-readable string
   */
  getExecutionDuration(): string {
    if (!this.executionTimeMs) {
      return 'Unknown';
    }

    if (this.executionTimeMs < 1000) {
      return `${this.executionTimeMs}ms`;
    }

    return `${(this.executionTimeMs / 1000).toFixed(2)}s`;
  }

  /**
   * Marks the execution as successful
   */
  markAsSuccessful(responseStatus?: number, responseBody?: string, executionTimeMs?: number): void {
    this.status = AutomationExecutionStatus.SUCCESS;
    this.responseStatus = responseStatus;
    this.responseBody = responseBody;
    this.executionTimeMs = executionTimeMs;
    this.errorMessage = undefined;
  }

  /**
   * Marks the execution as failed
   */
  markAsFailed(errorMessage: string, responseStatus?: number, responseBody?: string, executionTimeMs?: number): void {
    this.status = AutomationExecutionStatus.FAILED;
    this.errorMessage = errorMessage;
    this.responseStatus = responseStatus;
    this.responseBody = responseBody;
    this.executionTimeMs = executionTimeMs;
  }

  /**
   * Marks the execution as retrying
   */
  markAsRetrying(retryAttempt: number): void {
    this.status = AutomationExecutionStatus.RETRYING;
    this.retryAttempt = retryAttempt;
  }

  /**
   * Converts the entity to an object
   */
  toObject(): Record<string, any> {
    return {
      ...super.toObject(),
      automationType: this.automationType,
      automationId: this.automationId,
      entityId: this.entityId,
      entityType: this.entityType,
      status: this.status,
      responseStatus: this.responseStatus,
      responseBody: this.responseBody,
      errorMessage: this.errorMessage,
      executionTimeMs: this.executionTimeMs,
      executedAt: this.executedAt,
      retryAttempt: this.retryAttempt
    };
  }
}
