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
  getNotificationRepository,
  getPermissionRepository,
  getRequestDataRepository
} from './repositoryFactory';

// Services
// Remove static import of AuthService to prevent bundling in client code
import { AuthClientService } from '@/infrastructure/clients/AuthClientService'; // Client-side auth service
import { UserService } from '@/infrastructure/services/UserService';
import { CustomerService } from '@/infrastructure/services/CustomerService';
import { AppointmentService } from '@/infrastructure/services/AppointmentService';
import { RequestService } from '@/infrastructure/services/RequestService';
import { ActivityLogService } from '@/infrastructure/services/ActivityLogService';
import { NotificationService } from '@/infrastructure/services/NotificationService';
import { RefreshTokenService } from '@/infrastructure/services/RefreshTokenService';
import { PermissionService } from '@/infrastructure/services/PermissionService';
import { RequestDataService } from '@/infrastructure/services/request-data/RequestDataService';
import { N8NIntegrationService } from '@/infrastructure/services/n8n/N8NIntegrationService';

// Interfaces
import { IAuthService } from '@/domain/services/IAuthService';
import { IUserService } from '@/domain/services/IUserService';
import { ICustomerService } from '@/domain/services/ICustomerService';
import { IAppointmentService } from '@/domain/services/IAppointmentService';
import { IRequestService } from '@/domain/services/IRequestService';
import { IActivityLogService } from '@/domain/services/IActivityLogService';
import { INotificationService } from '@/domain/services/INotificationService';
import { IRefreshTokenService } from '@/domain/services/IRefreshTokenService';
import { IPermissionService } from '@/domain/services/IPermissionService';
import { IRequestDataService } from '@/domain/services/IRequestDataService';
import { IN8NIntegrationService } from '@/domain/services/IN8NIntegrationService';

/**
 * ServiceFactory Klasse für einheitliche Erstellung von Services
 */
export class ServiceFactory {
  private static instance: ServiceFactory;

  // Singleton-Instanzen für Services
  private authService?: IAuthService;
  private userService?: UserService;
  private customerService?: CustomerService;
  private appointmentService?: AppointmentService;
  private requestService?: RequestService;
  private activityLogService?: ActivityLogService;
  private notificationService?: NotificationService;
  private refreshTokenService?: RefreshTokenService;
  private permissionService?: PermissionService;
  private requestDataService?: RequestDataService;
  private n8nIntegrationService?: N8NIntegrationService;

  /**
   * Private Konstruktor für Singleton-Pattern
   */
  private constructor() {}

  /**
   * Gibt die Singleton-Instanz der ServiceFactory zurück
   */
  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  /**
   * Erstellt eine Instanz des AuthService
   */
  public createAuthService(): IAuthService {
    // Always use client-side auth service when running in the browser
    if (typeof window !== 'undefined') {
      // Return the client-side auth service that avoids crypto modules
      // No need to create a new instance each time - this is a stateless service
      return AuthClientService as unknown as IAuthService;
    }
    
    // Use server-side auth service with full crypto capabilities - only on server
    if (!this.authService) {
      try {
        // Verwende die JWT-Konfiguration aus dem ConfigService
        const jwtConfig = configService.getJwtConfig();
        
        // Dynamic import to prevent bundling in client code
        const { AuthService } = require('@/infrastructure/services/AuthService');
        
        this.authService = new AuthService(
          getUserRepository(),
          getRefreshTokenRepository(),
          getLogger(),
          getValidationService(),
          getErrorHandler(),
          jwtConfig
        );
      } catch (error) {
        // Fallback to client version if server import fails (should not happen)
        console.error('Failed to initialize server-side AuthService:', error);
        return AuthClientService as unknown as IAuthService;
      }
    }
    // Ensure we return a valid IAuthService instance
    if (!this.authService) {
      // If we somehow don't have an authService yet, return the client version as fallback
      return AuthClientService as unknown as IAuthService;
    }
    return this.authService;
  }

  /**
   * Erstellt eine Instanz des UserService
   */
  public createUserService(): IUserService {
    if (!this.userService) {
      // Create a properly initialized UserService instance
      const staticUserService = new UserService(
        getUserRepository(),
        getLogger(),
        getValidationService(),
        getErrorHandler()
      );

      // For now, use type assertion to bridge the interface gap
      this.userService = staticUserService as UserService;
    }
    return this.userService as unknown as IUserService;
  }

  /**
   * Erstellt eine Instanz des CustomerService
   */
  public createCustomerService(): ICustomerService {
    if (!this.customerService) {
      // Create a properly initialized CustomerService instance
      const staticCustomerService = new CustomerService(
        getCustomerRepository(),
        getLogger(),
        getValidationService(),
        getErrorHandler()
      );
      
      // For now, use type assertion to bridge the interface gap
      // This is a temporary solution until the service is fully implemented
      this.customerService = staticCustomerService as any as CustomerService;
    }
    return this.customerService as unknown as ICustomerService;
  }

