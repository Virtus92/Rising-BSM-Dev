/**
 * Core Logging Functionality
 * 
 * Isolated module for logger initialization that doesn't depend on other modules
 * (to avoid circular dependencies)
 */

import { LoggingService, LogLevel, LogFormat } from './LoggingService';
import type { ILoggingService } from './ILoggingService';

// Singleton instance
let logger: ILoggingService;

/**
 * Returns a singleton instance of the LoggingService
 */
export function getLogger(): ILoggingService {
  if (!logger) {
    // Configure the logger based on the environment
    const isDevelopment = process.env.NODE_ENV === 'development';
    logger = new LoggingService({
      level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
      format: isDevelopment ? LogFormat.PRETTY : LogFormat.JSON,
      labels: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0',
        application: 'Rising-BSM-Frontend'
      }
    });
  }
  return logger;
}

/**
 * Resets the logger instance (mainly for tests)
 */
export function resetLogger(): void {
  logger = undefined as any;
}

// Re-export important types
export { LogLevel, LogFormat } from './LoggingService';
export type { ILoggingService } from './ILoggingService';