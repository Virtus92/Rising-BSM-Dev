import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import config from '../config/index.js';
import { DiContainer } from './DiContainer.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { EnhancedCorsMiddleware } from '../middleware/EnhancedCorsMiddleware.js';

export function setupMiddleware(app: express.Express, container: DiContainer): void {
  const logger = container.resolve<ILoggingService>('LoggingService');
  logger.info('Setting up middleware...');
  
  // Security middleware with modifications for Swagger UI
  app.use(helmet({
    // Allow Swagger UI to work correctly
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for Swagger UI
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "http://localhost:*", "https://localhost:*"] // Allow local connections
      }
    },
    // Adjust security policies to work with Swagger UI
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  
  // Enhanced CORS middleware (now handles both regular API and Swagger requests)
  const corsMiddleware = new EnhancedCorsMiddleware(logger);
  corsMiddleware.apply(app);
  
  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  
  // Request logging middleware
  interface RequestLogger {
    logRequest: express.RequestHandler;
  }
  const requestLogger = container.resolve<RequestLogger>('RequestLoggerMiddleware');
  app.use(requestLogger.logRequest);
  
  // API rate limiting with exception for Swagger UI
  const apiLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    standardHeaders: config.RATE_LIMIT_STANDARDIZE,
    message: { success: false, error: 'Too many requests, please try again later.' },
    // Skip rate limiting for Swagger UI
    skip: (req) => {
      const referer = req.headers.referer || '';
      return referer.includes('/api-docs') || 
             req.path.startsWith('/api-docs') || 
             req.path.startsWith('/swagger');
    }
  });
  app.use(config.API_PREFIX, apiLimiter);
  
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV
    });
  });
  
  // Add diagnostic endpoint for CORS debugging in development
  if (config.IS_DEVELOPMENT) {
    app.get('/api/cors-debug', (req, res) => {
      res.json({
        success: true,
        message: 'CORS debug information',
        headers: {
          origin: req.headers.origin,
          host: req.headers.host,
          referer: req.headers.referer,
          userAgent: req.headers['user-agent']
        },
        cors: {
          enabled: config.CORS_ENABLED,
          allowedOrigins: config.CORS_ORIGINS
        },
        environment: config.NODE_ENV
      });
    });
  }
  
  logger.info('Middleware setup complete');
}