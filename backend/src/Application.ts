/**
 * Application
 * 
 * Main application class responsible for initializing and running the Express server.
 * Orchestrates the setup of middleware, routes, and error handling.
 */
import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import path from 'path';

import { ILoggingService } from './interfaces/ILoggingService.js';
import { IErrorHandler } from './interfaces/IErrorHandler.js';
import { DiContainer } from './core/DiContainer.js';
import { AuthMiddleware } from './middleware/AuthMiddleware.js';
import { ErrorMiddleware } from './middleware/ErrorMiddleware.js';
import { RequestLoggerMiddleware } from './middleware/RequestLoggerMiddleware.js';

import { UserController } from './controllers/UserController.js';
import { NotificationController } from './controllers/NotificationController.js';
import { CustomerController } from './controllers/CustomerController.js';
import { RoutesConfig } from './config/RoutesConfig.js';
import { SwaggerConfig } from './config/SwaggerConfig.js';

export class Application {
  private readonly app: Express;
  private readonly port: number;
  private readonly logger: ILoggingService;
  private readonly errorHandler: IErrorHandler;
  
  /**
   * Creates a new Application instance
   * 
   * @param container - Dependency injection container
   * @param port - Port to listen on
   */
  constructor(
    private readonly container: DiContainer,
    port: number = 5000
  ) {
    this.app = express();
    this.port = port;
    this.logger = container.resolve<ILoggingService>('LoggingService');
    this.errorHandler = container.resolve<IErrorHandler>('ErrorHandler');
    
    this.logger.info('Application instance created');
  }
  
  /**
   * Initialize the application
   */
  public async initialize(): Promise<void> {
    this.logger.info('Initializing application...');
    
    try {
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      this.logger.info('Application initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize application', error instanceof Error ? error : String(error));
      throw error;
    }
  }
  
  /**
   * Start the application
   */
  public async start(): Promise<void> {
    try {
      await this.initialize();
      
      // Start server
      this.app.listen(this.port, () => {
        this.logger.info(`Server running at http://localhost:${this.port}`);
        this.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        
        if (process.env.NODE_ENV !== 'production') {
          this.logger.info(`API Documentation: http://localhost:${this.port}/api-docs`);
        }
      });
    } catch (error) {
      this.logger.error('Failed to start application', error instanceof Error ? error : String(error));
      process.exit(1);
    }
  }
  
  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    this.logger.debug('Setting up middleware...');
    
    // Security middleware
    this.app.use(helmet());
    
    // CORS middleware
    const corsOptions = {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    };
    this.app.use(cors(corsOptions));
    
    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    
    // Static files
    this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
    
    // Request logging middleware
    const requestLogger = this.container.resolve<RequestLoggerMiddleware>('RequestLoggerMiddleware');
    this.app.use(requestLogger.logRequest);
    
    // API rate limiting middleware
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per window
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many requests, please try again later.' }
    });
    this.app.use('/api/v1', apiLimiter);
    
    this.logger.debug('Middleware setup complete');
  }
  
  /**
   * Setup routes
   */
  private setupRoutes(): void {
    this.logger.debug('Setting up routes...');
    
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });
    
    // API version endpoint
    this.app.get('/api/v1/version', (_req, res) => {
      res.status(200).json({
        version: process.env.npm_package_version || '1.0.0',
        name: process.env.npm_package_name || 'rising-bsm-api',
        timestamp: new Date().toISOString()
      });
    });
    
    // Setup Swagger documentation
    const swaggerConfig = this.container.resolve<SwaggerConfig>('SwaggerConfig');
    swaggerConfig.setup(this.app);
    
    // Setup API routes
    const routesConfig = this.container.resolve<RoutesConfig>('RoutesConfig');
    routesConfig.registerRoutes(this.app);
    
    this.logger.debug('Routes setup complete');
  }
  
  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.logger.debug('Setting up error handling...');
    
    // Setup error middleware
    const errorMiddleware = this.container.resolve<ErrorMiddleware>('ErrorMiddleware');
    errorMiddleware.register(this.app);
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception', { error });
      
      // Exit with error after logging
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });
    
    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection', { reason, promise });
      // Don't exit for unhandled rejections, just log them
    });
    
    this.logger.debug('Error handling setup complete');
  }
  
  /**
   * Get Express application instance
   */
  public getApp(): Express {
    return this.app;
  }
}