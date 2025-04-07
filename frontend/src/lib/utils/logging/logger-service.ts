import { ILoggingService } from '@/types/interfaces/ILoggingService';

/**
 * Logger Service implementation
 * Provides logging capabilities with context and severity levels
 */
export class LoggerService implements ILoggingService {
  /**
   * Creates a new LoggerService instance
   * 
   * @param name - Logger name/category
   * @param context - Default context
   * @param logLevel - Minimum log level (0=error, 1=warn, 2=info, 3=debug)
   */
  constructor(
    private readonly name: string,
    private readonly context: Record<string, any> = {},
    private readonly logLevel: number = process.env.NODE_ENV === 'production' ? 1 : 3
  ) {}

  /**
   * Log an error message
   * 
   * @param message - Error message
   * @param error - Error object
   * @param context - Additional context
   */
  error(message: string, error?: any, context?: Record<string, any>): void {
    if (this.logLevel >= 0) {
      this.log('error', message, error, context);
    }
  }

  /**
   * Log a warning message
   * 
   * @param message - Warning message
   * @param context - Additional context
   */
  warn(message: string, context?: Record<string, any>): void {
    if (this.logLevel >= 1) {
      this.log('warn', message, undefined, context);
    }
  }

  /**
   * Log an info message
   * 
   * @param message - Info message
   * @param context - Additional context
   */
  info(message: string, context?: Record<string, any>): void {
    if (this.logLevel >= 2) {
      this.log('info', message, undefined, context);
    }
  }

  /**
   * Log a debug message
   * 
   * @param message - Debug message
   * @param context - Additional context
   */
  debug(message: string, context?: Record<string, any>): void {
    if (this.logLevel >= 3) {
      this.log('debug', message, undefined, context);
    }
  }

  /**
   * Create a child logger with a specific context
   * 
   * @param context - Context for child logger
   * @returns Child logger instance
   */
  child(context: Record<string, any>): ILoggingService {
    return new LoggerService(
      this.name,
      { ...this.context, ...context },
      this.logLevel
    );
  }

  /**
   * Internal logging method
   * 
   * @param level - Log level
   * @param message - Log message
   * @param error - Error object
   * @param context - Additional context
   */
  private log(level: string, message: string, error?: any, context?: Record<string, any>): void {
    // Prepare log entry
    const timestamp = new Date().toISOString();
    const fullContext = {
      ...this.context,
      ...context
    };
    
    // Prepare error info if present
    let errorInfo = {};
    if (error) {
      if (error instanceof Error) {
        errorInfo = {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      } else if (typeof error === 'object') {
        errorInfo = error;
      } else {
        errorInfo = { error };
      }
    }
    
    // Format log entry
    const logEntry = {
      timestamp,
      level,
      service: this.name,
      message,
      ...(Object.keys(fullContext).length > 0 ? { context: fullContext } : {}),
      ...(Object.keys(errorInfo).length > 0 ? { error: errorInfo } : {})
    };
    
    // Output log entry
    switch (level) {
      case 'error':
        console.error(JSON.stringify(logEntry));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'info':
        console.info(JSON.stringify(logEntry));
        break;
      case 'debug':
        console.debug(JSON.stringify(logEntry));
        break;
      default:
        console.log(JSON.stringify(logEntry));
    }
  }
}

/**
 * Create a new logger instance
 * 
 * @param name - Logger name/category
 * @param context - Default context
 * @returns Logger instance
 */
export function createLogger(name: string, context?: Record<string, any>): ILoggingService {
  return new LoggerService(name, context);
}
