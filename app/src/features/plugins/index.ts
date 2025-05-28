// Export all plugin-related functionality

// Re-export from lib
export * from './lib';

// Export plugin API types if needed
export type { 
  LicenseVerificationResult 
} from '@/domain/services/IPluginLicenseService';

export type {
  InstallationResult
} from '@/domain/services/IPluginInstallationService';