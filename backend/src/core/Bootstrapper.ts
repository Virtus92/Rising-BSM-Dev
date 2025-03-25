import container, { DiContainer, createFactory } from './DiContainer.js';
import { LoggingService } from './LoggingService.js';
import { ValidationService } from './ValidationService.js';
import { ErrorHandler } from './ErrorHandler.js';
import { ILoggingService, LogLevel, LogFormat } from '../interfaces/ILoggingService.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';

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

    logger.info('Core services registered');
    return this.container;
  }

  /**
   * Register repositories
   * 
   * @returns Bootstrapper instance for chaining
   */
  public registerRepositories(): Bootstrapper {
    const logger = this.container.resolve<ILoggingService>('LoggingService');
    logger.info('Registering repositories...');

    // Register repositories here
    // Example:
    // this.container.register<IUserRepository>('UserRepository', createFactory(UserRepository, [
    //   'DatabaseProvider', 'LoggingService', 'ErrorHandler'
    // ]), { singleton: true });

    return this;
  }

  /**
   * Register services
   * 
   * @returns Bootstrapper instance for chaining
   */
  public registerServices(): Bootstrapper {
    const logger = this.container.resolve<ILoggingService>('LoggingService');
    logger.info('Registering services...');

    // Register services here
    // Example:
    // this.container.register<IUserService>('UserService', createFactory(UserService, [
    //   'UserRepository', 'LoggingService', 'ValidationService', 'ErrorHandler'
    // ]), { singleton: true });

    return this;
  }

  /**
   * Register controllers
   * 
   * @returns Bootstrapper instance for chaining
   */
  public registerControllers(): Bootstrapper {
    const logger = this.container.resolve<ILoggingService>('LoggingService');
    logger.info('Registering controllers...');

    // Register controllers here
    // Example:
    // this.container.register<UserController>('UserController', createFactory(UserController, [
    //   'UserService', 'LoggingService', 'ErrorHandler'
    // ]), { singleton: true });

    return this;
  }

  /**
   * Initialize the entire application
   * 
   * @returns Initialized container
   */
  public initialize(): DiContainer {
    this.initializeCore();
    this.registerRepositories();
    this.registerServices();
    this.registerControllers();

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