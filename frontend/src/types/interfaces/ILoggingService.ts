/**
 * Logging Service Interface
 * Provides logging capabilities for services and repositories
 */

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

/**
 * Log formats
 */
export enum LogFormat {
  JSON = 'json',
  TEXT = 'text',
  PRETTY = 'pretty'
}

/**
 * Logging options
 */
export interface LoggingOptions {
  /**
   * Minimum log level
   */
  level?: LogLevel;
  
  /**
   * Output format
   */
  format?: LogFormat;
  
  /**
   * Global context labels
   */
  labels?: Record<string, any>;
}

/**
 * Logging service interface
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
  
  /**
   * Log HTTP request details
   */
  httpRequest(req: any, res: any, responseTime?: number): void;
  
  /**
   * Start timing an operation
   */
  startTimer(label: string): string;
  
  /**
   * End timing and log the duration
   */
  endTimer(timerId: string, meta?: Record<string, any>): void;
  
  /**
   * Check if a log level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean;
}
