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

// Middleware
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { ErrorMiddleware } from '../middleware/ErrorMiddleware.js';
import { RequestLoggerMiddleware } from '../middleware/RequestLoggerMiddleware.js';

// Repositories
import { UserRepository } from '../repositories/UserRepository.js';
import { RoleRepository } from '../repositories/RoleRepository.js';
import { PermissionRepository } from '../repositories/PermissionRepository.js';
import { NotificationRepository } from '../repositories/NotificationRepository.js';
import { CustomerRepository } from '../repositories/CustomerRepository.js';
import { RefreshTokenRepository } from '../repositories/RefreshTokenRepository.js';

// Services
import { UserService } from '../services/UserService.js';
import { NotificationService } from '../services/NotificationService.js';
import { CustomerService } from '../services/CustomerService.js';
import { AuthService } from '../services/AuthService.js';
import { RoleService } from '../services/RoleService.js';

// Controllers
import { UserController } from '../controllers/UserController.js';
import { NotificationController } from '../controllers/NotificationController.js';
import { CustomerController } from '../controllers/CustomerController.js';
import { AuthController } from '../controllers/AuthController.js';
import { RoleController } from '../controllers/RoleController.js';

// Configuration
import { SwaggerConfig } from '../config/SwaggerConfig.js';
import { RoutesConfig } from '../config/RoutesConfig.js';

// Interfaces
import { IAuthController } from '../interfaces/IAuthController.js';
import { IAuthService } from '../interfaces/IAuthService.js';
import { IRefreshTokenRepository } from '../interfaces/IRefreshTokenRepository.js';
import { IUserController } from '../interfaces/IUserController.js';
import { IUserService } from '../interfaces/IUserService.js';
import { IUserRepository } from '../interfaces/IUserRepository.js';
import { IRoleController } from '../interfaces/IRoleController.js';
import { IRoleRepository } from '../interfaces/IRoleRepository.js';
import { IPermissionRepository } from '../interfaces/IPermissionRepository.js';
import { INotificationService } from '../interfaces/INotificationService.js';
import { INotificationRepository } from '../interfaces/INotificationRepository.js';
import { INotificationController } from '../interfaces/INotificationController.js';
import { ICustomerController } from '../interfaces/ICustomerController.js';
import { ICustomerService } from '../interfaces/ICustomerService.js';
import { ICustomerRepository } from '../interfaces/ICustomerRepository.js';
import { IRoleService } from '../interfaces/IRoleService.js';
import { ILoggingService, LogLevel, LogFormat } from '../interfaces/ILoggingService.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';

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
      const permissionRepository = this.container.resolve<IPermissionRepository>('PermissionRepository');
      const userService = this.container.resolve<IUserService>('UserService');
    
    logger.info('Registering middleware...');
    
    this.container.register('AuthMiddleware', () => {
      return new AuthMiddleware(
        errorHandler,
        logger,
        process.env.JWT_SECRET || 'default-secret-key',
        permissionRepository,
        userService
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
      return new NotificationRepository(prisma, logger, errorHandler) as INotificationRepository;
    }, { singleton: true });
    
    // Customer repository
    this.container.register<ICustomerRepository>('CustomerRepository', () => {
      return  new CustomerRepository(prisma, logger, errorHandler);
    }, { singleton: true });
      
      // Refresh token repository
    this.container.register<IRefreshTokenRepository>('RefreshTokenRepository', () => {
      return new RefreshTokenRepository(prisma, logger, errorHandler);
    }, { singleton: true });

    this.container.register<IRoleRepository>('RoleRepository', () => {
      return new RoleRepository(prisma, logger, errorHandler);
    }, { singleton: true });
    
    this.container.register<IPermissionRepository>('PermissionRepository', () => {
      return new PermissionRepository(prisma, logger, errorHandler);
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
    const userRepository = this.container.resolve<IUserRepository>('UserRepository');
    const logger = this.container.resolve<ILoggingService>('LoggingService');
    const validator = this.container.resolve<IValidationService>('ValidationService');
    const roleRepository = this.container.resolve<IRoleRepository>('RoleRepository');
    const permissionRepository = this.container.resolve<IPermissionRepository>('PermissionRepository');
    const errorHandler = this.container.resolve<IErrorHandler>('ErrorHandler');
    
    logger.info('Registering services...');

    // User service
    this.container.register<IUserService>('UserService', () => {
      return new UserService(userRepository, roleRepository, permissionRepository, logger, validator, errorHandler);
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

    // Role service
    this.container.register<IRoleService>('RoleService', () => {
      const roleRepository = this.container.resolve<IRoleRepository>('RoleRepository');
      const permissionRepository = this.container.resolve<IPermissionRepository>('PermissionRepository');
      return new RoleService(roleRepository, permissionRepository, logger, validator, errorHandler);
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
    const roleController = this.container.resolve<IRoleController>('RoleController');
    
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

    
    this.container.register<IRoleController>('RoleController', () => {
      const roleService = this.container.resolve<IRoleService>('RoleService');
      return new RoleController(roleService, logger, errorHandler);
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