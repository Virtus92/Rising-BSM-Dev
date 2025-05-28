/**
 * Factory functions for service instances
 * Used to create consistent service instances throughout the application.
 */

'use client';

import { getLogger } from '@/core/logging';
import { SecurityConfig, securityConfig } from '@/core/config/SecurityConfig';
import { IServiceFactory } from './serviceFactory.interface';
import { ErrorHandler } from '@/core/errors/ErrorHandler';



// Services from features
import AuthService, { AuthServiceClass } from '@/features/auth/core/AuthService';
import { CustomerService } from '@/features/customers/lib/services/CustomerService.client';
import { AppointmentService } from '@/features/appointments/lib/services/AppointmentService';
import { RequestService } from '@/features/requests/lib/services/RequestService.client';
import { ActivityLogService } from '@/features/activity/lib/services/ActivityLogService.client';
import { PermissionService } from '@/features/permissions/lib/services/PermissionService.client';
import { RequestDataService } from '@/features/requests/lib/services/RequestDataService.client';
import { NotificationService } from '@/features/notifications/lib/services/NotificationService.client';
import { UserService } from '@/features/users/lib/services/UserService';

// Service interfaces
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
import { IPluginService } from '@/domain/services/IPluginService';
import { IPluginLicenseService } from '@/domain/services/IPluginLicenseService';
import { IPluginInstallationService } from '@/domain/services/IPluginInstallationService';
import { getValidationService } from '../validation';
import errorHandler from '../errors/error-handler';

/**
 * ServiceFactory class for consistent service creation
 */
export class ServiceFactory implements IServiceFactory {
  private static instance: ServiceFactory;

  // Service instance cache
  private authService?: IAuthService;
  private userService?: IUserService;
  private customerService?: ICustomerService;
  private appointmentService?: IAppointmentService;
  private requestService?: IRequestService;
  private activityLogService?: IActivityLogService;
  private notificationService?: INotificationService;
  private permissionService?: IPermissionService;
  private requestDataService?: IRequestDataService;
  private automationService?: IAutomationService;
  private pluginService?: IPluginService;
  private pluginLicenseService?: IPluginLicenseService;
  private pluginInstallationService?: IPluginInstallationService;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Returns the singleton instance
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
    // AuthService is a singleton that's already properly initialized
    return AuthService as unknown as IAuthService;
  }

  /**
   * Creates an instance of UserService
   */
  public createUserService(): IUserService {
    if (!this.userService) {
      this.userService = new UserService() as IUserService;
    }
    return this.userService;
  }

  /**
   * Creates an instance of CustomerService
   */
  public createCustomerService(): ICustomerService {
    if (!this.customerService) {
      this.customerService = new CustomerService();
    }
    return this.customerService;
  }

  /**
   * Creates an instance of AppointmentService
   */
  public createAppointmentService(): IAppointmentService {
    if (!this.appointmentService) {
      this.appointmentService = new AppointmentService();
    }
    return this.appointmentService;
  }

  /**
   * Creates an instance of RequestService
   */
  public createRequestService(): IRequestService {
    if (!this.requestService) {
      this.requestService = new RequestService() as IRequestService;
    }
    return this.requestService;
  }

  /**
   * Creates an instance of ActivityLogService
   */
  public createActivityLogService(): IActivityLogService {
    if (!this.activityLogService) {
      this.activityLogService = new ActivityLogService();
    }
    return this.activityLogService;
  }

  /**
   * Creates an instance of NotificationService
   */
  public createNotificationService(): INotificationService {
    if (!this.notificationService) {
      this.notificationService = new NotificationService();
    }
    return this.notificationService as INotificationService;
  }

  /**
   * Creates an instance of RefreshTokenService
   */
  public createRefreshTokenService(): IRefreshTokenService {
    // Use the AuthService for refresh token operations
    return AuthService as unknown as IRefreshTokenService;
  }

  /**
   * Creates an instance of PluginService
   */
  public createPluginService(): IPluginService {
    // Client-side plugin service (if needed) would be implemented here
    // For now, throw an error as plugins are server-side only
    throw new Error('PluginService is not available on the client side');
  }

  /**
   * Creates an instance of PluginLicenseService
   */
  public createPluginLicenseService(): IPluginLicenseService {
    // Client-side plugin license service (if needed) would be implemented here
    // For now, throw an error as plugins are server-side only
    throw new Error('PluginLicenseService is not available on the client side');
  }

  /**
   * Creates an instance of PluginInstallationService
   */
  public createPluginInstallationService(): IPluginInstallationService {
    // Client-side plugin installation service (if needed) would be implemented here
    // For now, throw an error as plugins are server-side only
    throw new Error('PluginInstallationService is not available on the client side');
  }

  /**
   * Creates an instance of PermissionService
   */
  public createPermissionService(): IPermissionService {
    if (!this.permissionService) {
      // Client-side PermissionService has no constructor parameters
      this.permissionService = new PermissionService();
    }
    return this.permissionService;
  }

  /**
   * Creates an instance of RequestDataService
   */
  public createRequestDataService(): IRequestDataService {
    if (!this.requestDataService) {
      this.requestDataService = new RequestDataService();
    }
    return this.requestDataService;
  }


  /**
   * Creates an instance of AutomationService
   * Note: This is a client-side placeholder. 
   * Server-side implementation should import the actual AutomationService
   */
  public createAutomationService(): IAutomationService {
    if (!this.automationService) {
      // For client-side, we could create a minimal implementation or throw an error
      // indicating that automation service should be used server-side only
      throw new Error('AutomationService is only available server-side. Use AutomationClient instead.');
    }
    return this.automationService;
  }

  /**
   * Creates a security configuration
   */
  public createSecurityConfig(): SecurityConfig {
    return securityConfig;
  }
  
  /**
   * Resets all service instances
   * Used for testing and hot-reloading scenarios
   */
  public resetServices(): void {
    this.authService = undefined;
    this.userService = undefined;
    this.customerService = undefined;
    this.appointmentService = undefined;
    this.requestService = undefined;
    this.activityLogService = undefined;
    this.notificationService = undefined;
    this.permissionService = undefined;
    this.requestDataService = undefined;
    this.automationService = undefined;
  }
}

/**
 * Returns a singleton instance of the ServiceFactory
 */
export function getServiceFactory(): ServiceFactory {
  return ServiceFactory.getInstance();
}

// Export individual service factory functions
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

export function getRequestDataService(): IRequestDataService {
  return getServiceFactory().createRequestDataService();
}

export function getAutomationService(): IAutomationService {
  return getServiceFactory().createAutomationService();
}

export function getSecurityConfig(): SecurityConfig {
  return getServiceFactory().createSecurityConfig();
}
