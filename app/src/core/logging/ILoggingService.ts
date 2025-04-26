/**
 * Log Level
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Log Format
 */
export enum LogFormat {
  JSON = 'json',
  TEXT = 'text',
  PRETTY = 'pretty'
}

/**
 * Logging Options
 */
export interface LoggingOptions {
  /**
   * Log level
   */
  level?: LogLevel;
  
  /**
   * Log format
   */
  format?: LogFormat;
  
  /**
   * Labels for all logs
   */
  labels?: Record<string, any>;
  
  /**
   * Additional options
   */
  [key: string]: any;
}

/**
 * Interface for Logging Services
 */
export interface ILoggingService {
  /**
   * Logs an informational message
   * 
   * @param message - Message
   * @param meta - Metadata
   */
  info(message: string, meta?: Record<string, any>): void;
  
  /**
   * Logs a debug message
   * 
   * @param message - Message
   * @param meta - Metadata
   */
  debug(message: string, meta?: Record<string, any>): void;
  
  /**
   * Logs a warning
   * 
   * @param message - Message
   * @param meta - Metadata
   */
  warn(message: string, meta?: Record<string, any>): void;
  
  /**
   * Logs an error
   * 
   * @param message - Message
   * @param error - Error
   * @param meta - Metadata
   */
  error(message: string, error?: Error | string | Record<string, any>, meta?: Record<string, any>): void;
  
  /**
   * Logs an HTTP request
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   * @param responseTime - Response time in milliseconds
   */
  httpRequest(req: any, res: any, responseTime?: number): void;
  
  /**
   * Creates a child logger with additional context
   * 
   * @param context - Additional context
   */
  child(context: Record<string, any>): ILoggingService;
  
  /**
   * Starts a timer
   * 
   * @param label - Timer label
   */
  startTimer(label: string): string;
  
  /**
   * Ends a timer and logs the duration
   * 
   * @param timerId - Timer ID
   * @param meta - Metadata
   */
  endTimer(timerId: string, meta?: Record<string, any>): void;
  
  /**
   * Checks if a log level is enabled
   * 
   * @param level - Level to check
   */
  isLevelEnabled(level: LogLevel): boolean;
}