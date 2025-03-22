/**
 * Logger Utility
 * Provides consistent logging across the application
 */
import config from '../config';

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Level priorities
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Current log level from config
const CURRENT_LOG_LEVEL = config.LOG_LEVEL as LogLevel || 'info';

/**
 * Simple logger utility
 * In a production environment, you might want to replace this with a more robust logging library
 */
class Logger {
  /**
   * Log info level message
   */
  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      this.log('INFO', message, meta);
    }
  }
  
  /**
   * Log warning level message
   */
  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      this.log('WARN', message, meta);
    }
  }
  
  /**
   * Log error level message
   */
  error(message: string, meta?: any): void {
    if (this.shouldLog('error')) {
      this.log('ERROR', message, meta);
    }
  }
  
  /**
   * Log debug level message
   */
  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      this.log('DEBUG', message, meta);
    }
  }
  
  /**
   * Log HTTP requests
   */
  httpRequest(req: any, res: any, responseTime?: number): void {
    if (this.shouldLog('info')) {
      const status = res.statusCode;
      const method = req.method;
      const url = req.originalUrl || req.url;
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      const logMessage = `${method} ${url} ${status} ${responseTime ? responseTime + 'ms' : ''} - ${ip} - ${userAgent}`;
      this.info(logMessage);
    }
  }
  
  /**
   * Determine if we should log at this level
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL];
  }
  
  /**
   * Internal log method
   */
  private log(level: string, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? JSON.stringify(meta, this.replacer) : '';
    console.log(`[${timestamp}] [${level}] ${message} ${metaStr}`);
  }
  
  /**
   * JSON replacer to handle circular references
   */
  private replacer(key: string, value: any): any {
    if (value instanceof Error) {
      return {
        message: value.message,
        stack: value.stack,
        ...value
      };
    }
    return value;
  }
}

// Export singleton instance
export default new Logger();