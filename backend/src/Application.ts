import dotenv from 'dotenv';
dotenv.config();

import express, { application, Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import container from './core/DiContainer.js';
import { registerAll } from './factories.js';
import { ILoggingService } from './interfaces/ILoggingService.js';
import { IErrorHandler } from './interfaces/IErrorHandler.js';
import { LoggingService } from './core/LoggingService.js';
import { LogFormat } from './interfaces/ILoggingService.js';
import { ErrorHandler } from './core/ErrorHandler.js';
import { ValidationService } from './core/ValidationService.js';
import { ErrorMiddleware } from './middleware/ErrorMiddleware.js';
import { RequestLoggerMiddleware } from './middleware/RequestLoggerMiddleware.js';
import { AuthMiddleware } from './middleware/AuthMiddleware.js';

// Create ESM compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize the application
 */
async function initializeApp() {
  // Create Express app
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  
  // Register core services
  registerCoreServices();
  
  // Register application components
  registerAll(container);
  
  // Get services from container
  const logger = container.resolve<ILoggingService>('LoggingService');
  const errorHandler = container.resolve<IErrorHandler>('ErrorHandler');
  
  // Setup middleware
  setupMiddleware(app, logger);
  
  // Setup routes
  setupRoutes(app, logger);
  
  // Setup error handling
  setupErrorHandling(app, logger, errorHandler);
  
  // Start server
  app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
  
  return app;
}

/**
 * Register core services with the DI container
 */
function registerCoreServices() {
  // Register logging service
  container.register<ILoggingService>('LoggingService', () => {
    return new LoggingService({
      level: (process.env.LOG_LEVEL as any) || 'info',
      format: process.env.NODE_ENV === 'production' ? LogFormat.JSON : LogFormat.PRETTY, });
  }, { singleton: true });
  
  // Get logger for subsequent registrations
  const logger = container.resolve<ILoggingService>('LoggingService');
  
  // Register error handler
  container.register<IErrorHandler>('ErrorHandler', () => {
    return new ErrorHandler(
      logger,
      process.env.NODE_ENV !== 'production'
    );
  }, { singleton: true });
  
  // Register validation service
  container.register('ValidationService', () => {
    return new ValidationService(logger);
  }, { singleton: true });
  
  // Register database client
  container.register('PrismaClient', () => {
    const { PrismaClient } = require('@prisma/client');
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });
  }, { singleton: true });
  
  // Register middleware
  container.register('ErrorMiddleware', () => {
    const errorHandler = container.resolve<IErrorHandler>('ErrorHandler');
    return new ErrorMiddleware(logger, errorHandler, process.env.NODE_ENV !== 'production');
  }, { singleton: true });
  
  container.register('RequestLoggerMiddleware', () => {
    return new RequestLoggerMiddleware(logger);
  }, { singleton: true });
  
  container.register('AuthMiddleware', () => {
    const errorHandler = container.resolve<IErrorHandler>('ErrorHandler');
    return new AuthMiddleware(
      errorHandler,
      logger,
      process.env.JWT_SECRET || 'default-secret-key'
    );
  }, { singleton: true });
  
  logger.info('Core services registered');
}

/**
 * Setup middleware
 * 
 * @param app - Express application
 * @param logger - Logging service
 */
function setupMiddleware(app: Express, logger: ILoggingService) {
  logger.info('Setting up middleware...');
  
  // Security middleware
  app.use(helmet());
  
  // CORS middleware
  const corsOptions = {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };
  app.use(cors(corsOptions));
  
  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  
  // Static files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Request logging middleware
  const requestLogger = container.resolve<RequestLoggerMiddleware>('RequestLoggerMiddleware');
  app.use(requestLogger.logRequest);
  
  // API rate limiting middleware
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' }
  });
  app.use('/api/v1', apiLimiter);
  
  logger.info('Middleware setup complete');
}

/**
 * Setup routes
 * 
 * @param app - Express application
 * @param logger - Logging service
 */
function setupRoutes(app: Express, logger: ILoggingService) {
  logger.info('Setting up routes...');
  
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });
  
  // TODO: Configure routes with controllers
  
  logger.info('Routes setup complete');
}

/**
 * Setup error handling
 * 
 * @param app - Express application
 * @param logger - Logging service
 * @param errorHandler - Error handler
 */
function setupErrorHandling(app: Express, logger: ILoggingService, errorHandler: IErrorHandler) {
  logger.info('Setting up error handling...');
  
  // Setup error middleware
  const errorMiddleware = container.resolve<ErrorMiddleware>('ErrorMiddleware');
  errorMiddleware.register(app);
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error, { stack: error.stack });
    
    // Exit with error after logging
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
  
  // Handle unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', reason instanceof Error ? reason : String(reason), { promise });
    // Don't exit for unhandled rejections, just log them
  });
  
  logger.info('Error handling setup complete');
}

// Export for testing
export default initializeApp;

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeApp();
}