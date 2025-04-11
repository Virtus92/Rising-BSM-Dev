/**
 * Factory-Funktionen für Service-Instanzen
 */
import { getLogger } from '@/infrastructure/common/logging';
import { getErrorHandler, getValidationService } from '@/infrastructure/common/bootstrap';
import { configService } from '@/infrastructure/services/ConfigService';

// Repository-Factories
import { 
  getUserRepository,
  getCustomerRepository,
  getRefreshTokenRepository,
  getActivityLogRepository,
  getAppointmentRepository,
  getRequestRepository,
  getNotificationRepository
} from './repositoryFactory';

// Services
import { AuthService } from '@/infrastructure/services/AuthService';
import { UserService } from '@/infrastructure/services/UserService';
import { CustomerService } from '@/infrastructure/services/CustomerService';
import { AppointmentService } from '@/infrastructure/services/AppointmentService';
import { RequestService } from '@/infrastructure/services/RequestService';
import { ActivityLogService } from '@/infrastructure/services/ActivityLogService';
import { NotificationService } from '@/infrastructure/services/NotificationService';
import { RefreshTokenService } from '@/infrastructure/services/RefreshTokenService';

// Interfaces
import { IAuthService } from '@/domain/services/IAuthService';
import { IUserService } from '@/domain/services/IUserService';
import { ICustomerService } from '@/domain/services/ICustomerService';
import { IAppointmentService } from '@/domain/services/IAppointmentService';
import { IRequestService } from '@/domain/services/IRequestService';
import { IActivityLogService } from '@/domain/services/IActivityLogService';
import { INotificationService } from '@/domain/services/INotificationService';
import { IRefreshTokenService } from '@/domain/services/IRefreshTokenService';

// Singleton-Instanzen für Services
let authService: AuthService;
let userService: UserService;
let customerService: CustomerService;
let appointmentService: AppointmentService;
let requestService: RequestService;
let activityLogService: ActivityLogService;
let notificationService: NotificationService;
let refreshTokenService: RefreshTokenService;

/**
 * Gibt eine Singleton-Instanz des AuthService zurück
 */
export function getAuthService(): IAuthService {
  if (!authService) {
    // Verwende die JWT-Konfiguration aus dem ConfigService
    const jwtConfig = configService.getJwtConfig();
    
    authService = new AuthService(
      getUserRepository(),
      getRefreshTokenRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler(),
      jwtConfig
    );
  }
  return authService;
}

/**
 * Gibt eine Singleton-Instanz des UserService zurück
 */
export function getUserService(): IUserService {
  if (!userService) {
    // Create a properly initialized UserService instance
    const staticUserService = new UserService(
      getUserRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
    
    // For now, use type assertion to bridge the interface gap
    // This is a temporary solution until the service is fully implemented
    userService = staticUserService as any as UserService;
  }
  return userService as unknown as IUserService;
}

/**
 * Gibt eine Singleton-Instanz des CustomerService zurück
 */
export function getCustomerService(): ICustomerService {
  if (!customerService) {
    // Create a properly initialized CustomerService instance
    const staticCustomerService = new CustomerService(
      getCustomerRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
    
    // For now, use type assertion to bridge the interface gap
    // This is a temporary solution until the service is fully implemented
    customerService = staticCustomerService as any as CustomerService;
  }
  return customerService as unknown as ICustomerService;
}

/**
 * Gibt eine Singleton-Instanz des AppointmentService zurück
 */
export function getAppointmentService(): IAppointmentService {
  if (!appointmentService) {
    // Vollständige Implementierung des AppointmentService
    appointmentService = new AppointmentService(
      getAppointmentRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
  }
  return appointmentService as unknown as IAppointmentService;
}

/**
 * Gibt eine Singleton-Instanz des RequestService zurück
 */
export function getRequestService(): IRequestService {
  if (!requestService) {
    // Vollständige Implementierung des RequestService
    requestService = new RequestService(
      getRequestRepository(),
      getCustomerRepository(),
      getAppointmentRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
  }
  return requestService as unknown as IRequestService;
}

/**
 * Gibt eine Singleton-Instanz des ActivityLogService zurück
 */
export function getActivityLogService(): IActivityLogService {
  if (!activityLogService) {
    activityLogService = new ActivityLogService(
      getActivityLogRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
  }
  return activityLogService;
}

/**
 * Gibt eine Singleton-Instanz des NotificationService zurück
 */
export function getNotificationService(): INotificationService {
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
 * Gibt eine Singleton-Instanz des RefreshTokenService zurück
 */
export function getRefreshTokenService(): IRefreshTokenService {
  if (!refreshTokenService) {
    refreshTokenService = new RefreshTokenService(
      getRefreshTokenRepository(),
      getLogger(),
      getValidationService(),
      getErrorHandler()
    );
  }
  return refreshTokenService;
}

/**
 * Setzt alle Service-Instanzen zurück
 */
export function resetServices(): void {
  authService = undefined as any;
  userService = undefined as any;
  customerService = undefined as any;
  appointmentService = undefined as any;
  requestService = undefined as any;
  activityLogService = undefined as any;
  notificationService = undefined as any;
  refreshTokenService = undefined as any;
}
