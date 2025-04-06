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
import { DashboardRepository } from '../repositories/DashboardRepository.js';
import { AppointmentRepository } from '../repositories/AppointmentRepository.js';
import { ProjectRepository } from '../repositories/ProjectRepository.js';
import { ServiceRepository } from '../repositories/ServiceRepository.js';

// Services
import { UserService } from '../services/UserService.js';
import { NotificationService } from '../services/NotificationService.js';
import { CustomerService } from '../services/CustomerService.js';
import { AuthService } from '../services/AuthService.js';
import { DashboardService } from '../services/DashboardService.js';
import { AppointmentService } from '../services/AppointmentService.js';
import { ProjectService } from '../services/ProjectService.js';
import { ServiceService } from '../services/ServiceService.js';

// Controllers
import { UserController } from '../controllers/UserController.js';
import { NotificationController } from '../controllers/NotificationController.js';
import { CustomerController } from '../controllers/CustomerController.js';
import { AuthController } from '../controllers/AuthController.js';
import { DashboardController } from '../controllers/DashboardController.js';
import { AppointmentController } from '../controllers/AppointmentController.js';
import { ProjectController } from '../controllers/ProjectController.js';
import { ServiceController } from '../controllers/ServiceController.js';

// Profile Components
import { IProfileService } from '../interfaces/IProfileService.js';
import { IProfileController } from '../interfaces/IProfileController.js';
import { ProfileService } from '../services/ProfileService.js';
import { ProfileController } from '../controllers/ProfileController.js';

// Settings Components
import { ISettingsService } from '../interfaces/ISettingsService.js';
import { ISettingsController } from '../interfaces/ISettingsController.js';
import { SettingsService } from '../services/SettingsService.js';
import { SettingsController } from '../controllers/SettingsController.js';

// Request Components
import { IRequestService } from '../interfaces/IRequestService.js';
import { IRequestController } from '../interfaces/IRequestController.js';
import { IRequestRepository } from '../interfaces/IRequestRepository.js';
import { RequestService } from '../services/RequestService.js';
import { RequestController } from '../controllers/RequestController.js';
import { RequestRepository } from '../repositories/RequestRepository.js';

// Dashboard Components
import { IDashboardRepository } from '../interfaces/IDashboardRepository.js';
import { IDashboardService } from '../interfaces/IDashboardService.js';
import { IDashboardController } from '../interfaces/IDashboardController.js';

// Appointment Components
import { IAppointmentRepository } from '../interfaces/IAppointmentRepository.js';
import { IProjectRepository } from '../interfaces/IProjectRepository.js';
import { IProjectService } from '../interfaces/IProjectService.js';
import { IProjectController } from '../interfaces/IProjectController.js';
import { IAppointmentService } from '../interfaces/IAppointmentService.js';
import { IAppointmentController } from '../interfaces/IAppointmentController.js';

