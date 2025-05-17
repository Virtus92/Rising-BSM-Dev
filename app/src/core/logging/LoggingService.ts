import { ILoggingService, LogLevel, LogFormat, LoggingOptions } from './ILoggingService';

/**
 * LoggingService
 * 
 * Implementation of ILoggingService with logging functionality.
 * Can be adapted to different logging libraries (Winston, Pino, etc.).
 */
export class LoggingService implements ILoggingService {
  private level: LogLevel;
  private format: LogFormat;
  private context: Record<string, any> = {};
  private timers: Map<string, number> = new Map();
  
  // Priorities for log levels
  private readonly LOG_LEVEL_PRIORITIES: Record<LogLevel, number> = {
    [LogLevel.ERROR]: 3,
    [LogLevel.WARN]: 2,
    [LogLevel.INFO]: 1,
    [LogLevel.DEBUG]: 0
  };

  /**
   * Creates a new LoggingService instance
   * 
   * @param options - Logging options
   */
  constructor(options?: LoggingOptions) {
    this.level = options?.level || LogLevel.INFO;
    this.format = options?.format || LogFormat.JSON;
    
    if (options?.labels) {
      this.context = { ...this.context, ...options.labels };
    }
    
    // Initialize transport-specific settings
    this.initializeTransports(options);
  }

  /**
   * Logs an info message
   * 
   * @param message - Log message
   * @param meta - Optional metadata
   */
  public info(message: string, meta?: Record<string, any>): void {
    if (this.isLevelEnabled(LogLevel.INFO)) {
      this.log(LogLevel.INFO, message, meta);
    }
  }

  /**
   * Logs a debug message
   * 
   * @param message - Log message
   * @param meta - Optional metadata
   */
  public debug(message: string, meta?: Record<string, any>): void {
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      this.log(LogLevel.DEBUG, message, meta);
    }
  }

  /**
   * Logs a warning message
   * 
   * @param message - Log message
   * @param meta - Optional metadata
   */
  public warn(message: string, meta?: Record<string, any>): void {
    if (this.isLevelEnabled(LogLevel.WARN)) {
      this.log(LogLevel.WARN, message, meta);
    }
  }

  /**
   * Logs an error message
   * 
   * @param message - Log message
   * @param error - Error or metadata
   * @param meta - Optional metadata
   */
  public error(message: string, error?: Error | string | Record<string, any>, meta?: Record<string, any>): void {
    if (this.isLevelEnabled(LogLevel.ERROR)) {
      // Handle different overloads of the method
      let errorData: any;
      let metaData: Record<string, any> | undefined;
      
      if (error instanceof Error) {
        // Case 1: error is an Error object
        errorData = this.formatError(error);
        metaData = meta;
      } else if (typeof error === 'string') {
        // Case 2: error is a string
        errorData = { message: error };
        metaData = meta;
      } else if (typeof error === 'object') {
        // Case 3: error is an object (metadata)
        errorData = undefined;
        metaData = error as Record<string, any>;
      } else {
        // Case 4: error is not defined
        errorData = undefined;
        metaData = meta;
      }
      
      this.log(LogLevel.ERROR, message, { ...metaData, error: errorData });
    }
  }

  /**
   * Logs an HTTP request
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   * @param responseTime - Response time in milliseconds
   */
  public httpRequest(req: any, res: any, responseTime?: number): void {
    if (this.isLevelEnabled(LogLevel.INFO)) {
      const requestLog = {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime: responseTime ? `${responseTime}ms` : undefined,
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'],
        userId: req.user?.id
      };
      
      // Log at appropriate level based on status code
      if (res.statusCode >= 500) {
        this.error(`Request failed: ${req.method} ${req.originalUrl}`, undefined, requestLog);
      } else if (res.statusCode >= 400) {
        this.warn(`Request error: ${req.method} ${req.originalUrl}`, requestLog);
      } else {
        this.info(`Request: ${req.method} ${req.originalUrl}`, requestLog);
      }
    }
  }

  /**
   * Creates a child logger with additional context
   * 
   * @param context - Additional context
   */
  public child(context: Record<string, any>): ILoggingService {
    const childLogger = new LoggingService({
      level: this.level,
      format: this.format
    });
    
    // Combine parent and child context
    (childLogger).context = {
      ...this.context,
      ...context
    };
    
    return childLogger;
  }

  /**
   * Starts a timer
   * 
   * @param label - Timer label
   */
  public startTimer(label: string): string {
    this.timers.set(label, Date.now());
    return label;
  }

  /**
   * Ends a timer and logs the duration
   * 
   * @param timerId - Timer ID
   * @param meta - Metadata
   */
  public endTimer(timerId: string, meta?: Record<string, any>): void {
    const startTime = this.timers.get(timerId);
    
    if (startTime) {
      const duration = Date.now() - startTime;
      this.info(`Timer ${timerId} completed in ${duration}ms`, {
        ...meta,
        timerId,
        durationMs: duration
      });
      
      this.timers.delete(timerId);
    } else {
      this.warn(`Timer ${timerId} not found`, { timerId });
    }
  }

  /**
   * Checks if a log level is enabled
   * 
   * @param level - Log level to check
   */
  public isLevelEnabled(level: LogLevel): boolean {
    return this.LOG_LEVEL_PRIORITIES[level] >= this.LOG_LEVEL_PRIORITIES[this.level];
  }

  /**
   * Initializes the logging transports
   * 
   * @param options - Logging options
   */
  private initializeTransports(options?: LoggingOptions): void {
    // Standard implementation simply configures the console
    // In a real implementation, transports would be configured based on options
  }

  /**
   * Internal logging method
   * 
   * @param level - Log level
   * @param message - Message
   * @param meta - Metadata
   */
  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const correlationId = this.context.correlationId || 'none';
    
    const logData = {
      timestamp,
      level,
      message,
      correlationId,
      ...this.context,
      ...(meta || {})
    };
    
    // Output the log based on format
    switch (this.format) {
      case LogFormat.JSON:
        console.log(JSON.stringify(logData));
        break;
      
      case LogFormat.PRETTY:
        // Color output based on level
        const color = this.getColorForLevel(level);
        const reset = '\x1b[0m';
        
        // Format metadata
        const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
        
        console.log(`${color}[${timestamp}] [${level.toUpperCase()}] ${message}${reset}${metaStr}`);
        break;
      
      case LogFormat.TEXT:
      default:
        // Simple text format
        const metaText = meta ? ` ${JSON.stringify(meta)}` : '';
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${metaText}`);
        break;
    }
  }

  /**
   * Returns the ANSI color code for a log level
   * 
   * @param level - Log level
   */
  private getColorForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return '\x1b[31m'; // Red
      case LogLevel.WARN:
        return '\x1b[33m'; // Yellow
      case LogLevel.INFO:
        return '\x1b[36m'; // Cyan
      case LogLevel.DEBUG:
        return '\x1b[90m'; // Gray
      default:
        return '\x1b[0m'; // Reset
    }
  }

  /**
   * Formats an error for logging
   * 
   * @param error - Error
   */
  private formatError(error: Error): any {
    if (!error) {
      return undefined;
    }
    
    // Extract useful properties from the Error object
    const { name, message, stack, ...rest } = error;
    
    return {
      name,
      message,
      stack: this.isLevelEnabled(LogLevel.DEBUG) ? stack : undefined,
      ...rest
    };
  }
}

// Export enum types for use in bootstrap.ts
export { LogLevel, LogFormat };