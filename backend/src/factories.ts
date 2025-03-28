/**
 * Factory functions for registering services with the DI container
 */
import { createFactory, DiContainer } from './core/DiContainer.js';

// Repositories
import { CustomerRepository } from './repositories/CustomerRepository.js';
import { NotificationRepository } from './repositories/NotificationRepository.js';
import { UserRepository } from './repositories/UserRepository.js';
import { RefreshTokenRepository } from './repositories/RefreshTokenRepository.js';

// Services
import { CustomerService } from './services/CustomerService.js';
import { NotificationService } from './services/NotificationService.js';
import { AuthService } from './services/AuthService.js';
import { UserService } from './services/UserService.js';
import { ProfileService } from './services/ProfileService.js';
import { SettingsService } from './services/SettingsService.js';
import { ContactService } from './services/ContactService.js';

// Controllers
import { CustomerController } from './controllers/CustomerController.js';
import { NotificationController } from './controllers/NotificationController.js';
import { AuthController } from './controllers/AuthController.js';
import { UserController } from './controllers/UserController.js';
import { ProfileController } from './controllers/ProfileController.js';
import { SettingsController } from './controllers/SettingsController.js';
import { ContactController } from './controllers/ContactController.js';

// Create repository factories
export const createCustomerRepositoryFactory = () => createFactory(
  CustomerRepository,
  ['PrismaClient', 'LoggingService', 'ErrorHandler']
);

export const createNotificationRepositoryFactory = () => createFactory(
  NotificationRepository,
  ['PrismaClient', 'LoggingService', 'ErrorHandler']
);

export const createUserRepositoryFactory = () => createFactory(
  UserRepository,
  ['PrismaClient', 'LoggingService', 'ErrorHandler']
);

export const createRefreshTokenRepositoryFactory = () => createFactory(
  RefreshTokenRepository,
  ['PrismaClient', 'LoggingService', 'ErrorHandler']
);

// Create service factories
export const createCustomerServiceFactory = () => createFactory(
  CustomerService,
  ['CustomerRepository', 'LoggingService', 'ValidationService', 'ErrorHandler']
);

export const createNotificationServiceFactory = () => createFactory(
  NotificationService,
  ['NotificationRepository', 'LoggingService', 'ValidationService', 'ErrorHandler']
);

export const createAuthServiceFactory = () => createFactory(
  AuthService,
  ['UserRepository', 'RefreshTokenRepository', 'LoggingService', 'ValidationService', 'ErrorHandler']
);

export const createUserServiceFactory = () => createFactory(
  UserService,
  ['UserRepository', 'LoggingService', 'ValidationService', 'ErrorHandler']
);

export const createProfileServiceFactory = () => createFactory(
  ProfileService,
  ['PrismaClient', 'LoggingService', 'ErrorHandler']
);

export const createSettingsServiceFactory = () => createFactory(
  SettingsService,
  ['PrismaClient', 'LoggingService', 'ErrorHandler']
);

export const createContactServiceFactory = () => createFactory(
  ContactService,
  ['PrismaClient', 'LoggingService', 'ErrorHandler']
);

// Create controller factories
export const createCustomerControllerFactory = () => createFactory(
  CustomerController,
  ['CustomerService', 'LoggingService', 'ErrorHandler']
);

export const createNotificationControllerFactory = () => createFactory(
  NotificationController,
  ['NotificationService', 'LoggingService', 'ErrorHandler']
);

export const createAuthControllerFactory = () => createFactory(
  AuthController,
  ['AuthService', 'LoggingService', 'ErrorHandler']
);

export const createUserControllerFactory = () => createFactory(
  UserController,
  ['UserService', 'LoggingService', 'ErrorHandler']
);

export const createProfileControllerFactory = () => createFactory(
  ProfileController,
  ['ProfileService', 'LoggingService', 'ErrorHandler']
);

export const createSettingsControllerFactory = () => createFactory(
  SettingsController,
  ['SettingsService', 'LoggingService', 'ErrorHandler']
);

export const createContactControllerFactory = () => createFactory(
  ContactController,
  ['ContactService', 'LoggingService', 'ErrorHandler']
);

/**
 * Register all repositories with the DI container
 * 
 * @param container - DI container
 */
export function registerRepositories(container: DiContainer): void {
  container.register('CustomerRepository', createCustomerRepositoryFactory(), { singleton: true });
  container.register('NotificationRepository', createNotificationRepositoryFactory(), { singleton: true });
  container.register('UserRepository', createUserRepositoryFactory(), { singleton: true });
  container.register('RefreshTokenRepository', createRefreshTokenRepositoryFactory(), { singleton: true });
}

/**
 * Register all services with the DI container
 * 
 * @param container - DI container
 */
export function registerServices(container: DiContainer): void {
  container.register('CustomerService', createCustomerServiceFactory(), { singleton: true });
  container.register('NotificationService', createNotificationServiceFactory(), { singleton: true });
  container.register('AuthService', createAuthServiceFactory(), { singleton: true });
  container.register('UserService', createUserServiceFactory(), { singleton: true });
  container.register('ProfileService', createProfileServiceFactory(), { singleton: true });
  container.register('SettingsService', createSettingsServiceFactory(), { singleton: true });
  container.register('ContactService', createContactServiceFactory(), { singleton: true });
}

/**
 * Register all controllers with the DI container
 * 
 * @param container - DI container
 */
export function registerControllers(container: DiContainer): void {
  container.register('CustomerController', createCustomerControllerFactory(), { singleton: true });
  container.register('NotificationController', createNotificationControllerFactory(), { singleton: true });
  container.register('AuthController', createAuthControllerFactory(), { singleton: true });
  container.register('UserController', createUserControllerFactory(), { singleton: true });
  container.register('ProfileController', createProfileControllerFactory(), { singleton: true });
  container.register('SettingsController', createSettingsControllerFactory(), { singleton: true });
  container.register('ContactController', createContactControllerFactory(), { singleton: true });
}

/**
 * Register all components with the DI container
 * 
 * @param container - DI container
 */
export function registerAll(container: DiContainer) {
  registerRepositories(container);
  registerServices(container);
  registerControllers(container);
}