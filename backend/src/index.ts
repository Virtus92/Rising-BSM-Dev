// backend/src/index.ts
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Import container but don't call bootstrap yet
import container from './core/DiContainer.js';
import { LoggingService } from './core/LoggingService.js';
import { ErrorHandler } from './core/ErrorHandler.js';
import { ValidationService } from './core/ValidationService.js';
import { PrismaClient } from '@prisma/client';
import { LogFormat } from './interfaces/ILoggingService.js';

// Import middlewares and configs
import { ErrorMiddleware } from './middleware/ErrorMiddleware.js';
import { RequestLoggerMiddleware } from './middleware/RequestLoggerMiddleware.js';
import { AuthMiddleware } from './middleware/AuthMiddleware.js';
import { SwaggerConfig } from './config/SwaggerConfig.js';
import { RoutesConfig } from './config/RoutesConfig.js';

// Import repository and service registrations
import { registerAll } from './factories.js';

// Create ESM compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    // Create Express app
    const app = express();
    const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    
    // Register core services ONLY ONCE
    const logger = new LoggingService({
      level: (process.env.LOG_LEVEL as any) || 'info',
      format: process.env.NODE_ENV === 'production' ? LogFormat.JSON : LogFormat.PRETTY
    });
    
    // Register in container
    container.register('LoggingService', () => logger, { singleton: true });
    
    // Register error handler
    const errorHandler = new ErrorHandler(logger, process.env.NODE_ENV !== 'production');
    container.register('ErrorHandler', () => errorHandler, { singleton: true });
    
    // Register validation service
    container.register('ValidationService', () => new ValidationService(logger), { singleton: true });
    
    // Register Prisma client
    container.register('PrismaClient', () => {
      return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
      });
    }, { singleton: true });
    
    // Register all application services, repositories, and controllers
    registerAll(container);
    
    // Setup middleware
    setupMiddleware(app, logger);
    
    // Register routes
    const authMiddleware = new AuthMiddleware(errorHandler, logger, process.env.JWT_SECRET || 'default-secret-key');
    container.register('AuthMiddleware', () => authMiddleware, { singleton: true });
    
    // Setup routes - get controllers from container
    const routesConfig = new RoutesConfig(
      logger,
      authMiddleware,
      container.resolve('UserController'),
      container.resolve('NotificationController'),
      container.resolve('CustomerController'),
      container.resolve('AuthController')
    );
    routesConfig.registerRoutes(app);
    
    // Setup Swagger
    setupSwagger(app, logger);
    
    // Setup error handling
    const errorMiddleware = new ErrorMiddleware(logger, errorHandler, process.env.NODE_ENV !== 'production');
    errorMiddleware.register(app);
    
    // Start server
    app.listen(port, () => {
      logger.info(`Server running at http://localhost:${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('API documentation available at /api-docs');
    });
    
    return app;
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

function setupMiddleware(app, logger) {
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
  
  // Request logging middleware
  const requestLogger = new RequestLoggerMiddleware(logger);
  app.use(requestLogger.logRequest);
  
  // API rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' }
  });
  app.use('/api/v1', apiLimiter);
  
  // Static files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });
  
  logger.info('Middleware setup complete');
}

function setupSwagger(app, logger) {