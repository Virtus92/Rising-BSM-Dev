/**
 * Service Factory
 * 
 * Vereinfachter Ersatz für das DI-Container-System in NextJS.
 * Bietet Factory-Funktionen für alle Services und Repositories.
 */
import { PrismaClient } from '@prisma/client';
import { LoggingService } from '../../core/LoggingService';
import { ValidationService } from '../../core/ValidationService';
import { ErrorHandler } from '../../core/ErrorHandler';
import { LogLevel, LogFormat } from '../../interfaces/ILoggingService';

// Repositories
import { UserRepository } from '../../repositories/UserRepository';
import { NotificationRepository } from '../../repositories/NotificationRepository';
import { CustomerRepository } from '../../repositories/CustomerRepository';
import { RefreshTokenRepository } from '../../repositories/RefreshTokenRepository';
import { DashboardRepository } from '../../repositories/DashboardRepository';
import { RequestRepository } from '../../repositories/RequestRepository';
import { AppointmentRepository } from '../../repositories/AppointmentRepository';
import { ProjectRepository } from '../../repositories/ProjectRepository';
import { ServiceRepository } from '../../repositories/ServiceRepository';

// Services
import { UserService } from '../../services/UserService';
import { NotificationService } from '../../services/NotificationService';
import { CustomerService } from '../../services/CustomerService';
import { AuthService } from '../../services/AuthService';
import { ProfileService } from '../../services/ProfileService';
import { SettingsService } from '../../services/SettingsService';
import { RequestService } from '../../services/RequestService';
import { DashboardService } from '../../services/DashboardService';
import { AppointmentService } from '../../services/AppointmentService';
import { ProjectService } from '../../services/ProjectService';
import { ServiceService } from '../../services/ServiceService';

// Singleton-Instanzen
let prismaClient: PrismaClient;
let loggingService: LoggingService;
let validationService: ValidationService;
let errorHandler: ErrorHandler;

// Repositories
let userRepository: UserRepository;
let notificationRepository: NotificationRepository;
let customerRepository: CustomerRepository;
let refreshTokenRepository: RefreshTokenRepository;
let dashboardRepository: DashboardRepository;
let requestRepository: RequestRepository;
let appointmentRepository: AppointmentRepository;
let projectRepository: ProjectRepository;
let serviceRepository: ServiceRepository;

// Services
let userService: UserService;
let notificationService: NotificationService;
let customerService: CustomerService;
let authService: AuthService;
let profileService: ProfileService;
let settingsService: SettingsService;
let requestService: RequestService;
let dashboardService: DashboardService;
let appointmentService: AppointmentService;
let projectService: ProjectService;
let serviceService: ServiceService;

/**
 * Initialisiert alle gemeinsamen Basis-Services
 */
function initializeCore() {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });
  }

  if (!loggingService) {
    loggingService = new LoggingService({
      level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
      format: (process.env.NODE_ENV === 'production' ? LogFormat.JSON : LogFormat.PRETTY)
    });
  }

  if (!validationService) {
    validationService = new ValidationService(loggingService);
  }

  if (!errorHandler) {
    errorHandler = new ErrorHandler(
      loggingService,
      process.env.NODE_ENV !== 'production'
    );
  }
}

/**
 * Initialisiert alle Repositories
 */
function initializeRepositories() {
  initializeCore();

  if (!userRepository) {
    userRepository = new UserRepository(prismaClient, loggingService, errorHandler);
  }

  if (!notificationRepository) {
    notificationRepository = new NotificationRepository(prismaClient, loggingService, errorHandler);
  }

  if (!customerRepository) {
    customerRepository = new CustomerRepository(prismaClient, loggingService, errorHandler);
  }

  if (!refreshTokenRepository) {
    refreshTokenRepository = new RefreshTokenRepository(prismaClient, loggingService, errorHandler);
  }

  if (!dashboardRepository) {
    dashboardRepository = new DashboardRepository(prismaClient, loggingService, errorHandler);
  }

  if (!requestRepository) {
    requestRepository = new RequestRepository(prismaClient, loggingService, errorHandler);
  }

  if (!appointmentRepository) {
    appointmentRepository = new AppointmentRepository(prismaClient, loggingService, errorHandler);
  }

  if (!projectRepository) {
    projectRepository = new ProjectRepository(prismaClient, loggingService, errorHandler);
  }

  if (!serviceRepository) {
    serviceRepository = new ServiceRepository(prismaClient, loggingService, errorHandler);
  }
}

