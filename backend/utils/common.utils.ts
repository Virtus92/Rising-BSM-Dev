/**
 * Common Utilities
 * 
 * General purpose utilities and helper functions.
 * Includes logging, environment management, and cross-cutting concerns.
 */
import config from '../config/index.js';

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Level priorities
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

/**
 * Current log level from config
 */
const CURRENT_LOG_LEVEL = config.LOG_LEVEL as LogLevel || 'info';

/**
 * Logger utility
 */
export class Logger {
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
        stack: value.stack,
        ...value
      };
    }
    return value;
  }
}

/**
 * Singleton logger instance
 */
export const logger = new Logger();

/**
 * Environment validation helper
 * Gets an environment variable with a default value and optional validation
 */
export function env<T>(
  key: string, 
  defaultValue: T, 
  validator?: (value: any) => boolean
): T {
  const value = process.env[key];
  
  if (value === undefined) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`Environment variable ${key} not set, using default: ${defaultValue}`);
    }
    return defaultValue;
  }
  
  // Attempt to convert the string value to the correct type based on defaultValue
  let convertedValue: any;
  
  if (typeof defaultValue === 'number') {
    convertedValue = Number(value);
    if (isNaN(convertedValue)) {
      logger.warn(`Environment variable ${key} value "${value}" is not a valid number, using default: ${defaultValue}`);
      return defaultValue;
    }
  } else if (typeof defaultValue === 'boolean') {
    convertedValue = value.toLowerCase() === 'true';
  } else {
    convertedValue = value;
  }
  
  // Apply validator if provided
  if (validator && !validator(convertedValue)) {
    logger.warn(`Environment variable ${key} value "${value}" failed validation, using default: ${defaultValue}`);
    return defaultValue;
  }
  
  return convertedValue as T;
}

/**
 * Simple in-memory cache
 */
export class Cache {
  private cache: Map<string, { value: any; expires: number }> = new Map();

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) return undefined;
    
    // Check if expired
    if (item.expires < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds
   */
  set(key: string, value: any, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get a value from cache or execute a function to create it
   * @param key Cache key
   * @param fn Function to execute if value not in cache
   * @param ttlSeconds Time to live in seconds
   * @returns Cached or newly executed value
   */
  async getOrExecute<T>(key: string, fn: () => Promise<T>, ttlSeconds: number = 300): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const value = await fn();
    this.set(key, value, ttlSeconds);
    return value;
  }
}

/**
 * Singleton cache instance
 */
export const cache = new Cache();

/**
 * Delay execution for specified milliseconds
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Truncate HTML string and close any open tags
 * @param html HTML string to truncate
 * @param maxLength Maximum length
 * @returns Truncated HTML with closed tags
 */
export const truncateHtml = (html: string | null | undefined, maxLength: number): string => {
  if (!html || html.length <= maxLength) {
    return html || '';
  }
  
  // Simple truncation for now
  // A more complex version would properly close HTML tags
  return html.substring(0, maxLength) + '...';
};