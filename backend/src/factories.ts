/**
 * Factory functions for registering services with the DI container
 */
import { createFactory } from './core/DiContainer.js';

// Repositories
import { CustomerRepository } from './repositories/CustomerRepository.js';
import { NotificationRepository } from './repositories/NotificationRepository.js';

// Services
import { CustomerService } from './services/CustomerService.js';
import { NotificationService } from '../services/notification.service.js';

// Controllers
import { CustomerController } from './controllers/CustomerController.js';
import { NotificationController } from './controllers/NotificationController.js';

// Create repository factories
export const createCustomerRepositoryFactory = () => createFactory(
  CustomerRepository,
  ['PrismaClient', 'LoggingService', 'ErrorHandler']
);

export const createNotificationRepositoryFactory = () => createFactory(
  NotificationRepository,
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

// Create controller factories
export const createCustomerControllerFactory = () => createFactory(
  CustomerController,
  ['CustomerService', 'LoggingService', 'ErrorHandler']
);

export const createNotificationControllerFactory = () => createFactory(
  NotificationController,
  ['NotificationService', 'LoggingService', 'ErrorHandler']
);

/**
 * Register all repositories with the DI container
 * 
 * @param container - DI container
 */
export function registerRepositories(container) {
  container.register('CustomerRepository', createCustomerRepositoryFactory(), { singleton: true });
  container.register('NotificationRepository', createNotificationRepositoryFactory(), { singleton: true });
}

/**
 * Register all services with the DI container
 * 
 * @param container - DI container
 */
export function registerServices(container) {
  container.register('CustomerService', createCustomerServiceFactory(), { singleton: true });
  container.register('NotificationService', createNotificationServiceFactory(), { singleton: true });
}

/**
 * Register all controllers with the DI container
 * 
 * @param container - DI container
 */
export function registerControllers(container) {
  container.register('CustomerController', createCustomerControllerFactory(), { singleton: true });
  container.register('NotificationController', createNotificationControllerFactory(), { singleton: true });
}

/**
 * Register all components with the DI container
 * 
 * @param container - DI container
 */
export function registerAll(container) {
  registerRepositories(container);
  registerServices(container);
  registerControllers(container);
}