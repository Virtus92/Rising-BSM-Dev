/**
 * Request logging middleware
 * Logs details about incoming HTTP requests and their responses
 */
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Log HTTP requests and measure response time
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Skip logging for health check endpoints to avoid noise
  if (req.path === '/health' || req.path === '/api/v1/health') {
    return next();
  }

  // Record request start time
  const startTime = Date.now();
  
  // Create a function to log after response is sent
  const logResponse = () => {
    const responseTime = Date.now() - startTime;
    logger.httpRequest(req, res, responseTime);
  };

  // Log when response is finished
  res.on('finish', logResponse);
  
  next();
};

export default requestLogger;