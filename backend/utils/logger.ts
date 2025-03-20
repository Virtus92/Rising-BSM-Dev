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
 * Format log message with timestamp and level
 * @param level Log level
 * @param message Log message
 * @param data Optional data to log
 * @returns Formatted log string
 */
const formatLogMessage = (level: LogLevel, message: string, data?: any): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ` ${JSON.stringify(data)}` : ''}`;
};

/**
 * Determine if we should log at this level
 * @param level Log level to check
 * @returns True if this level should be logged
 */
const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL];
};

/**
 * Log debug messages
 * @param message Log message
 * @param data Optional data to log
 */
export const debug = (message: string, data?: any): void => {
  if (shouldLog('debug')) {
    console.debug(formatLogMessage('debug', message, data));
  }
};

/**
 * Log info messages
 * @param message Log message
 * @param data Optional data to log
 */
export const info = (message: string, data?: any): void => {
  if (shouldLog('info')) {
    console.info(formatLogMessage('info', message, data));
  }
};

/**
 * Log warning messages
 * @param message Log message
 * @param data Optional data to log
 */
export const warn = (message: string, data?: any): void => {
  if (shouldLog('warn')) {
    console.warn(formatLogMessage('warn', message, data));
  }
};

/**
 * Log error messages
 * @param message Log message
 * @param error Error object or data
 */
export const error = (message: string, error?: any): void => {
  if (shouldLog('error')) {
    console.error(formatLogMessage('error', message));
    if (error) {
      if (error instanceof Error) {
        console.error(error.stack || error.message);
      } else {
        console.error(error);
      }
    }
  }
};

/**
 * Log HTTP requests
 * @param req Express request object
 * @param res Express response object
 * @param responseTime Response time in ms
 */
export const httpRequest = (req: any, res: any, responseTime?: number): void => {
  if (shouldLog('info')) {
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    const logMessage = `${method} ${url} ${status} ${responseTime ? responseTime + 'ms' : ''} - ${ip} - ${userAgent}`;
    info(logMessage);
  }
};

export default {
  debug,
  info,
  warn,
  error,
  httpRequest
};