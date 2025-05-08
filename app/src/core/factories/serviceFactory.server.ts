/**
 * Server-only factory functions for service instances
 * This module is exclusively for server contexts and should never be used on the client side.
 */

// Mark as server-only to prevent client-side imports
import 'server-only';

import { getLogger } from '@/core/logging';
import { getErrorHandler, getValidationService } from '@/core/bootstrap/bootstrap.server';
import { configService } from '@/core/config/ConfigService';
import { IServiceFactory } from './serviceFactory.interface';

// Server-only repository factories
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
} from './repositoryFactory.server';

// Services
import { AuthService } from '@/features/auth/lib/services/AuthService';
import { CustomerService } from '@/features/customers/lib/services/CustomerService';
import { AppointmentService } from '@/features/appointments/lib/services/AppointmentService';
import { RequestService } from '@/features/requests/lib/services/RequestService';
import { ActivityLogService } from '@/features/activity/lib/services/ActivityLogService';
import { RefreshTokenService } from '@/features/auth/lib/services/RefreshTokenService';
import { PermissionService } from '@/features/permissions/lib/services/PermissionService';
import { RequestDataService } from '@/features/requests/lib/services/RequestDataService';
import { N8NIntegrationService } from '@/features/n8n/lib/services/N8NIntegrationService';
import { EventTriggerService } from '@/features/n8n/lib/services/EventTriggerService';
import { WebhookManagementService } from '@/features/n8n/lib/services/WebhookManagementService';
import { ApiEndpointService } from '@/features/n8n/lib/services/ApiEndpointService';
import { UserService } from '@/features/users/lib/services/UserService.server';
import { NotificationService } from '@/features/notifications/lib/services/NotificationService.server';

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
 * ServiceFactory class for uniform creation of services
 */
export class ServiceFactory implements IServiceFactory {
  private static instance: ServiceFactory;

  // Singleton instances for services
  private authService?: AuthService;
  private userService?: UserService;
  private customerService?: CustomerService;
  private appointmentService?: AppointmentService;
  private requestService?: RequestService;
  private activityLogService?: ActivityLogService;
  private notificationService?: NotificationService;
  private refreshTokenService?: RefreshTokenService;
  private permissionService?: PermissionService;
  private requestDataService?: RequestDataService;
  
  // N8N related services
  private eventTriggerService?: EventTriggerService;
  private webhookManagementService?: WebhookManagementService;
  private apiEndpointService?: ApiEndpointService;
  private n8nIntegrationService?: N8NIntegrationService;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Returns the singleton instance of ServiceFactory
   */
  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  /**
   * Creates an instance of AuthService
   */
  public createAuthService(): IAuthService {
    if (!this.authService) {
      // Use JWT configuration from ConfigService
      const jwtConfig = configService.getJwtConfig();
      
      this.authService = new AuthService(
        getUserRepository(),
        getRefreshTokenRepository(),
        getLogger(),
        getValidationService(),
        getErrorHandler(),
        jwtConfig
      );
    }
    return this.authService;
  }

  /**
   * Creates an instance of UserService
   */
  public createUserService(): IUserService {
    if (!this.userService) {
      // Create a properly initialized UserService instance
      this.userService = new UserService();
    }
    return this.userService as IUserService;
  }

  /**
   * Creates an instance of CustomerService
   */
  public createCustomerService(): ICustomerService {
    if (!this.customerService) {
      // Create a properly initialized CustomerService instance
      this.customerService = new CustomerService();
    }
    return this.customerService as ICustomerService;
  }

  /**
   * Creates an instance of AppointmentService
   */
  public createAppointmentService(): IAppointmentService {
    if (!this.appointmentService) {
      // Complete implementation of AppointmentService
      this.appointmentService = new AppointmentService();
    }
    return this.appointmentService as IAppointmentService;
  }

  /**
   * Creates an instance of RequestService
   */
  public createRequestService(): IRequestService {
    if (!this.requestService) {
      // Complete implementation of RequestService
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
    return this.requestService!;
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
    return this.requestDataService!;
  }

  /**
   * Creates an EventTriggerService instance
   */
  public createEventTriggerService(): EventTriggerService {
    if (!this.eventTriggerService) {
      this.eventTriggerService = new EventTriggerService(
        getLogger()
      );
    }
    return this.eventTriggerService!;
  }

  /**
   * Creates a WebhookManagementService instance
   */
  public createWebhookManagementService(): WebhookManagementService {
    if (!this.webhookManagementService) {
      // TODO: Add webhook repository when available
      this.webhookManagementService = new WebhookManagementService(
        null as any, // Temporary placeholder for repository
        getLogger(),
        getErrorHandler(),
        configService
      );
    }
    return this.webhookManagementService!;
  }

  /**
   * Creates an ApiEndpointService instance
   */
  public createApiEndpointService(): ApiEndpointService {
    if (!this.apiEndpointService) {
      // TODO: Add API endpoint repository when available
      this.apiEndpointService = new ApiEndpointService(
        null as any, // Temporary placeholder for repository
        getLogger(),
        getErrorHandler()
      );
    }
    return this.apiEndpointService!;
  }

  /**
   * Creates an N8NIntegrationService instance
   */
  public createN8NIntegrationService(): IN8NIntegrationService {
    if (!this.n8nIntegrationService) {
      const eventTriggerService = this.createEventTriggerService();
      const webhookManagementService = this.createWebhookManagementService();
      const apiEndpointService = this.createApiEndpointService();
      
      this.n8nIntegrationService = new N8NIntegrationService(
        getRequestRepository(),
        getRequestDataRepository(),
        getLogger(),
        getErrorHandler(),
        configService,
        eventTriggerService,
        webhookManagementService,
        apiEndpointService
      );
    }
    return this.n8nIntegrationService!;
  }

  /**
   * Creates an instance of ActivityLogService
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
    return this.activityLogService!;
  }

  /**
   * Creates an instance of NotificationService
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
    return this.notificationService!;
  }

  /**
   * Creates an instance of RefreshTokenService
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
    return this.refreshTokenService!;
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
    return this.permissionService!;
  }

  /**
   * Resets all service instances
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
    this.eventTriggerService = undefined;
    this.webhookManagementService = undefined;
    this.apiEndpointService = undefined;
    this.n8nIntegrationService = undefined;
  }
}

/**
 * Returns a singleton instance of the ServiceFactory
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