// Service Components
import { IServiceRepository } from '../interfaces/IServiceRepository.js';
import { IServiceService } from '../interfaces/IServiceService.js';
import { IServiceController } from '../interfaces/IServiceController.js';

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
      return new NotificationRepository(prisma, logger, errorHandler) as INotificationRepository;
    }, { singleton: true });
    
    // Customer repository
    this.container.register<ICustomerRepository>('CustomerRepository', () => {
      return new CustomerRepository(prisma, logger, errorHandler);
    }, { singleton: true });
      
    // Refresh token repository
    this.container.register<IRefreshTokenRepository>('RefreshTokenRepository', () => {
      return new RefreshTokenRepository(prisma, logger, errorHandler);
    }, { singleton: true });
    
    // Dashboard repository
    this.container.register<IDashboardRepository>('DashboardRepository', () => {
      return new DashboardRepository(prisma, logger, errorHandler);
    }, { singleton: true });

    // Request repository
    this.container.register<IRequestRepository>('RequestRepository', () => {
      return new RequestRepository(prisma, logger, errorHandler);
    }, { singleton: true });
    
    // Appointment repository
    this.container.register<IAppointmentRepository>('AppointmentRepository', () => {
      return new AppointmentRepository(prisma, logger, errorHandler);
    }, { singleton: true });
    
    // Project repository
    this.container.register<IProjectRepository>('ProjectRepository', () => {
      return new ProjectRepository(prisma, logger, errorHandler);
    }, { singleton: true });
    
    // Service repository
    this.container.register<IServiceRepository>('ServiceRepository', () => {
      return new ServiceRepository(prisma, logger, errorHandler);
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
    
    // Profile service
    this.container.register<IProfileService>('ProfileService', () => {
      const prisma = this.container.resolve<PrismaClient>('PrismaClient');
      return new ProfileService(prisma, logger, errorHandler);
    }, { singleton: true });
    
    // Settings service
    this.container.register<ISettingsService>('SettingsService', () => {
      const prisma = this.container.resolve<PrismaClient>('PrismaClient');
      return new SettingsService(prisma, logger, errorHandler);
    }, { singleton: true });
    
    // Request service
    this.container.register<IRequestService>('RequestService', () => {
      const requestRepository = this.container.resolve<IRequestRepository>('RequestRepository');
      return new RequestService(requestRepository, logger, errorHandler);
    }, { singleton: true });

    // Dashboard service
    this.container.register<IDashboardService>('DashboardService', () => {
      const dashboardRepository = this.container.resolve<IDashboardRepository>('DashboardRepository');
      return new DashboardService(dashboardRepository, logger, validator, errorHandler);
    }, { singleton: true });
    
    // Appointment service
    this.container.register<IAppointmentService>('AppointmentService', () => {
      const appointmentRepository = this.container.resolve<IAppointmentRepository>('AppointmentRepository');
      const customerRepository = this.container.resolve<ICustomerRepository>('CustomerRepository');
      const projectRepository = this.container.resolve<IProjectRepository>('ProjectRepository');
      return new AppointmentService(appointmentRepository, customerRepository, projectRepository, logger, validator, errorHandler);
    }, { singleton: true });

    // Project service
    this.container.register<IProjectService>('ProjectService', () => {
      const projectRepository = this.container.resolve<IProjectRepository>('ProjectRepository');
      return new ProjectService(projectRepository, logger, validator, errorHandler);
    }, { singleton: true });
    
    // Service service
    this.container.register<IServiceService>('ServiceService', () => {
      const serviceRepository = this.container.resolve<IServiceRepository>('ServiceRepository');
      return new ServiceService(serviceRepository, logger, validator, errorHandler);
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
    
    // Profile controller
    this.container.register<IProfileController>('ProfileController', () => {
      const profileService = this.container.resolve<IProfileService>('ProfileService');
      return new ProfileController(profileService, logger, errorHandler);
    }, { singleton: true });
    
    // Settings controller
    this.container.register<ISettingsController>('SettingsController', () => {
      const settingsService = this.container.resolve<ISettingsService>('SettingsService');
      return new SettingsController(settingsService, logger, errorHandler);
    }, { singleton: true });
    
    // Request controller
    this.container.register<IRequestController>('RequestController', () => {
      const requestService = this.container.resolve<IRequestService>('RequestService');
      const userService = this.container.resolve<IUserService>('UserService');
      return new RequestController(requestService, userService, logger, errorHandler);
    }, { singleton: true });

    // Dashboard controller
    this.container.register<IDashboardController>('DashboardController', () => {
      const dashboardService = this.container.resolve<IDashboardService>('DashboardService');
      return new DashboardController(dashboardService, logger, errorHandler);
    }, { singleton: true });
    
    // Appointment controller
    this.container.register<IAppointmentController>('AppointmentController', () => {
      const appointmentService = this.container.resolve<IAppointmentService>('AppointmentService');
      return new AppointmentController(appointmentService, logger, errorHandler);
    }, { singleton: true });

    // Project controller
    this.container.register<IProjectController>('ProjectController', () => {
      const projectService = this.container.resolve<IProjectService>('ProjectService');
      return new ProjectController(projectService, logger, errorHandler);
    }, { singleton: true });
    
    // Service controller
    this.container.register<IServiceController>('ServiceController', () => {
      const serviceService = this.container.resolve<IServiceService>('ServiceService');
      return new ServiceController(serviceService, logger, errorHandler);
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