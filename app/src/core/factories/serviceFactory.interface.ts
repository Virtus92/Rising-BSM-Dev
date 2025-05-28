/**
 * Service Factory Interface
 * This is a client-safe interface that can be used to reference service factories
 * without directly importing server-only code.
 */

// Re-export all service interfaces for convenience
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

/**
 * Interface for the ServiceFactory class
 * This allows references to the factory without importing server-only code
 */
import { SecurityConfig } from '@/core/config/SecurityConfig';

export interface IServiceFactory {
  createAuthService(): IAuthService;
  createUserService(): IUserService;
  createCustomerService(): ICustomerService;
  createAppointmentService(): IAppointmentService;
  createRequestService(): IRequestService;
  createActivityLogService(): IActivityLogService;
  createNotificationService(): INotificationService;
  createRefreshTokenService(): IRefreshTokenService;
  createPermissionService(): IPermissionService;
  createRequestDataService(): IRequestDataService;

  createAutomationService(): IAutomationService;
  createPluginService(): IPluginService;
  createPluginLicenseService(): IPluginLicenseService;
  createPluginInstallationService(): IPluginInstallationService;
  createSecurityConfig(): SecurityConfig;
  resetServices(): void;
}

/**
 * Re-export all service interfaces
 */
export type {
  IAuthService,
  IUserService,
  ICustomerService,
  IAppointmentService,
  IRequestService,
  IActivityLogService,
  INotificationService,
  IRefreshTokenService,
  IPermissionService,
  IRequestDataService,

  IAutomationService,
  IPluginService,
  IPluginLicenseService,
  IPluginInstallationService
};