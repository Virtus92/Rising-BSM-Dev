import { IBaseService } from './IBaseService';
import { PluginLicense } from '../entities/PluginLicense';
import { PluginLicenseDto, VerifyLicenseDto } from '../dtos/PluginDtos';

export interface LicenseVerificationResult {
  valid: boolean;
  license?: PluginLicenseDto;
  offline?: boolean;
  error?: string;
}

export interface IPluginLicenseService extends IBaseService<PluginLicense, Partial<PluginLicense>, Partial<PluginLicense>, PluginLicenseDto> {
  generateLicense(
    pluginId: number, 
    userId: number, 
    type: 'trial' | 'basic' | 'premium' | 'enterprise',
    options?: {
      hardwareId?: string;
      maxInstalls?: number;
      expiresAt?: Date;
      usageLimits?: Record<string, any>;
    }
  ): Promise<PluginLicenseDto>;
  
  verifyLicense(data: VerifyLicenseDto): Promise<LicenseVerificationResult>;
  getLicenseByKey(licenseKey: string): Promise<PluginLicenseDto | null>;
  getUserLicenses(userId: number): Promise<PluginLicenseDto[]>;
  getPluginLicenses(pluginId: number): Promise<PluginLicenseDto[]>;
  getActiveLicenses(userId: number): Promise<PluginLicenseDto[]>;
  getExpiringLicenses(daysBeforeExpiry: number): Promise<PluginLicenseDto[]>;
  
  updateUsage(licenseId: number, metric: string, value: number): Promise<void>;
  resetUsage(licenseId: number): Promise<void>;
  checkUsageLimit(licenseId: number, metric: string): Promise<boolean>;
  
  renewLicense(licenseId: number, extensionDays: number): Promise<PluginLicenseDto>;
  upgradeLicense(licenseId: number, newType: 'basic' | 'premium' | 'enterprise'): Promise<PluginLicenseDto>;
  revokeLicense(licenseId: number, reason?: string): Promise<void>;
  suspendLicense(licenseId: number, reason?: string): Promise<void>;
  reactivateLicense(licenseId: number): Promise<void>;
  
  bindToHardware(licenseId: number, hardwareId: string): Promise<void>;
  transferLicense(licenseId: number, newUserId: number): Promise<void>;
}