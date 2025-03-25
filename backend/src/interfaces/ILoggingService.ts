/**
 * ILoggingService
 * 
 * Interface for standardized logging operations across the application.
 * Provides methods for different log levels and contextual logging.
 */
export interface ILoggingService {
    /**
     * Log an informational message
     * 
     * @param message - Log message
     * @param meta - Optional metadata object
     */
    info(message: string, meta?: Record<string, any>): void;
    
    /**
     * Log a debug message
     * 
     * @param message - Log message
     * @param meta - Optional metadata object
     */
    debug(message: string, meta?: Record<string, any>): void;
    
    /**
     * Log a warning message
     * 
     * @param message - Log message
     * @param meta - Optional metadata object
     */
    warn(message: string, meta?: Record<string, any>): void;
    
    /**
     * Log an error message
     * 
     * @param message - Log message
     * @param error - Error object or string
     * @param meta - Optional metadata object
     */
    error(message: string, error?: Error | string, meta?: Record<string, any>): void;
    
    /**
     * Log HTTP request details
     * 
     * @param req - HTTP request object
     * @param res - HTTP response object
     * @param responseTime - Optional response time in milliseconds
     */
    httpRequest(req: any, res: any, responseTime?: number): void;
    
    /**
     * Create a child logger with additional context
     * 
     * @param context - Context object to include with all log messages
     * @returns A new logger instance with the additional context
     */
    child(context: Record<string, any>): ILoggingService;
    
    /**
     * Start timing an operation for performance logging
     * 
     * @param label - Label for the timer
     * @returns Timer ID or reference
     */
    startTimer(label: string): any;
    
    /**
     * End timing and log the duration
     * 
     * @param timerId - Timer ID or reference from startTimer
     * @param meta - Optional additional metadata
     */
    endTimer(timerId: any, meta?: Record<string, any>): void;
    
    /**
     * Check if logging is enabled for a specific level
     * 
     * @param level - Log level to check
     * @returns Whether logging is enabled for the specified level
     */
    isLevelEnabled(level: LogLevel): boolean;
  }
  
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
   * Log format options
   */
  export enum LogFormat {
    JSON = 'json',
    TEXT = 'text',
    PRETTY = 'pretty'
  }
  
  /**
   * Configuration options for logging service
   */
  export interface LoggingOptions {
    /**
     * Minimum log level to record
     */
    level?: LogLevel;
    
    /**
     * Output format
     */
    format?: LogFormat;
    
    /**
     * Output destination (e.g., file path, 'stdout', 'stderr')
     */
    destination?: string | string[];
    
    /**
     * Whether to include timestamps
     */
    timestamps?: boolean;
    
    /**
     * Whether to include log level
     */
    logLevel?: boolean;
    
    /**
     * Custom labels for structured logging
     */
    labels?: Record<string, string>;
    
    /**
     * Whether to include source file/line information
     */
    sourceInfo?: boolean;
    
    /**
     * Additional transport-specific options
     */
    transportOptions?: Record<string, any>;
  }