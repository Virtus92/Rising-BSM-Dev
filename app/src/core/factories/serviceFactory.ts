/**
 * Factory functions for service instances
 */
import { getLogger } from '@/core/logging';
import { getErrorHandler } from '@/core/errors';
import { getValidationService } from '@/core/validation';
import { configService } from '@/core/config/ConfigService';

// Repository factories
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
import { AuthService } from '@/features/auth/lib/services/AuthService';

// Import UserServiceAdapter dynamically to prevent circular dependencies
import { CustomerService } from '@/features/customers/lib/services/CustomerService';
import { AppointmentService } from '@/features/appointments/lib/services/AppointmentService';
import { RequestService } from '@/features/requests/lib/services/RequestService';
import { ActivityLogService } from '@/features/activity/lib/services/ActivityLogService';
import { NotificationService } from '@/features/notifications/lib/services/NotificationService';
import { N8NIntegrationService } from '@/features/requests/lib/n8n/N8NIntegrationService';
import { RefreshTokenService } from '@/features/auth/lib/services/RefreshTokenService';
import { PermissionService } from '@/features/permissions/lib/services/PermissionService';
import { RequestDataService } from '@/features/requests/lib/services/RequestDataService';

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
export class ServiceFactory {
  private static instance: ServiceFactory;

  // Singleton instances for services
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
    // Always use client-side auth service when running in the browser
    if (typeof window !== 'undefined') {
      try {
        // Dynamically import the client-side auth service
        const { AuthClientService } = require('@/features/auth/lib/clients/AuthClient');
        if (AuthClientService) {
          return AuthClientService;
        }
      } catch (error) {
        console.error('Failed to load client-side AuthService:', error);
      }
    }
    
    // For server-side, create a properly initialized AuthService
    if (!this.authService) {
      const jwtConfig = configService.getJwtConfig();
      
      // Create AuthService with all required dependencies
      this.authService = new AuthService(
        getUserRepository(),
        getRefreshTokenRepository(),
        getLogger(),
        getValidationService(),
        getErrorHandler(),
        {
          jwtSecret: jwtConfig?.secret,
          accessTokenExpiry: jwtConfig?.accessTokenExpiry,
          refreshTokenExpiry: jwtConfig?.refreshTokenExpiry,
          useTokenRotation: jwtConfig?.useTokenRotation
        }
      );
      
      // Verify the service has critical methods
      if (!this.authService.login) {
        console.error('AuthService initialization failed: login method is missing');
      }
    }
    