/**
 * Initialisiert alle Services
 */
function initializeServices() {
  initializeRepositories();

  if (!userService) {
    userService = new UserService(userRepository, loggingService, validationService, errorHandler);
  }

  if (!notificationService) {
    notificationService = new NotificationService(notificationRepository, loggingService, validationService, errorHandler);
  }

  if (!customerService) {
    customerService = new CustomerService(customerRepository, loggingService, validationService, errorHandler);
  }

  if (!authService) {
    authService = new AuthService(
      userRepository, 
      refreshTokenRepository, 
      loggingService, 
      validationService, 
      errorHandler
    );
  }

  if (!profileService) {
    profileService = new ProfileService(prismaClient, loggingService, errorHandler);
  }

  if (!settingsService) {
    settingsService = new SettingsService(prismaClient, loggingService, errorHandler);
  }

  if (!requestService) {
    requestService = new RequestService(requestRepository, loggingService, errorHandler);
  }

  if (!dashboardService) {
    dashboardService = new DashboardService(dashboardRepository, loggingService, validationService, errorHandler);
  }

  if (!appointmentService) {
    appointmentService = new AppointmentService(
      appointmentRepository,
      customerRepository,
      projectRepository,
      loggingService, 
      validationService, 
      errorHandler
    );
  }

  if (!projectService) {
    projectService = new ProjectService(projectRepository, loggingService, validationService, errorHandler);
  }

  if (!serviceService) {
    serviceService = new ServiceService(serviceRepository, loggingService, validationService, errorHandler);
  }
}

// Factory-Funktionen für Core-Services
export function getPrismaClient() {
  initializeCore();
  return prismaClient;
}

export function getLoggingService() {
  initializeCore();
  return loggingService;
}

export function getValidationService() {
  initializeCore();
  return validationService;
}

export function getErrorHandler() {
  initializeCore();
  return errorHandler;
}

// Factory-Funktionen für Repositories
export function getUserRepository() {
  initializeRepositories();
  return userRepository;
}

export function getNotificationRepository() {
  initializeRepositories();
  return notificationRepository;
}

export function getCustomerRepository() {
  initializeRepositories();
  return customerRepository;
}

export function getRefreshTokenRepository() {
  initializeRepositories();
  return refreshTokenRepository;
}

export function getDashboardRepository() {
  initializeRepositories();
  return dashboardRepository;
}

export function getRequestRepository() {
  initializeRepositories();
  return requestRepository;
}

export function getAppointmentRepository() {
  initializeRepositories();
  return appointmentRepository;
}

export function getProjectRepository() {
  initializeRepositories();
  return projectRepository;
}

export function getServiceRepository() {
  initializeRepositories();
  return serviceRepository;
}

// Factory-Funktionen für Services
export function getUserService() {
  initializeServices();
  return userService;
}

export function getNotificationService() {
  initializeServices();
  return notificationService;
}

export function getCustomerService() {
  initializeServices();
  return customerService;
}

export function getAuthService() {
  initializeServices();
  return authService;
}

export function getProfileService() {
  initializeServices();
  return profileService;
}

export function getSettingsService() {
  initializeServices();
  return settingsService;
}

export function getRequestService() {
  initializeServices();
  return requestService;
}

export function getDashboardService() {
  initializeServices();
  return dashboardService;
}

export function getAppointmentService() {
  initializeServices();
  return appointmentService;
}

export function getProjectService() {
  initializeServices();
  return projectService;
}

export function getServiceService() {
  initializeServices();
  return serviceService;
}

// Expliziter Export der Initialisierer für Server-Komponenten
export {
  initializeCore,
  initializeRepositories,
  initializeServices
};