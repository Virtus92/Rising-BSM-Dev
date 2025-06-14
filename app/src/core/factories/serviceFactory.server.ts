/**
 * Server-only factory functions for service instances
 * This module is exclusively for server contexts and should never be used on the client side.
 */

// Mark as server-only to prevent client-side imports
import 'server-only';

import { getLogger } from '@/core/logging';
import { getErrorHandler, getValidationService } from '@/core/bootstrap/bootstrap.server';
import { configService } from '@/core/config/ConfigService';
import { SecurityConfig, securityConfig } from '@/core/config/SecurityConfig';
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
  getRequestDataRepository,
  getAutomationWebhookRepository,
  getAutomationScheduleRepository,
  getAutomationExecutionRepository,
  getApiKeyRepository
} from './repositoryFactory.server';

// Services
import { AuthServiceServer } from '@/features/auth/lib/services/AuthService.server';
import { CustomerService } from '@/features/customers/lib/services/CustomerService.server';
import { AppointmentService } from '@/features/appointments/lib/services/AppointmentService.server';
import { RequestServiceImpl } from '@/features/requests/lib/services/RequestService.server';
import { ActivityLogService } from '@/features/activity/lib/services/ActivityLogService';
import { PermissionService } from '@/features/permissions/lib/services/PermissionService';
import { RequestDataService } from '@/features/requests/lib/services/RequestDataService';
import { UserService } from '@/features/users/lib/services/UserService.server';
import { NotificationService } from '@/features/notifications/lib/services/NotificationService.server';
import { RefreshTokenServiceServer } from '@/features/auth/lib/services/RefreshTokenService.server';
import { AutomationService } from '@/features/automation/lib/services/AutomationService.server';
import { ApiKeyService } from '@/features/api-keys/lib/services/ApiKeyService.server';
// Use dynamic import for NotificationService to avoid circular dependencies

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

import { IAutomationService } from '@/domain/services/IAutomationService';
import { IApiKeyService } from '@/domain/services/IApiKeyService';
import { RefreshToken } from '@/domain/entities/RefreshToken';
import { PermissionRepository } from '@/features/permissions/lib';

/**
 * ServiceFactory class for uniform creation of services
 */
export class ServiceFactory implements IServiceFactory {
  private static instance: ServiceFactory;

  // Singleton instances for services
  private authService = new AuthServiceServer;
  private userService?: UserService;
  private customerService?: CustomerService;
  private appointmentService?: AppointmentService;
  private requestService?: RequestServiceImpl;
  private activityLogService?: ActivityLogService;
  private notificationService?: NotificationService;
  private permissionService?: PermissionService;
  private requestDataService?: RequestDataService;

  private refreshTokenService?: RefreshTokenServiceServer;
  private automationService?: AutomationService;
  private apiKeyService?: ApiKeyService;

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
    // Return the server-side AuthService implementation
    if (!this.authService) {
      this.authService = new AuthServiceServer;
    }
    return this.authService as IAuthService;
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
      this.customerService = new CustomerService(
        getCustomerRepository(),
        getLogger(),
        getValidationService(),
        getErrorHandler()
      );
    }
    return this.customerService as ICustomerService;
  }

  /**
   * Creates an instance of AppointmentService
   */
  public createAppointmentService(): IAppointmentService {
    if (!this.appointmentService) {
      // Complete implementation of AppointmentService
      this.appointmentService = new AppointmentService(
        getAppointmentRepository(),
        getLogger(),
        getValidationService(),
        getErrorHandler()
      );
    }
    return this.appointmentService as IAppointmentService;
  }

  /**
   * Creates an instance of RequestService
   */
  public createRequestService(): IRequestService {
    if (!this.requestService) {
      // Complete implementation of RequestService
      this.requestService = new RequestServiceImpl(
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
   * Directly uses AuthService as the single source of truth
   */
  public createRefreshTokenService(): IRefreshTokenService {
    // Return the server-side RefreshTokenService implementation
    if (!this.refreshTokenService) {
      this.refreshTokenService = new RefreshTokenServiceServer;
    }
    return this.refreshTokenService as IRefreshTokenService;
  }

    /**
   * Creates an instance of AutomationService
   */
  public createAutomationService(): IAutomationService {
    if (!this.automationService) {
      this.automationService = new AutomationService(
        getAutomationWebhookRepository(),
        getAutomationScheduleRepository(),
        getAutomationExecutionRepository(),
        getLogger(),
        getValidationService(),
        getErrorHandler()
      );
    }
    return this.automationService as IAutomationService;
  }

  /**
   * Creates an instance of ApiKeyService
   */
  public createApiKeyService(): IApiKeyService {
    if (!this.apiKeyService) {
      this.apiKeyService = new ApiKeyService(
        getApiKeyRepository()
      );
    }
    return this.apiKeyService as IApiKeyService;
  }

  /**
   * Creates a Permission Service instance
   */
  public createPermissionService(): IPermissionService {
    if (!this.permissionService) {
      // Get the Prisma client explicitly from the proper import
      const { prisma } = require('@/core/db/prisma/client');
      // Ensure Prisma client is available
      if (!prisma) {
        const errorMsg = 'Prisma client is not available in serviceFactory.createPermissionService';
        const logger = getLogger();
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }
      // Create a new instance with the repository
      const repository = new PermissionRepository(prisma, getLogger(), getErrorHandler());
      this.permissionService = new PermissionService(repository);
    }
    return this.permissionService as IPermissionService;
  }

  /**
   * Resets all service instances
   */
  public resetServices(): void {
    // No need to initialize AuthService on server-side, as it's stateless
    
    // Reset other services
    this.userService = undefined;
    this.customerService = undefined;
    this.appointmentService = undefined;
    this.requestService = undefined;
    this.activityLogService = undefined;
    this.notificationService = undefined;
    this.permissionService = undefined;
    this.requestDataService = undefined;

    this.automationService = undefined;
    this.apiKeyService = undefined;
  }
  
  /**
   * Create security configuration
   */
  public createSecurityConfig(): SecurityConfig {
    return securityConfig;
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

export function getAutomationService(): IAutomationService {
  return getServiceFactory().createAutomationService();
}

export function getApiKeyService(): IApiKeyService {
  return getServiceFactory().createApiKeyService();
}

export function resetServices(): void {
  getServiceFactory().resetServices();
}
