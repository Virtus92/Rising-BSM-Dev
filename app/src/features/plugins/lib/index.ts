// Export plugin entities
export { Plugin } from '@/domain/entities/Plugin';
export { PluginLicense } from '@/domain/entities/PluginLicense';
export { PluginInstallation } from '@/domain/entities/PluginInstallation';

// Export plugin DTOs
export type {
  PluginDto,
  PluginLicenseDto,
  PluginInstallationDto,
  CreatePluginDto,
  UpdatePluginDto,
  VerifyLicenseDto,
  InstallPluginDto,
  PluginSearchDto
} from '@/domain/dtos/PluginDtos';

// Export plugin services
export { PluginService } from './services/PluginService';
export { PluginLicenseService } from './services/PluginLicenseService';
export { PluginInstallationService } from './services/PluginInstallationService';

// Export plugin repositories
export { PluginRepository } from './repositories/PluginRepository';
export { PluginLicenseRepository } from './repositories/PluginLicenseRepository';
export { PluginInstallationRepository } from './repositories/PluginInstallationRepository';

// Export security services
export { PluginEncryptionService } from './security/PluginEncryptionService';
export { LicenseVerificationService } from './security/LicenseVerificationService';

// Export core plugin infrastructure
export { PluginLoader } from './core/PluginLoader';
export { PluginRegistry } from './core/PluginRegistry';
export { PluginSandbox, type SandboxConfig } from './core/PluginSandbox';

// Export plugin types
export type {
  ILoadedPlugin,
  IPluginContext,
  PluginMetadata,
  PluginRequest,
  PluginResponse,
  PluginRouteHandler,
  PluginComponent,
  AutomationHook,
  PluginBundle,
  PluginExecutionResult
} from './core/types';

// Export plugin client
export { PluginClient } from './clients/PluginClient';