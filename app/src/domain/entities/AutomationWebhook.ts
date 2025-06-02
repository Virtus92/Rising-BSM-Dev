import { BaseEntity } from './BaseEntity';

/**
 * Entity type enumeration for webhook automation
 */
export enum AutomationEntityType {
  USER = 'user',
  CUSTOMER = 'customer',
  APPOINTMENT = 'appointment',
  REQUEST = 'request',
  PLUGIN = 'plugin'
}

/**
 * Operation type enumeration for webhook automation
 */
export enum AutomationOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  STATUS_CHANGED = 'status_changed',
  ASSIGNED = 'assigned',
  COMPLETED = 'completed'
}

/**
 * AutomationWebhook Entity
 * 
 * Represents a webhook configuration that triggers on entity operations
 */
export class AutomationWebhook extends BaseEntity {
  /**
   * Name of the webhook
   */
  name: string;

  /**
   * Description of the webhook
   */
  description?: string;

  /**
   * Entity type that triggers this webhook
   */
  entityType: AutomationEntityType;

  /**
   * Operation that triggers this webhook
   */
  operation: AutomationOperation;

  /**
   * Webhook URL to call
   */
  webhookUrl: string;

  /**
   * HTTP headers to send with the webhook
   */
  headers: Record<string, string>;

  /**
   * Payload template for the webhook
   */
  payloadTemplate: Record<string, any>;

  /**
   * Whether the webhook is active
   */
  active: boolean;

  /**
   * Number of retry attempts
   */
  retryCount: number;

  /**
   * Delay between retries in seconds
   */
  retryDelaySeconds: number;

  /**
   * Constructor
   * 
   * @param data - Initialization data
   */
  constructor(data: Partial<AutomationWebhook> = {}) {
    super(data);
    
    this.name = data.name || '';
    this.description = data.description;
    this.entityType = data.entityType || AutomationEntityType.USER;
    this.operation = data.operation || AutomationOperation.CREATE;
    this.webhookUrl = data.webhookUrl || '';
    this.headers = data.headers || {};
    this.payloadTemplate = data.payloadTemplate || {};
    this.active = data.active !== undefined ? data.active : true;
    this.retryCount = data.retryCount || 3;
    this.retryDelaySeconds = data.retryDelaySeconds || 30;
  }

  /**
   * Validates the webhook configuration
   * 
   * @returns Array of validation errors
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.name?.trim()) {
      errors.push('Name is required');
    }

    if (!this.webhookUrl?.trim()) {
      errors.push('Webhook URL is required');
    } else {
      try {
        new URL(this.webhookUrl);
      } catch {
        errors.push('Webhook URL must be a valid URL');
      }
    }

    if (!Object.values(AutomationEntityType).includes(this.entityType)) {
      errors.push('Invalid entity type');
    }

    if (!Object.values(AutomationOperation).includes(this.operation)) {
      errors.push('Invalid operation type');
    }

    if (this.retryCount < 0 || this.retryCount > 10) {
      errors.push('Retry count must be between 0 and 10');
    }

    if (this.retryDelaySeconds < 1 || this.retryDelaySeconds > 3600) {
      errors.push('Retry delay must be between 1 and 3600 seconds');
    }

    return errors;
  }

  /**
   * Checks if the webhook is valid
   */
  isValid(): boolean {
    return this.validate().length === 0;
  }

  /**
   * Creates a trigger key for this webhook
   */
  getTriggerKey(): string {
    return `${this.entityType}.${this.operation}`;
  }

  /**
   * Converts the entity to an object
   */
  toObject(): Record<string, any> {
    return {
      ...super.toObject(),
      name: this.name,
      description: this.description,
      entityType: this.entityType,
      operation: this.operation,
      webhookUrl: this.webhookUrl,
      headers: this.headers,
      payloadTemplate: this.payloadTemplate,
      active: this.active,
      retryCount: this.retryCount,
      retryDelaySeconds: this.retryDelaySeconds
    };
  }
}
