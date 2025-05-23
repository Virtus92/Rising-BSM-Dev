import { BaseEntity } from './BaseEntity';

/**
 * AutomationSchedule Entity
 * 
 * Represents a scheduled automation job with cron expression
 */
export class AutomationSchedule extends BaseEntity {
  /**
   * Name of the scheduled job
   */
  name: string;

  /**
   * Description of the scheduled job
   */
  description?: string;

  /**
   * Cron expression for scheduling
   */
  cronExpression: string;

  /**
   * Webhook URL to call
   */
  webhookUrl: string;

  /**
   * HTTP headers to send with the webhook
   */
  headers: Record<string, string>;

  /**
   * Payload to send with the webhook
   */
  payload: Record<string, any>;

  /**
   * Timezone for the schedule
   */
  timezone: string;

  /**
   * Whether the schedule is active
   */
  active: boolean;

  /**
   * Last execution time
   */
  lastRunAt?: Date;

  /**
   * Next scheduled execution time
   */
  nextRunAt?: Date;

  /**
   * Constructor
   * 
   * @param data - Initialization data
   */
  constructor(data: Partial<AutomationSchedule> = {}) {
    super(data);
    
    this.name = data.name || '';
    this.description = data.description;
    this.cronExpression = data.cronExpression || '';
    this.webhookUrl = data.webhookUrl || '';
    this.headers = data.headers || {};
    this.payload = data.payload || {};
    this.timezone = data.timezone || 'UTC';
    this.active = data.active !== undefined ? data.active : true;
    this.lastRunAt = data.lastRunAt ? new Date(data.lastRunAt) : undefined;
    this.nextRunAt = data.nextRunAt ? new Date(data.nextRunAt) : undefined;
  }

  /**
   * Validates the schedule configuration
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

    if (!this.cronExpression?.trim()) {
      errors.push('Cron expression is required');
    } else {
      // Basic cron validation - should have 5 or 6 parts
      const parts = this.cronExpression.trim().split(/\s+/);
      if (parts.length < 5 || parts.length > 6) {
        errors.push('Cron expression must have 5 or 6 parts');
      }
    }

    if (!this.timezone?.trim()) {
      errors.push('Timezone is required');
    }

    return errors;
  }

  /**
   * Checks if the schedule is valid
   */
  isValid(): boolean {
    return this.validate().length === 0;
  }

  /**
   * Checks if the schedule is due for execution
   */
  isDue(): boolean {
    if (!this.active || !this.nextRunAt) {
      return false;
    }
    
    return new Date() >= this.nextRunAt;
  }

  /**
   * Marks the schedule as executed
   */
  markAsExecuted(): void {
    this.lastRunAt = new Date();
    // nextRunAt should be calculated by the scheduling service
  }

  /**
   * Gets a human-readable description of the schedule
   */
  getScheduleDescription(): string {
    // This would be enhanced with a cron parser
    // For now, return the raw expression
    return `Runs: ${this.cronExpression} (${this.timezone})`;
  }

  /**
   * Converts the entity to an object
   */
  toObject(): Record<string, any> {
    return {
      ...super.toObject(),
      name: this.name,
      description: this.description,
      cronExpression: this.cronExpression,
      webhookUrl: this.webhookUrl,
      headers: this.headers,
      payload: this.payload,
      timezone: this.timezone,
      active: this.active,
      lastRunAt: this.lastRunAt,
      nextRunAt: this.nextRunAt
    };
  }
}