    return this.authService as IAuthService;
  }

  /**
   * Creates an instance of UserService
   */
  public createUserService(): IUserService {
    if (!this.userService) {
      try {
        // Choose implementation based on environment
        if (typeof window === 'undefined') {
          // Server-side: use repository-based implementation
          const { UserService } = require('@/features/users/lib/services/UserService.server');
          this.userService = new UserService();
          getLogger().debug('Server-side UserService initialized');
        } else {
          // Client-side: use API-based implementation
          const { UserServiceClient } = require('@/features/users/lib/services/UserService.client');
          this.userService = new UserServiceClient();
          console.debug('Client-side UserService initialized');
        }
      } catch (error) {
        // Detailed error logging for easier troubleshooting
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        getLogger().error('Error initializing UserService:', {
          message: errorMessage,
          stack: errorStack,
          isServer: typeof window === 'undefined'
        });
        
        // Create a fallback service with minimal implementation
        this.userService = {
          getById: async (id: number) => {
            getLogger().debug(`Fallback UserService.getById called with ID: ${id}`);
            try {
              if (typeof window === 'undefined') {
                // Server-side fallback using repository directly
                const userRepository = getUserRepository();
                const user = await userRepository.findById(id);
                if (!user) return null;
                
                return {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  status: user.status,
                  phone: user.phone,
                  profilePicture: user.profilePicture,
                  createdAt: user.createdAt,
                  updatedAt: user.updatedAt,
                  lastLoginAt: user.lastLoginAt
                };
              } else {
                // Client-side fallback using static UserService
                const { UserService } = require('@/features/users/lib/services/UserService');
                const response = await UserService.getUserById(id);
                return response.success && response.data ? response.data : null;
              }
            } catch (err) {
              getLogger().error(`Error in fallback getUserById(${id}):`, err instanceof Error ? err.message : String(err));
              return null;
            }
          }
        } as any;
      }
    }
    return this.userService as IUserService;
  }

  /**
   * Creates an instance of CustomerService
   */
  public createCustomerService(): ICustomerService {
    if (!this.customerService) {
      // Dynamic import to prevent bundling issues and allow for proper module resolution
      try {
        // Try to use the features implementation
        const importModule = async () => {
          try {
            const customerServiceModule = await import('@/features/customers/lib/services/CustomerService');
            const CustomerService = customerServiceModule.CustomerService;
            return new CustomerService();
          } catch (error) {
            // Fall back to infrastructure implementation
            const { CustomerService } = await import('@/features/customers/lib/services/CustomerService');
            return new CustomerService();
          }
        };
        
        // Execute the import but handle as a Promise
        importModule().then(service => {
          this.customerService = service;
        }).catch(error => {
          getLogger().error('Error creating CustomerService:', error instanceof Error ? error.message : String(error));
        });
        
        // Create a temporary service while the import completes
        this.customerService = {
          // Implement minimal interface for temporary use
          getAll: async () => ({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
          getById: async () => null,
          create: async () => { throw new Error('CustomerService not yet initialized'); },
          update: async () => { throw new Error('CustomerService not yet initialized'); },
          delete: async () => false
        } as any;
      } catch (error) {
        getLogger().error('Error in createCustomerService:', error instanceof Error ? error.message : String(error));
        // Create empty service to prevent crashes
        this.customerService = {} as any;
      }
    }
    return this.customerService as ICustomerService;
  }

  /**
   * Creates an instance of AppointmentService
   */
  public createAppointmentService(): IAppointmentService {
    if (!this.appointmentService) {
      // Try to use the features implementation first
      try {
        // Dynamic import to prevent bundling issues
        const importModule = async () => {
          try {
            const { AppointmentService } = await import('@/features/appointments/lib/services/AppointmentService');
            return new AppointmentService();
          } catch (error) {
            // Fall back to infrastructure implementation
            const { AppointmentService } = await import('@/features/appointments/lib/services/AppointmentService');
            return new AppointmentService();
          }
        };
        
        // Execute the import but continue with a temporary service
        importModule().then(service => {
          this.appointmentService = service;
        }).catch(error => {
          getLogger().error('Error creating AppointmentService:', error instanceof Error ? error.message : String(error));
        });
        
        // Create minimal temporary service
        this.appointmentService = {} as any;
      } catch (error) {
        getLogger().error('Error in createAppointmentService:', error instanceof Error ? error.message : String(error));
        // Create empty service to prevent crashes
        this.appointmentService = {} as any;
      }
    }
    return this.appointmentService as IAppointmentService;
  }

  /**
   * Creates an instance of RequestService
   */
  public createRequestService(): IRequestService {
    if (!this.requestService) {
      // Try to use the features implementation first
      try {
        // Dynamic import to prevent bundling issues
        const importModule = async () => {
          try {
            const { RequestService } = await import('@/features/requests/lib/services/RequestService');
            return new RequestService(
              getRequestRepository(),
              getCustomerRepository(),
              getUserRepository(),
              getAppointmentRepository(),
              getRequestDataRepository(),
              getLogger(),
              getValidationService(),
              getErrorHandler()
            );
          } catch (error) {
            // Fall back to infrastructure implementation
            const { RequestService } = await import('@/features/requests/lib/services/RequestService');
            return new RequestService(
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
        };
        
        // Execute the import but continue with a temporary service
        importModule().then(service => {
          this.requestService = service;
        }).catch(error => {
          getLogger().error('Error creating RequestService:', error instanceof Error ? error.message : String(error));
        });
        
        // Create minimal temporary service
        this.requestService = {} as any;
      } catch (error) {
        getLogger().error('Error in createRequestService:', error instanceof Error ? error.message : String(error));
        // Create empty service to prevent crashes
        this.requestService = {} as any;
      }
    }
    return this.requestService!;
  }

  /**
   * Creates a RequestDataService instance
   */
  public createRequestDataService(): IRequestDataService {
    if (!this.requestDataService) {
      // Try to use the features implementation first
      try {
        // Dynamic import to prevent bundling issues
        const importModule = async () => {
          try {
            const { RequestDataService } = await import('@/features/requests/lib/services/RequestDataService');
            return new RequestDataService(
              getRequestDataRepository(),
              getRequestRepository(),
              getLogger(),
              getValidationService(),
              getErrorHandler()
            );
          } catch (error) {
            // Fall back to infrastructure implementation
            const { RequestDataService } = await import('@/features/requests/lib/services/RequestDataService');
            return new RequestDataService(
              getRequestDataRepository(),
              getRequestRepository(),
              getLogger(),
              getValidationService(),
              getErrorHandler()
            );
          }
        };
        
        // Execute the import but continue with a temporary service
        importModule().then(service => {
          this.requestDataService = service;
        }).catch(error => {
          getLogger().error('Error creating RequestDataService:', error instanceof Error ? error.message : String(error));
        });
        
        // Create minimal temporary service
        this.requestDataService = {} as any;
      } catch (error) {
        getLogger().error('Error in createRequestDataService:', error instanceof Error ? error.message : String(error));
        // Create empty service to prevent crashes
        this.requestDataService = {} as any;
      }
    }
    return this.requestDataService!;
  }

  /**
   * Creates an N8NIntegrationService instance
   */
  public createN8NIntegrationService(): IN8NIntegrationService {
    if (!this.n8nIntegrationService) {
      // Try to use the features implementation first
      try {
        // Create service directly since we've already imported the class
        try {
        this.n8nIntegrationService = new N8NIntegrationService(
        getRequestRepository(),
        getRequestDataRepository(),
        getLogger(),
        getErrorHandler(),
        configService
        );
        } catch (error) {
        getLogger().error('Error creating N8NIntegrationService:', error instanceof Error ? error.message : String(error));
          // Create minimal temporary service only if the above initialization failed
        this.n8nIntegrationService = {} as any;
        }
      } catch (error) {
        getLogger().error('Error in createN8NIntegrationService:', error instanceof Error ? error.message : String(error));
        // Create empty service to prevent crashes
        this.n8nIntegrationService = {} as any;
      }
    }
    return this.n8nIntegrationService!;
  }

  /**
   * Creates an instance of ActivityLogService
   */
  public createActivityLogService(): IActivityLogService {
    if (!this.activityLogService) {
      // Try to use the features implementation first
      try {
        // Dynamic import to prevent bundling issues
        const importModule = async () => {
          try {
            const { ActivityLogService } = await import('@/features/activity/lib/services/ActivityLogService');
            return new ActivityLogService(
              getActivityLogRepository(),
              getLogger(),
              getValidationService(),
              getErrorHandler()
            );
          } catch (error) {
            // Fall back to infrastructure implementation
            const { ActivityLogService } = await import('@/features/activity/lib/services/ActivityLogService');
            return new ActivityLogService(
              getActivityLogRepository(),
              getLogger(),
              getValidationService(),
              getErrorHandler()
            );
          }
        };
        
        // Execute the import but continue with a temporary service
        importModule().then(service => {
          this.activityLogService = service;
        }).catch(error => {
          getLogger().error('Error creating ActivityLogService:', error instanceof Error ? error.message : String(error));
        });
        
        // Create minimal temporary service
        this.activityLogService = {} as any;
      } catch (error) {
        getLogger().error('Error in createActivityLogService:', error instanceof Error ? error.message : String(error));
        // Create empty service to prevent crashes
        this.activityLogService = {} as any;
      }
    }
    return this.activityLogService!;
  }

  /**
   * Creates an instance of NotificationService
   */
  public createNotificationService(): INotificationService {
    if (!this.notificationService) {
      // Try to use the features implementation first
      try {
        // Dynamic import to prevent bundling issues
        const importModule = async () => {
          try {
            const { NotificationService } = await import('@/features/notifications/lib/services/NotificationService');
            return new NotificationService(
              getNotificationRepository(),
              getLogger(),
              getValidationService(),
              getErrorHandler()
            );
          } catch (error) {
            // Fall back to infrastructure implementation
            const { NotificationService } = await import('@/features/notifications/lib/services/NotificationService');
            return new NotificationService(
              getNotificationRepository(),
              getLogger(),
              getValidationService(),
              getErrorHandler()
            );
          }
        };
        
        // Execute the import but continue with a temporary service
        importModule().then(service => {
          this.notificationService = service;
        }).catch(error => {
          getLogger().error('Error creating NotificationService:', error instanceof Error ? error.message : String(error));
        });
        
        // Create minimal temporary service
        this.notificationService = {} as any;
      } catch (error) {
        getLogger().error('Error in createNotificationService:', error instanceof Error ? error.message : String(error));
        // Create empty service to prevent crashes
        this.notificationService = {} as any;
      }
    }
    return this.notificationService!;
  }

  /**
   * Creates an instance of RefreshTokenService
   */
  public createRefreshTokenService(): IRefreshTokenService {
    if (!this.refreshTokenService) {
      // Try to use the features implementation first
      try {
        // Dynamic import to prevent bundling issues
        const importModule = async () => {
          try {
            const { RefreshTokenService } = await import('@/features/auth/lib/services/RefreshTokenService');
            return new RefreshTokenService(
              getRefreshTokenRepository(),
              getLogger(),
              getValidationService(),
              getErrorHandler()
            );
          } catch (error) {
            // Fall back to infrastructure implementation
            const { RefreshTokenService } = await import('@/features/auth/lib/services/RefreshTokenService');
            return new RefreshTokenService(
              getRefreshTokenRepository(),
              getLogger(),
              getValidationService(),
              getErrorHandler()
            );
          }
        };
        
        // Execute the import but continue with a temporary service
        importModule().then(service => {
          this.refreshTokenService = service;
        }).catch(error => {
          getLogger().error('Error creating RefreshTokenService:', error instanceof Error ? error.message : String(error));
        });
        
        // Create minimal temporary service
        this.refreshTokenService = {} as any;
      } catch (error) {
        getLogger().error('Error in createRefreshTokenService:', error instanceof Error ? error.message : String(error));
        // Create empty service to prevent crashes
        this.refreshTokenService = {} as any;
      }
    }
    return this.refreshTokenService!;
  }

  /**
   * Creates a Permission Service instance
   */
  public createPermissionService(): IPermissionService {
    if (!this.permissionService) {
      // Try to use the features implementation first
      try {
        // Dynamic import to prevent bundling issues
        const importModule = async () => {
          try {
            const { PermissionService } = await import('@/features/permissions/lib/services/PermissionService');
            return new PermissionService(
              getPermissionRepository(),
              getLogger(),
              getValidationService(),
              getErrorHandler()
            );
          } catch (error) {
            // Fall back to infrastructure implementation
            const { PermissionService } = await import('@/features/permissions/lib/services/PermissionService');
            return new PermissionService(
              getPermissionRepository(),
              getLogger(),
              getValidationService(),
              getErrorHandler()
            );
          }
        };
        
        // Execute the import but continue with a temporary service
        importModule().then(service => {
          this.permissionService = service;
        }).catch(error => {
          getLogger().error('Error creating PermissionService:', error instanceof Error ? error.message : String(error));
        });
        
        // Create minimal temporary service
        this.permissionService = {} as any;
      } catch (error) {
        getLogger().error('Error in createPermissionService:', error instanceof Error ? error.message : String(error));
        // Create empty service to prevent crashes
        this.permissionService = {} as any;
      }
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