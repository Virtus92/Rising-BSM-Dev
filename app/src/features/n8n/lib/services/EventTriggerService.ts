import { ILoggingService } from '@/core/logging/ILoggingService';

type EventHandler = (data: any) => void | Promise<void>;

/**
 * Service for managing event triggers for N8N workflow automation
 */
export class EventTriggerService {
  private events: Map<string, EventHandler[]> = new Map();
  
  constructor(
    protected logger: ILoggingService
  ) {}
  
  /**
   * Register an event handler
   * 
   * @param event - Event name
   * @param handler - Event handler function
   */
  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    this.events.get(event)!.push(handler);
    this.logger.debug(`Registered handler for event: ${event}`);
  }
  
  /**
   * Remove an event handler
   * 
   * @param event - Event name
   * @param handler - Event handler function to remove
   */
  off(event: string, handler: EventHandler): void {
    if (this.events.has(event)) {
      const handlers = this.events.get(event)!;
      const index = handlers.indexOf(handler);
      
      if (index !== -1) {
        handlers.splice(index, 1);
        this.logger.debug(`Removed handler for event: ${event}`);
      }
    }
  }
  
  /**
   * Emit an event with data
   * 
   * @param event - Event name
   * @param data - Event data
   */
  async emit(event: string, data: any): Promise<void> {
    this.logger.debug(`Emitting event: ${event}`, { data });
    
    if (this.events.has(event)) {
      const handlers = this.events.get(event)!;
      
      for (const handler of handlers) {
        try {
          await Promise.resolve(handler(data));
        } catch (error) {
          this.logger.error(`Error in event handler for ${event}:`, {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
  }
  
  /**
   * Register time-based triggers for recurring events
   * 
   * @param eventName - Base event name
   * @param intervalMs - Interval in milliseconds
   * @param data - Additional data to include
   * @returns Timer ID for cleanup
   */
  scheduleRecurring(eventName: string, intervalMs: number, data: any = {}): NodeJS.Timeout {
    this.logger.info(`Scheduling recurring event: ${eventName} every ${intervalMs}ms`);
    
    return setInterval(() => {
      this.emit(eventName, {
        ...data,
        timestamp: new Date().toISOString(),
        scheduled: true
      });
    }, intervalMs);
  }
  
  /**
   * Schedule a one-time event trigger
   * 
   * @param eventName - Event name
   * @param delayMs - Delay in milliseconds
   * @param data - Additional data to include
   * @returns Timer ID for cleanup
   */
  scheduleOnce(eventName: string, delayMs: number, data: any = {}): NodeJS.Timeout {
    this.logger.info(`Scheduling one-time event: ${eventName} in ${delayMs}ms`);
    
    return setTimeout(() => {
      this.emit(eventName, {
        ...data,
        timestamp: new Date().toISOString(),
        scheduled: true
      });
    }, delayMs);
  }
  
  /**
   * Get all registered event types
   * 
   * @returns Array of event names
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.events.keys());
  }
}