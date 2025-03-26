/**
 * Bootstrapper
 * 
 * Initializes the application by setting up the dependency injection container
 * and registering core services.
 */
import container, { DiContainer, createFactory } from './DiContainer.js';
import { LoggingService } from './LoggingService.js';
import { ValidationService } from './ValidationService.js';
import { ErrorHandler } from './ErrorHandler.js';
import { ILoggingService, LogLevel, LogFormat } from '../interfaces/ILoggingService.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';

// Middleware
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { ErrorMiddleware } from '../middleware/ErrorMiddleware.js';
import { RequestLoggerMiddleware } from '../middleware/RequestLoggerMiddleware.js';

// Repositories
import { UserRepository } from '../repositories/UserRepository.js';
import { NotificationRepository } from '../repositories/NotificationRepository.js';
import { CustomerRepository } from '../repositories/CustomerRepository.js';
import { RefreshTokenRepository } from '../repositories/RefreshTokenRepository.js';

// Services
import { UserService } from '../services/UserService.js';
import { NotificationService } from '../services/NotificationService.js';
import { CustomerService } from '../services/CustomerService.js';
import { AuthService } from '../services/AuthService.js';

// Controllers
import { UserController } from '../controllers/UserController.js';
import { NotificationController } from '../controllers/NotificationController.js';
import { CustomerController } from '../controllers/CustomerController.js';
import { AuthController } from '../controllers/AuthController.js';

// Configuration
import { SwaggerConfig } from '../config/SwaggerConfig.js';
import { RoutesConfig } from '../config/RoutesConfig.js';

// Interfaces
import { IUserRepository } from '../interfaces/IUserRepository.js';
import { INotificationRepository } from '../interfaces/INotificationRepository.js';
import { ICustomerRepository } from '../interfaces/ICustomerRepository.js';
import { IRefreshTokenRepository } from '../interfaces/IRefreshTokenRepository.js';
import { IUserService } from '../interfaces/IUserService.js';
import { INotificationService } from '../interfaces/INotificationService.js';
import { ICustomerService } from '../interfaces/ICustomerService.js';
import { IAuthService } from '../interfaces/IAuthService.js';
import { IUserController } from '../interfaces/IUserController.js';
import { INotificationController } from '../interfaces/INotificationController.js';
import { ICustomerController } from '../interfaces/ICustomerController.js';
import { IAuthController } from '../interfaces/IAuthController.js';

/**
 * Database provider (Prisma)
 */
import { PrismaClient } from '@prisma/client';

/**
 * Bootstrapper
 * 
 * Initializes the application by setting up the dependency injection container
 * and registering core services.
 */
export class Bootstrapper {
  private readonly container: DiContainer;

  /**
   * Creates a new Bootstrapper instance
   */
  constructor() {
    this.container = container;
  }

