/**
 * Service and Repository Factories
 * 
 * Diese Datei bietet ein optimiertes Factory-System für Service- und Repository-Instanzen
 * mit Dependency Injection für die Next.js Anwendung.
 */
import { prisma } from './db';
import { getLogger, getErrorHandler, getValidationService } from './core/bootstrap';

// Repositories
import { UserRepository } from './repositories/UserRepository';
import { CustomerRepository } from './repositories/CustomerRepository';
import { ProjectRepository } from './repositories/ProjectRepository';
import { ServiceRepository } from './repositories/ServiceRepository';
import { AppointmentRepository } from './repositories/AppointmentRepository';
import { NotificationRepository } from './repositories/NotificationRepository';
import { RequestRepository } from './repositories/RequestRepository';
import { RefreshTokenRepository } from './repositories/RefreshTokenRepository';

// Services
import { UserService } from './services/UserService';
import { AuthService } from './services/AuthService';
import { CustomerService } from './services/CustomerService';
import { ProjectService } from './services/ProjectService';
import { ServiceService } from './services/ServiceService';
import { AppointmentService } from './services/AppointmentService';
import { NotificationService } from './services/NotificationService';
import { RequestService } from './services/RequestService';

// Singleton-Instanzen für Repositories
let userRepository: UserRepository;
let customerRepository: CustomerRepository;
let serviceRepository: ServiceRepository;
let projectRepository: ProjectRepository;
let appointmentRepository: AppointmentRepository;
let notificationRepository: NotificationRepository;
let refreshTokenRepository: RefreshTokenRepository;
let requestRepository: RequestRepository;

// Singleton-Instanzen für Services
let userService: UserService;
let authService: AuthService;
let customerService: CustomerService;
let serviceService: ServiceService;
let projectService: ProjectService;
let appointmentService: AppointmentService;
let notificationService: NotificationService;
let requestService: RequestService;

// Repository Factory-Funktionen

/**
 * Gibt das UserRepository zurück
 */
export function getUserRepository(): UserRepository {
  if (!userRepository) {
    userRepository = new UserRepository(prisma, getLogger(), getErrorHandler());
  }
  return userRepository;
}

/**
 * Gibt das CustomerRepository zurück
 */
export function getCustomerRepository(): CustomerRepository {
  if (!customerRepository) {
    customerRepository = new CustomerRepository(prisma, getLogger(), getErrorHandler());
  }
  return customerRepository;
}

/**
 * Gibt das ProjectRepository zurück
 */
export function getProjectRepository(): ProjectRepository {
  if (!projectRepository) {
    projectRepository = new ProjectRepository(prisma, getLogger(), getErrorHandler());
  }
  return projectRepository;
}

/**
 * Gibt das ServiceRepository zurück
 */
export function getServiceRepository(): ServiceRepository {
  if (!serviceRepository) {
    serviceRepository = new ServiceRepository(prisma, getLogger(), getErrorHandler());
  }
  return serviceRepository;
}

/**
 * Gibt das AppointmentRepository zurück
 */
export function getAppointmentRepository(): AppointmentRepository {
  if (!appointmentRepository) {
    appointmentRepository = new AppointmentRepository(prisma, getLogger(), getErrorHandler());
  }
  return appointmentRepository;
}

/**
 * Gibt das NotificationRepository zurück
 */
export function getNotificationRepository(): NotificationRepository {
  if (!notificationRepository) {
    notificationRepository = new NotificationRepository(prisma, getLogger(), getErrorHandler());
  }
  return notificationRepository;
}

/**
 * Gibt das RequestRepository zurück
 */
export function getRequestRepository(): RequestRepository {
  if (!requestRepository) {
    requestRepository = new RequestRepository(prisma, getLogger(), getErrorHandler());
  }
  return requestRepository;
}

/**
 * Gibt das RefreshTokenRepository zurück
 */
export function getRefreshTokenRepository(): RefreshTokenRepository {
  if (!refreshTokenRepository) {
    refreshTokenRepository = new RefreshTokenRepository(prisma, getLogger(), getErrorHandler());
  }
  return refreshTokenRepository;
}

// Service Factory-Funktionen

/**
 * Gibt den UserService zurück
 */
export function getUserService(): UserService {
  if (!userService) {
    userService = new UserService(
      getUserRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
  }
  return userService;
}

/**
 * Gibt den AuthService zurück
 */
export function getAuthService(): AuthService {
  if (!authService) {
    authService = new AuthService(
      getUserRepository(),
      getRefreshTokenRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
  }
  return authService;
}

/**
 * Gibt den CustomerService zurück
 */
export function getCustomerService(): CustomerService {
  if (!customerService) {
    customerService = new CustomerService(
      getCustomerRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
  }
  return customerService;
}

/**
 * Gibt den ProjectService zurück
 */
export function getProjectService(): ProjectService {
  if (!projectService) {
    projectService = new ProjectService(
      getProjectRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
  }
  return projectService;
}

/**
 * Gibt den ServiceService zurück
 */
export function getServiceService(): ServiceService {
  if (!serviceService) {
    serviceService = new ServiceService(
      getServiceRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
  }
  return serviceService;
}

/**
 * Gibt den AppointmentService zurück
 */
export function getAppointmentService(): AppointmentService {
  if (!appointmentService) {
    appointmentService = new AppointmentService(
      getAppointmentRepository(),
      getCustomerRepository(),
      getProjectRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
  }
  return appointmentService;
}

/**
 * Gibt den NotificationService zurück
 */
export function getNotificationService(): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService(
      getNotificationRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
  }
  return notificationService;
}

/**
 * Gibt den RequestService zurück
 */
export function getRequestService(): RequestService {
  if (!requestService) {
    requestService = new RequestService(
      getRequestRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
  }
  return requestService;
}
