/**
 * Factory-Funktionen für die Verwendung mit NextJS
 * 
 * Diese Datei bietet eine Kompatibilitätsschicht für den Übergang von Express zu NextJS.
 * Sie unterstützt sowohl den alten DiContainer als auch das neue Factory-System.
 */
import { createFactory, DiContainer } from './core/DiContainer';
import { 
  initializeCore, 
  initializeRepositories, 
  initializeServices
} from './services/factory';

// Repositories
import { CustomerRepository } from './repositories/CustomerRepository';
import { NotificationRepository } from './repositories/NotificationRepository';
import { UserRepository } from './repositories/UserRepository';
import { RefreshTokenRepository } from './repositories/RefreshTokenRepository';
import { ServiceRepository } from './repositories/ServiceRepository';
import { RequestRepository } from './repositories/RequestRepository';
import { ProjectRepository } from './repositories/ProjectRepository';

// Services
import { CustomerService } from './services/CustomerService';
import { NotificationService } from './services/NotificationService';
import { AuthService } from './services/AuthService';
import { UserService } from './services/UserService';
import { ProfileService } from './services/ProfileService';
import { SettingsService } from './services/SettingsService';
import { RequestService } from './services/RequestService';
import { ServiceService } from './services/ServiceService';
import { ProjectService } from './services/ProjectService';

// Controllers - werden für NextJS API-Routen durch direkte Dienst-Aufrufe ersetzt
import { CustomerController } from './controllers/CustomerController';
import { NotificationController } from './controllers/NotificationController';
import { AuthController } from './controllers/AuthController';
import { UserController } from './controllers/UserController';
import { ProfileController } from './controllers/ProfileController';
import { SettingsController } from './controllers/SettingsController';
import { RequestController } from './controllers/RequestController';
import { ServiceController } from './controllers/ServiceController';
import { ProjectController } from './controllers/ProjectController';

// Legacy Factory-Funktionen für Repository-Erstellung
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

export const createRequestRepositoryFactory = () => createFactory(
  RequestRepository,
  ['PrismaClient', 'LoggingService', 'ErrorHandler']
);

export const createProjectRepositoryFactory = () => createFactory(
  ProjectRepository,
  ['PrismaClient', 'LoggingService', 'ErrorHandler']
);

export const createServiceRepositoryFactory = () => createFactory(
  ServiceRepository,
  ['PrismaClient', 'LoggingService', 'ErrorHandler']
);

// Legacy Factory-Funktionen für Service-Erstellung
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

export const createRequestServiceFactory = () => createFactory(
  RequestService,
  ['RequestRepository', 'LoggingService', 'ErrorHandler']
);

export const createProjectServiceFactory = () => createFactory(
  ProjectService,
  ['ProjectRepository', 'LoggingService', 'ValidationService', 'ErrorHandler']
);

export const createServiceServiceFactory = () => createFactory(
  ServiceService,
  ['ServiceRepository', 'LoggingService', 'ValidationService', 'ErrorHandler']
);

// Legacy Factory-Funktionen für Controller-Erstellung
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

export const createRequestControllerFactory = () => createFactory(
  RequestController,
  ['RequestService', 'UserService', 'LoggingService', 'ErrorHandler']
);

export const createProjectControllerFactory = () => createFactory(
  ProjectController,
  ['ProjectService', 'LoggingService', 'ErrorHandler']
);

export const createServiceControllerFactory = () => createFactory(
  ServiceController,
  ['ServiceService', 'LoggingService', 'ErrorHandler']
);

/**
 * Repositories im DI-Container registrieren
 * 
 * @param container - DI-Container
 */
export function registerRepositories(container: DiContainer): void {
  container.register('CustomerRepository', createCustomerRepositoryFactory(), { singleton: true });
  container.register('NotificationRepository', createNotificationRepositoryFactory(), { singleton: true });
  container.register('UserRepository', createUserRepositoryFactory(), { singleton: true });
  container.register('RefreshTokenRepository', createRefreshTokenRepositoryFactory(), { singleton: true });
  container.register('RequestRepository', createRequestRepositoryFactory(), { singleton: true });
  container.register('ProjectRepository', createProjectRepositoryFactory(), { singleton: true });
  container.register('ServiceRepository', createServiceRepositoryFactory(), { singleton: true });
}

/**
 * Services im DI-Container registrieren
 * 
 * @param container - DI-Container
 */
export function registerServices(container: DiContainer): void {
  container.register('CustomerService', createCustomerServiceFactory(), { singleton: true });
  container.register('NotificationService', createNotificationServiceFactory(), { singleton: true });
  container.register('AuthService', createAuthServiceFactory(), { singleton: true });
  container.register('UserService', createUserServiceFactory(), { singleton: true });
  container.register('ProfileService', createProfileServiceFactory(), { singleton: true });
  container.register('SettingsService', createSettingsServiceFactory(), { singleton: true });
  container.register('RequestService', createRequestServiceFactory(), { singleton: true });
  container.register('ProjectService', createProjectServiceFactory(), { singleton: true });
  container.register('ServiceService', createServiceServiceFactory(), { singleton: true });
}

/**
 * Controller im DI-Container registrieren
 * 
 * @param container - DI-Container
 */
export function registerControllers(container: DiContainer): void {
  container.register('CustomerController', createCustomerControllerFactory(), { singleton: true });
  container.register('NotificationController', createNotificationControllerFactory(), { singleton: true });
  container.register('AuthController', createAuthControllerFactory(), { singleton: true });
  container.register('UserController', createUserControllerFactory(), { singleton: true });
  container.register('ProfileController', createProfileControllerFactory(), { singleton: true });
  container.register('SettingsController', createSettingsControllerFactory(), { singleton: true });
  container.register('RequestController', createRequestControllerFactory(), { singleton: true });
  container.register('ProjectController', createProjectControllerFactory(), { singleton: true });
  container.register('ServiceController', createServiceControllerFactory(), { singleton: true });
}

/**
 * Alle Komponenten im DI-Container registrieren
 * 
 * @param container - DI-Container
 */
export function registerAll(container: DiContainer) {
  registerRepositories(container);
  registerServices(container);
  registerControllers(container);
}

/**
 * Neue NextJS-optimierte Initialisierungsfunktion
 * Diese Funktion initialisiert alle erforderlichen Dienste durch das neue Factory-System
 */
export function initializeAll() {
  // Core-Dienste initialisieren (Logger, Validierung, Fehlerbehandlung)
  initializeCore();
  
  // Repositories initialisieren
  initializeRepositories();
  
  // Services initialisieren
  initializeServices();
  
  return true;
}