/**
 * Logging-Schnittstelle und Typen
 */

/**
 * Log-Level
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Log-Format
 */
export enum LogFormat {
  JSON = 'json',
  TEXT = 'text',
  PRETTY = 'pretty'
}

/**
 * Optionen für den Logging-Service
 */
export interface LoggingOptions {
  level?: LogLevel;
  format?: LogFormat;
  labels?: Record<string, any>;
  filename?: string;
}

/**
 * Logging-Service Interface
 */
export interface ILoggingService {
  /**
   * Log an informational message
   */
  info(message: string, meta?: Record<string, any>): void;

  /**
   * Log a debug message
   */
  debug(message: string, meta?: Record<string, any>): void;

  /**
   * Log a warning message
   */
  warn(message: string, meta?: Record<string, any>): void;

  /**
   * Log an error message
   */
  error(message: string, error?: Error | string, meta?: Record<string, any>): void;

  /**
   * Check if a log level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean;

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, any>): ILoggingService;

  /**
   * Start timing an operation
   */
  startTimer(label: string): string;

  /**
   * End timing and log the duration
   */
  endTimer(timerId: string, meta?: Record<string, any>): void;

  /**
   * Log HTTP request details
   */
  httpRequest(req: any, res: any, responseTime?: number): void;
}