  /**
   * Initialize core services
   * 
   * @returns Initialized container
   */
  public initializeCore(): DiContainer {
    // Register logging service
    this.container.register<ILoggingService>('LoggingService', () => {
      return new LoggingService({
        level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
        format: (process.env.NODE_ENV === 'production' ? LogFormat.JSON : LogFormat.PRETTY)
      });
    }, { singleton: true });

    // Get logger instance for subsequent registrations
    const logger = this.container.resolve<ILoggingService>('LoggingService');
    logger.info('Bootstrapping application...');

    // Register error handler
    this.container.register<IErrorHandler>('ErrorHandler', () => {
      return new ErrorHandler(
        logger,
        process.env.NODE_ENV !== 'production'
      );
    }, { singleton: true });

    // Register validation service
    this.container.register<IValidationService>('ValidationService', () => {
      return new ValidationService(logger);
    }, { singleton: true });
    
    // Register database provider
    this.container.register<PrismaClient>('PrismaClient', () => {
      return new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'error', 'warn'] 
          : ['error'],
      });
    }, { singleton: true });

    logger.info('Core services registered');
    return this.container;
  }

  /**
   * Register middleware
   * 
   * @returns Bootstrapper instance for chaining
   */
  public registerMiddleware(): Bootstrapper {
    const logger = this.container.resolve<ILoggingService>('LoggingService');
    const errorHandler = this.container.resolve<IErrorHandler>('ErrorHandler');
    
    logger.info('Registering middleware...');
    
    // Auth middleware
    this.container.register('AuthMiddleware', () => {
      return new AuthMiddleware(
        errorHandler,
        logger,
        process.env.JWT_SECRET || 'default-secret-key'
      );
    }, { singleton: true });
    
    // Error middleware
    this.container.register('ErrorMiddleware', () => {
      return new ErrorMiddleware(
        logger,
        errorHandler,
        process.env.NODE_ENV !== 'production'
      );
    }, { singleton: true });
    
    // Request logger middleware
    this.container.register('RequestLoggerMiddleware', () => {
      return new RequestLoggerMiddleware(logger);
    }, { singleton: true });
    
    logger.info('Middleware registered');
    return this;
  }

  /**
   * Register repositories
   * 
   * @returns Bootstrapper instance for chaining
   */
  public registerRepositories(): Bootstrapper {
    const logger = this.container.resolve<ILoggingService>('LoggingService');
    const errorHandler = this.container.resolve<IErrorHandler>('ErrorHandler');
    const prisma = this.container.resolve<PrismaClient>('PrismaClient');
    
    logger.info('Registering repositories...');

    // User repository
    this.container.register<IUserRepository>('UserRepository', () => {
      return new UserRepository(prisma, logger, errorHandler) as IUserRepository;
    }, { singleton: true });
    
    // Notification repository
    this.container.register<INotificationRepository>('NotificationRepository', () => {
      const notificationRepo = new NotificationRepository(prisma, logger, errorHandler);
      
      // Create a wrapper that adapts the implementation to the interface
      const wrapper: INotificationRepository = {
        ...notificationRepo as unknown as INotificationRepository,
        // Override the bulkUpdate method to match the interface
        bulkUpdate: async (ids: number[], data: Partial<any>): Promise<number> => {
          // Convert parameters to the format expected by the implementation
          const updateData = ids.map(id => ({ id, data }));
          const results = await notificationRepo.bulkUpdate(updateData);
          // Return the count of updated records
          return results.length;
        }
      };
      
      return wrapper;
    }, { singleton: true });
    
    // Customer repository
    // Customer repository
    this.container.register<ICustomerRepository>('CustomerRepository', () => {
      const customerRepo = new CustomerRepository(prisma, logger, errorHandler);
      
      // Create a wrapper that adapts the implementation to the interface
      const wrapper: ICustomerRepository = {
        ...customerRepo as unknown as ICustomerRepository,
        // Add the missing logActivity method to match the interface
        logActivity: async (
          userId: number, 
          actionType: string, 
          details?: string,
          ipAddress?: string
        ): Promise<any> => {
          logger.info(`User activity: ${actionType}`, {
            userId,
            actionType,
            details,
            ipAddress,
            entity: 'Customer'
          });
          return Promise.resolve();
        }
      };
      
      return wrapper;
    }, { singleton: true });

    // Refresh token repository
    this.container.register<IRefreshTokenRepository>('RefreshTokenRepository', () => {
      const refreshTokenRepo = new RefreshTokenRepository(prisma, logger, errorHandler);
      
      // Create a wrapper that adapts the implementation to the interface
      const wrapper: IRefreshTokenRepository = {
        ...refreshTokenRepo as unknown as IRefreshTokenRepository,
        // Add the missing logActivity method to match the interface
        logActivity: async (
          userId: number, 
          actionType: string, 
          details?: string,
          ipAddress?: string
        ): Promise<any> => {
          logger.info(`User activity: ${actionType}`, {
            userId,
            actionType,
            details,
            ipAddress,
            entity: 'RefreshToken'
          });
          return Promise.resolve();
        }
      };
      
      return wrapper;
    }, { singleton: true });
    
    logger.info('Repositories registered');
    return this;
  }
  /**
   * Register services
   * 
   * @returns Bootstrapper instance for chaining
   */
  public registerServices(): Bootstrapper {
    const logger = this.container.resolve<ILoggingService>('LoggingService');
    const validator = this.container.resolve<IValidationService>('ValidationService');
    const errorHandler = this.container.resolve<IErrorHandler>('ErrorHandler');
    
    logger.info('Registering services...');

    // User service
    this.container.register<IUserService>('UserService', () => {
      const userRepository = this.container.resolve<IUserRepository>('UserRepository');
      return new UserService(userRepository, logger, validator, errorHandler);
    }, { singleton: true });
    
    // Notification service
    this.container.register<INotificationService>('NotificationService', () => {
      const notificationRepository = this.container.resolve<INotificationRepository>('NotificationRepository');
      return new NotificationService(notificationRepository, logger, validator, errorHandler);
    }, { singleton: true });
    
    // Customer service
    this.container.register<ICustomerService>('CustomerService', () => {
      const customerRepository = this.container.resolve<ICustomerRepository>('CustomerRepository');
      return new CustomerService(customerRepository, logger, validator, errorHandler);
    }, { singleton: true });
    
    // Auth service
    this.container.register<IAuthService>('AuthService', () => {
      const userRepository = this.container.resolve<IUserRepository>('UserRepository');
      const refreshTokenRepository = this.container.resolve<IRefreshTokenRepository>('RefreshTokenRepository');
      return new AuthService(
        userRepository, 
        refreshTokenRepository, 
        logger, 
        validator, 
        errorHandler
      );
    }, { singleton: true });

    logger.info('Services registered');
    return this;
  }

  /**
   * Register controllers
   * 
   * @returns Bootstrapper instance for chaining
   */
  public registerControllers(): Bootstrapper {
    const logger = this.container.resolve<ILoggingService>('LoggingService');
    const errorHandler = this.container.resolve<IErrorHandler>('ErrorHandler');
    
    logger.info('Registering controllers...');

    // User controller
    this.container.register<IUserController>('UserController', () => {
      const userService = this.container.resolve<IUserService>('UserService');
      return new UserController(userService, logger, errorHandler);
    }, { singleton: true });
    
    // Notification controller
    this.container.register<INotificationController>('NotificationController', () => {
      const notificationService = this.container.resolve<INotificationService>('NotificationService');
      return new NotificationController(notificationService, logger, errorHandler);
    }, { singleton: true });
    
    // Customer controller
    this.container.register<ICustomerController>('CustomerController', () => {
      const customerService = this.container.resolve<ICustomerService>('CustomerService');
      return new CustomerController(customerService, logger, errorHandler);
    }, { singleton: true });
    
    // Auth controller
    this.container.register<IAuthController>('AuthController', () => {
      const authService = this.container.resolve<IAuthService>('AuthService');
      return new AuthController(authService, logger, errorHandler);
    }, { singleton: true });

    logger.info('Controllers registered');
    return this;
  }

  /**
   * Register configuration
   * 
   * @returns Bootstrapper instance for chaining
   */
  public registerConfiguration(): Bootstrapper {
    const logger = this.container.resolve<ILoggingService>('LoggingService');
    
    logger.info('Registering configuration...');
    
    // Swagger config
    this.container.register('SwaggerConfig', () => {
      return new SwaggerConfig(logger);
    }, { singleton: true });
    
    // Routes config
    this.container.register('RoutesConfig', () => {
      // Pass the container itself instead of individual dependencies
      return new RoutesConfig(this.container);
    }, { singleton: true });
    
    logger.info('Configuration registered');
    return this;
  }

  /**
   * Initialize the entire application
   * 
   * @returns Initialized container
   */
  public initialize(): DiContainer {
    this.initializeCore();
    this.registerMiddleware();
    this.registerRepositories();
    this.registerServices();
    this.registerControllers();
    this.registerConfiguration();

    const logger = this.container.resolve<ILoggingService>('LoggingService');
    logger.info('Application bootstrapped successfully');

    return this.container;
  }
}

/**
 * Bootstrap the application
 * 
 * @returns Initialized container
 */
export function bootstrap(): DiContainer {
  const bootstrapper = new Bootstrapper();
  return bootstrapper.initialize();
}

export default bootstrap;