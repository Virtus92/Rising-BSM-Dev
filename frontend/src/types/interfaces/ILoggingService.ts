/**
 * Logging Service Interface
 * Provides logging capabilities for services and repositories
 */
export interface ILoggingService {
  /**
   * Log an error message
   */
  error(message: string, error?: any, context?: Record<string, any>): void;
  
  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, any>): void;
  
  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, any>): void;
  
  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, any>): void;
  
  /**
   * Create a child logger with a specific context
   */
  child(context: Record<string, any>): ILoggingService;
}