  /**
   * Erstellt eine Instanz des AppointmentService
   */
  public createAppointmentService(): IAppointmentService {
    if (!this.appointmentService) {
      // Vollständige Implementierung des AppointmentService
      this.appointmentService = new AppointmentService(
        getAppointmentRepository(),
        getLogger(),
        getValidationService(),
        getErrorHandler()
      );
    }
    return this.appointmentService as unknown as IAppointmentService;
  }

  /**
   * Erstellt eine Instanz des RequestService
   */
  public createRequestService(): IRequestService {
    if (!this.requestService) {
      // Vollständige Implementierung des RequestService
      this.requestService = new RequestService(
        getRequestRepository(),
        getCustomerRepository(),
        getUserRepository(),
        getAppointmentRepository(),
        getRequestDataRepository(),
        getLogger(),
        getValidationService(),
        getErrorHandler()
      );
    }
    return this.requestService as unknown as IRequestService;
  }

  /**
   * Creates a RequestDataService instance
   */
  public createRequestDataService(): IRequestDataService {
    if (!this.requestDataService) {
      // Get repository instances
      const repository = getRequestDataRepository();
      const requestRepo = getRequestRepository();
      
      // Create service with proper repositories
      // Both repository.findAll and repository interfaces now match what's expected
      this.requestDataService = new RequestDataService(
        repository,
        requestRepo,
        getLogger(),
        getValidationService(),
        getErrorHandler()
      );
    }
    return this.requestDataService;
  }

  /**
   * Creates an N8NIntegrationService instance
   */
  public createN8NIntegrationService(): IN8NIntegrationService {
    if (!this.n8nIntegrationService) {
      this.n8nIntegrationService = new N8NIntegrationService(
        getRequestRepository(),
        getRequestDataRepository(),
        getLogger(),
        getErrorHandler(),
        configService
      );
    }
    return this.n8nIntegrationService as unknown as IN8NIntegrationService;
  }

  /**
   * Erstellt eine Instanz des ActivityLogService
   */
  public createActivityLogService(): IActivityLogService {
    if (!this.activityLogService) {
      this.activityLogService = new ActivityLogService(
        getActivityLogRepository(),
        getLogger(),
        getValidationService(),
        getErrorHandler()
      );
    }
    return this.activityLogService;
  }

  /**
   * Erstellt eine Instanz des NotificationService
   */
  public createNotificationService(): INotificationService {
    if (!this.notificationService) {
      this.notificationService = new NotificationService(
        getNotificationRepository(),
        getLogger(),
        getValidationService(),
        getErrorHandler()
      );
    }
    return this.notificationService;
  }

  /**
   * Erstellt eine Instanz des RefreshTokenService
   */
  public createRefreshTokenService(): IRefreshTokenService {
    if (!this.refreshTokenService) {
      this.refreshTokenService = new RefreshTokenService(
        getRefreshTokenRepository(),
        getLogger(),
        getValidationService(),
        getErrorHandler()
      );
    }
    return this.refreshTokenService;
  }

  /**
   * Creates a Permission Service instance
   */
  public createPermissionService(): IPermissionService {
    if (!this.permissionService) {
      this.permissionService = new PermissionService(
        getPermissionRepository(),
        getLogger(),
        getValidationService(),
        getErrorHandler()
      );
    }
    return this.permissionService;
  }

  /**
   * Setzt alle Service-Instanzen zurück
   */
  public resetServices(): void {
    this.authService = undefined;
    this.userService = undefined;
    this.customerService = undefined;
    this.appointmentService = undefined;
    this.requestService = undefined;
    this.activityLogService = undefined;
    this.notificationService = undefined;
    this.refreshTokenService = undefined;
    this.permissionService = undefined;
    this.requestDataService = undefined;
    this.n8nIntegrationService = undefined;
  }
}

/**
 * Gibt eine Singleton-Instanz der ServiceFactory zurück
 */
export function getServiceFactory(): ServiceFactory {
  return ServiceFactory.getInstance();
}

// Export individual service factory functions for backward compatibility
export function getAuthService(): IAuthService {
  return getServiceFactory().createAuthService();
}

export function getUserService(): IUserService {
  return getServiceFactory().createUserService();
}

export function getCustomerService(): ICustomerService {
  return getServiceFactory().createCustomerService();
}

export function getAppointmentService(): IAppointmentService {
  return getServiceFactory().createAppointmentService();
}

export function getRequestService(): IRequestService {
  return getServiceFactory().createRequestService();
}

export function getRequestDataService(): IRequestDataService {
  return getServiceFactory().createRequestDataService();
}

export function getN8NIntegrationService(): IN8NIntegrationService {
  return getServiceFactory().createN8NIntegrationService();
}

export function getActivityLogService(): IActivityLogService {
  return getServiceFactory().createActivityLogService();
}

export function getNotificationService(): INotificationService {
  return getServiceFactory().createNotificationService();
}

export function getRefreshTokenService(): IRefreshTokenService {
  return getServiceFactory().createRefreshTokenService();
}

export function getPermissionService(): IPermissionService {
  return getServiceFactory().createPermissionService();
}

export function resetServices(): void {
  getServiceFactory().resetServices();
}
