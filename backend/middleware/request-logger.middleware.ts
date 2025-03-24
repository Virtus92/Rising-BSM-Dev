/**
 * Request Logging Middleware
 * 
 * Logs details about incoming HTTP requests and their responses.
 * Provides valuable information for debugging and monitoring API usage.
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/common.utils.js';
import config from '../config/index.js';

/**
 * Configuration for request logging
 */
const loggingConfig = {
  // Endpoints to exclude from logging (to reduce noise)
  excludePaths: [
    '/health',
    '/api/v1/health',
    '/favicon.ico'
  ],
  
  // Log level for request logs
  logLevel: 'http',
  
  // Log request body (careful with sensitive data)
  logRequestBody: config.IS_DEVELOPMENT,
  
  // Maximum size of request body to log (to prevent huge logs)
  maxBodySize: 1024 // 1KB
};

/**
 * Safely stringify an object for logging
 * @param obj Object to stringify
 * @param maxSize Maximum size in chars
 * @returns Stringified object
 */
function safeStringify(obj: any, maxSize: number = 1024): string {
  if (!obj) return '';
  
  try {
    const json = JSON.stringify(obj);
    if (json.length > maxSize) {
      return json.substring(0, maxSize) + '... [truncated]';
    }
    return json;
  } catch (error) {
    return '[Cannot stringify object]';
  }
}

/**
 * Format request size in human readable format
 * @param bytes Size in bytes
 * @returns Formatted size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Log HTTP requests and measure response time
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Skip logging for excluded paths
  if (loggingConfig.excludePaths.includes(req.path)) {
    return next();
  }

  // Record request start time
  const startTime = Date.now();
  
  // Get authenticated user ID if available
  const userId = (req as any).user?.id;
  
  // Get original IP (accounting for proxies)
  const ip = req.headers['x-forwarded-for'] || req.ip || 'unknown';
  
  // Log request details
  const requestLog: any = {
    method: req.method,
    path: req.originalUrl || req.url,
    ip,
    userAgent: req.headers['user-agent'],
    userId
  };
  
  // Only log request body in development and if enabled
  if (loggingConfig.logRequestBody && req.method !== 'GET') {
    // For non-GET requests, log the body (if exists)
    if (req.body && Object.keys(req.body).length > 0) {
      requestLog.body = safeStringify(req.body, loggingConfig.maxBodySize);
    }
  }
  
  // Create a function to log after response is sent
  const logResponse = () => {
    const responseTime = Date.now() - startTime;
    
    // Log basic info about the response
    const responseLog: any = {
      ...requestLog,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.getHeader('content-length') 
        ? formatBytes(parseInt(res.getHeader('content-length') as string))
        : 'unknown'
    };
    
    // Log at appropriate level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request failed with server error', responseLog);
    } else if (res.statusCode >= 400) {
      logger.warn('Request failed with client error', responseLog);
    } else {
      logger.info('Request completed successfully', responseLog);
    }
  };

  // Log when response is finished
  res.on('finish', logResponse);
  
  next();
};

export default requestLogger;