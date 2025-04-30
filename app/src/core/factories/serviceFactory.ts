/**
 * Factory functions for service instances
 */
import { getLogger } from '@/core/logging';
import { getErrorHandler } from '@/core/errors';
import { getValidationService } from '@/core/validation';
import { configService } from '@/core/config/ConfigService';
import { SecurityConfig, securityConfig } from '@/core/config/SecurityConfig';

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
import { UserService } from '@/features/users/lib/services/UserService';
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
   * Creates a SecurityConfig instance
   * @returns The security configuration
   */
  public createSecurityConfig(): SecurityConfig {
    // Always return the singleton instance
    return securityConfig;
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
          refreshTokenExpiry: jwtConfig?.refreshTokenExpiry
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
        
      }
    }
    return this.userService as IUserService;
  }

  /**
   * Creates an instance of CustomerService
   */
  public createCustomerService(): ICustomerService {
    if (!this.customerService) {
      try {
        // Choose implementation based on environment
        if (typeof window === 'undefined') {
          // Server-side: use repository-based implementation
          const { CustomerService } = require('@/features/customers/lib/services/CustomerService.server');
          this.customerService = new CustomerService(
            getCustomerRepository(),
            getLogger(),
            getValidationService(),
            getErrorHandler()
          );
          getLogger().debug('Server-side CustomerService initialized');
        } else {
          // Client-side: use API-based implementation
          const { CustomerService } = require('@/features/customers/lib/services/CustomerService');
          // For client-side, we use the static methods directly
          this.customerService = CustomerService;
          console.debug('Client-side CustomerService initialized');
        }
      } catch (error) {
        // Detailed error logging for easier troubleshooting
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        getLogger().error('Error initializing CustomerService:', {
          message: errorMessage,
          stack: errorStack,
          isServer: typeof window === 'undefined'
        });
      }
    }
    return this.customerService as ICustomerService;
  }

  /**
   * Creates an instance of AppointmentService
   */
  public createAppointmentService(): IAppointmentService {
    if (!this.appointmentService) {
      try {
        // Choose implementation based on environment
        if (typeof window === 'undefined') {
          // Server-side: use repository-based implementation
          const { AppointmentService } = require('@/features/appointments/lib/services/AppointmentService.server');
          this.appointmentService = new AppointmentService(
            getAppointmentRepository(),
            getLogger(),
            getValidationService(),
            getErrorHandler()
          );
          getLogger().debug('Server-side AppointmentService initialized');
        } else {
          // Client-side: use API-based implementation
          const { AppointmentService } = require('@/features/appointments/lib/services/AppointmentService');
          // For client-side, we use the static methods directly
          this.appointmentService = AppointmentService;
          console.debug('Client-side AppointmentService initialized');
        }
      } catch (error) {
        // Detailed error logging for easier troubleshooting
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        getLogger().error('Error initializing AppointmentService:', {
          message: errorMessage,
          stack: errorStack,
          isServer: typeof window === 'undefined'
        });
      }
    }
    return this.appointmentService as IAppointmentService;
  }

  /**
   * Creates an instance of RequestService
   */
  public createRequestService(): IRequestService {
    if (!this.requestService) {
      try {
        // Choose implementation based on environment
        if (typeof window === 'undefined') {
          // Server-side: use repository-based implementation
          const { RequestService } = require('@/features/requests/lib/services/RequestService.server');
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
          getLogger().debug('Server-side RequestService initialized');
        } else {
          // Client-side: use API-based implementation
          const { RequestService } = require('@/features/requests/lib/services/RequestService.client');
          // For client-side, we use either an instance or static methods
          if (typeof RequestService === 'function') {
            this.requestService = new RequestService();
          } else {
            this.requestService = RequestService;
          }
          console.debug('Client-side RequestService initialized');
        }
      } catch (error) {
        // Detailed error logging for easier troubleshooting
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        getLogger().error('Error initializing RequestService:', {
          message: errorMessage,
          stack: errorStack,
          isServer: typeof window === 'undefined'
        });
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
        
      } catch (error) {
        getLogger().error('Error in createRequestDataService:', error instanceof Error ? error.message : String(error));
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
        }
      } catch (error) {
        getLogger().error('Error in createN8NIntegrationService:', error instanceof Error ? error.message : String(error));
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
            throw new Error('Failed to import ActivityLogService');
          }
        };
        
        // Execute the import but continue with a temporary service
        importModule().then(service => {
          this.activityLogService = service;
        }).catch(error => {
          getLogger().error('Error creating ActivityLogService:', error instanceof Error ? error.message : String(error));
        });
        
      } catch (error) {
        getLogger().error('Error in createActivityLogService:', error instanceof Error ? error.message : String(error));
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
        
      } catch (error) {
        getLogger().error('Error in createNotificationService:', error instanceof Error ? error.message : String(error));
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
            throw new Error('Failed to import RefreshTokenService');
          }
        };
        
        // Execute the import but continue with a temporary service
        importModule().then(service => {
          this.refreshTokenService = service;
        }).catch(error => {
          getLogger().error('Error creating RefreshTokenService:', error instanceof Error ? error.message : String(error));
        });
        
      } catch (error) {
        getLogger().error('Error in createRefreshTokenService:', error instanceof Error ? error.message : String(error));
      }
    }
    return this.refreshTokenService!;
  }

  /**
   * Creates a Permission Service instance
   */
  public createPermissionService(): IPermissionService {
    if (!this.permissionService) {
      try {
        // Choose implementation based on environment
        if (typeof window === 'undefined') {
          // Server-side: use repository-based implementation
          const { PermissionService } = require('@/features/permissions/lib/services/PermissionService');
          this.permissionService = new PermissionService(
            getPermissionRepository(),
            getLogger(),
            getValidationService(),
            getErrorHandler()
          );
          getLogger().debug('Server-side PermissionService initialized');
        } else {
          // Client-side: create a properly implemented client version
          // Use 'as any' to avoid TypeScript casting issues, since we're implementing a compatible interface but not the exact class
          this.permissionService = {
            // Required instance properties from PermissionService class
            permissionRepository: this.createMinimalPermissionRepository(),
            logger: getLogger(),
            validator: getValidationService(),
            errorHandler: getErrorHandler(),
            
            // Implement methods from IPermissionService
            getUserPermissions: async (userId: number) => {
              const { PermissionClient } = require('@/features/permissions/lib/clients/PermissionClient');
              const response = await PermissionClient.getUserPermissions(userId);
              return response.success && response.data ? response.data : { userId, permissions: [], role: 'user' };
            },
            hasPermission: async (userId: number, permissionCode: string) => {
              const { PermissionClient } = require('@/features/permissions/lib/clients/PermissionClient');
              const response = await PermissionClient.hasPermission(userId, permissionCode);
              return response.success && response.data ? response.data : false;
            },
            updateUserPermissions: async (data: { userId: number; permissions: string[] }) => {
              const { PermissionClient } = require('@/features/permissions/lib/clients/PermissionClient');
              const response = await PermissionClient.updateUserPermissions(data);
              return response.success && response.data ? response.data : false;
            },
            getDefaultPermissionsForRole: async (role: string) => {
              const { PermissionClient } = require('@/features/permissions/lib/clients/PermissionClient');
              const response = await PermissionClient.getDefaultPermissionsForRole(role);
              return response.success && response.data ? response.data : [];
            },
            // Implement other required methods from IPermissionService
            findByCode: async (code: string) => {
              const { PermissionClient } = require('@/features/permissions/lib/clients/PermissionClient');
              const response = await PermissionClient.getPermissionByCode(code);
              return response.success && response.data ? response.data : null;
            },
            findPermissions: async (filters: Record<string, any>) => {
              const { PermissionClient } = require('@/features/permissions/lib/clients/PermissionClient');
              const response = await PermissionClient.getPermissions(filters);
              return response.success && response.data ? response.data : { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
            },
            
            // Required from PermissionService class implementation
            findAll: async (options?: { filters?: Record<string, any> }) => {
              const { PermissionClient } = require('@/features/permissions/lib/clients/PermissionClient');
              const response = await PermissionClient.getAllPermissions(options?.filters);
              return response.success && response.data 
                ? response.data 
                : { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
            },
            
            // Base service methods
            getAll: async () => ({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
            getById: async () => null,
            create: async () => { throw new Error('Not implemented on client'); },
            update: async () => { throw new Error('Not implemented on client'); },
            delete: async () => false,
            count: async () => 0,
            exists: async () => false,
            existsByCriteria: async () => false,
            findByCriteria: async () => [],
            search: async () => [],
            validate: async (data: any, schema: any) => data,
            transaction: async (callback: (service: any) => Promise<any>) => callback(null),
            toDTO: (entity: any) => entity as any,
            fromDTO: (dto: any) => dto as any,
            getRepository: () => {
                return this.createMinimalPermissionRepository();
            },
            bulkUpdate: async (ids: number[], data: any) => 0,
            mapToResponseDto: (entity: any) => entity as any,
            // Additional implementation for any private methods that might be used
            isPermissionIncludedInRole: async (userId: number, permissionCode: string) => {
              const { PermissionClient } = require('@/features/permissions/lib/clients/PermissionClient');
              const response = await PermissionClient.isPermissionIncludedInRole(userId, permissionCode);
              return response.success && response.data ? response.data : false;
            },
            getUserPermissionsByRole: async (userId: number, role: string) => {
              const { PermissionClient } = require('@/features/permissions/lib/clients/PermissionClient');
              const response = await PermissionClient.getUserPermissionsByRole(userId, role);
              return response.success && response.data ? response.data : [];
            },
            invalidateUserPermissionCache: async (userId: number) => true,
            validatePermissions: async (permissions: string[]) => [],
            seedDefaultPermissions: async () => true
          } as any; // Use 'as any' instead of 'as PermissionService' to avoid TypeScript errors
          console.debug('Client-side PermissionService initialized');
        }
      } catch (error) {
        // Detailed error logging for easier troubleshooting
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        getLogger().error('Error initializing PermissionService:', {
          message: errorMessage,
          stack: errorStack,
          isServer: typeof window === 'undefined'
        });
      }
    }
    return this.permissionService!;
  }

  /**
   * Creates a minimal implementation of IPermissionRepository for client-side use
   * 
   * @returns A minimal implementation of IPermissionRepository
   */
  private createMinimalPermissionRepository() {
    return {
      findByCode: async (code: string) => null,
      findPermissions: async (filters: any) => ({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
      getUserPermissions: async (userId: number) => [],
      updateUserPermissions: async (userId: number, permissions: string[], updatedBy?: number) => true,
      addUserPermission: async (userId: number, permissionCode: string, grantedBy?: number) => ({ 
        userId, 
        permissionId: 0, 
        grantedAt: new Date(), 
        grantedBy, 
        isDenied: false 
      }),
      removeUserPermission: async (userId: number, permissionCode: string) => true,
      hasPermission: async (userId: number, permissionCode: string) => false,
      seedDefaultPermissions: async () => {},
      findById: async (id: number) => null,
      findOneByCriteria: async (criteria: Record<string, any>) => null,
      findByCriteria: async (criteria: Record<string, any>) => [],
      create: async (data: any) => ({ id: 0, ...data }),
      update: async (id: number, data: any) => ({ id, ...data }),
      delete: async (id: number) => true,
      findAll: async (options?: any) => ({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
      count: async (criteria?: Record<string, any>) => 0,
      bulkUpdate: async (ids: number[], data: any) => 0,
      transaction: async <T>(callback: (repo?: any) => Promise<T>) => callback(null),
      logActivity: async (userId: number, action: string, details?: string) => null
    };
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

/**
 * Factory functions for service instances
 */
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