import { ILoggingService } from '../interfaces/ILoggingService.js';

/**
 * NotificationEventManager
 * 
 * Manages event listeners and emits notification-related events.
 * Implements the Singleton pattern.
 */
export class NotificationEventManager {
  private static instance: NotificationEventManager;
  private listeners: Map<string, Function[]> = new Map();
  private logger: ILoggingService | null = null;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   * 
   * @returns NotificationEventManager instance
   */
  static getInstance(): NotificationEventManager {
    if (!NotificationEventManager.instance) {
      NotificationEventManager.instance = new NotificationEventManager();
    }
    return NotificationEventManager.instance;
  }
  
  /**
   * Set logger for event manager
   * 
   * @param logger - Logging service
   */
  setLogger(logger: ILoggingService): void {
    this.logger = logger;
  }
  
  /**
   * Register event listener
   * 
   * @param eventType - Event type
   * @param callback - Callback function
   */
  on(eventType: string, callback: Function): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
    
    if (this.logger) {
      this.logger.debug(`Registered listener for event: ${eventType}`);
    }
  }
  
  /**
   * Unregister event listener
   * 
   * @param eventType - Event type
   * @param callback - Callback function
   * @returns Whether the listener was removed
   */
  off(eventType: string, callback: Function): boolean {
    if (!this.listeners.has(eventType)) {
      return false;
    }
    
    const listeners = this.listeners.get(eventType)!;
    const index = listeners.indexOf(callback);
    
    if (index !== -1) {
      listeners.splice(index, 1);
      
      if (this.logger) {
        this.logger.debug(`Removed listener for event: ${eventType}`);
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Emit event
   * 
   * @param eventType - Event type
   * @param data - Event data
   */
  emit(eventType: string, data: any): void {
    if (this.logger) {
      this.logger.debug(`Emitting event: ${eventType}`, { data });
    }
    
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          if (this.logger) {
            this.logger.error(`Error in notification event handler for ${eventType}:`, error instanceof Error ? error : String(error));
          } else {
            console.error(`Error in notification event handler for ${eventType}:`, error);
          }
        }
      });
    }
  }
  
  /**
   * Clear all listeners
   * 
   * @param eventType - Optional event type to clear
   */
  clear(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType);
      
      if (this.logger) {
        this.logger.debug(`Cleared all listeners for event: ${eventType}`);
      }
    } else {
      this.listeners.clear();
      
      if (this.logger) {
        this.logger.debug('Cleared all event listeners');
      }
    }
  }
}

/**
 * NotificationEventTypes
 * 
 * Enum for notification event types
 */
export enum NotificationEventType {
  // System events
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  
  // User events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',
  
  // Contact events
  CONTACT_REQUEST_CREATED = 'CONTACT_REQUEST_CREATED',
  CONTACT_REQUEST_ACCEPTED = 'CONTACT_REQUEST_ACCEPTED',
  CONTACT_REQUEST_REJECTED = 'CONTACT_REQUEST_REJECTED',
  
  // Customer events
  CUSTOMER_CREATED = 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED = 'CUSTOMER_UPDATED',
  
  // Project events
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  PROJECT_STATUS_CHANGED = 'PROJECT_STATUS_CHANGED',
  
  // Task events
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_DEADLINE_APPROACHING = 'TASK_DEADLINE_APPROACHING',
  
  // Comment events
  COMMENT_ADDED = 'COMMENT_ADDED',
  COMMENT_REPLIED = 'COMMENT_REPLIED'
}