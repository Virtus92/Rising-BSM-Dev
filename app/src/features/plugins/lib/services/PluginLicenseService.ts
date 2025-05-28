import { IPluginLicenseService, LicenseVerificationResult } from '@/domain/services/IPluginLicenseService';
import { IPluginLicenseRepository } from '@/domain/repositories/IPluginLicenseRepository';
import { IPluginRepository } from '@/domain/repositories/IPluginRepository';
import { PluginLicense } from '@/domain/entities/PluginLicense';
import { PluginLicenseDto, VerifyLicenseDto, pluginLicenseToDto } from '@/domain/dtos/PluginDtos';
import { AppError } from '@/core/errors';
import { PluginEncryptionService } from '../security/PluginEncryptionService';
import { LicenseVerificationService } from '../security/LicenseVerificationService';

export class PluginLicenseService implements IPluginLicenseService {
  private verificationService: LicenseVerificationService;

  constructor(
    private repository: IPluginLicenseRepository,
    private pluginRepository: IPluginRepository,
    private encryptionService: PluginEncryptionService,
    serverPublicKey: string
  ) {
    this.verificationService = new LicenseVerificationService(repository, serverPublicKey);
  }

  async getById(id: number): Promise<PluginLicenseDto | null> {
    const license = await this.repository.findById(id);
    return license ? pluginLicenseToDto(license) : null;
  }

  async getAll(): Promise<PluginLicenseDto[]> {
    const result = await this.repository.findAll();
    return result.data.map(l => pluginLicenseToDto(l));
  }

  async create(license: PluginLicense): Promise<PluginLicense> {
    return this.repository.create(license);
  }

  async update(id: number, data: Partial<PluginLicense>): Promise<PluginLicense> {
    return this.repository.update(id, data);
  }

  async delete(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }

  async generateLicense(
    pluginId: number,
    userId: number,
    type: 'trial' | 'basic' | 'premium' | 'enterprise',
    options?: {
      hardwareId?: string;
      maxInstalls?: number;
      expiresAt?: Date;
      usageLimits?: Record<string, any>;
    }
  ): Promise<PluginLicenseDto> {
    // Verify plugin exists and is approved
    const plugin = await this.pluginRepository.findById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }
    if (plugin.status !== 'approved') {
      throw new AppError('Plugin is not approved for licensing', 400);
    }

    // Check for existing active license
    const existingLicense = await this.repository.findByUserAndPlugin(userId, pluginId);
    if (existingLicense && existingLicense.isValid()) {
      throw new AppError('User already has an active license for this plugin', 400);
    }

    // Generate license key
    const licenseKey = this.encryptionService.generateLicenseKey();

    // Set default limits based on type
    const usageLimits = options?.usageLimits || this.getDefaultLimits(type);
    const maxInstalls = options?.maxInstalls || this.getDefaultMaxInstalls(type);
    const expiresAt = options?.expiresAt || this.getDefaultExpiration(type);

    // Create license
    const license = new PluginLicense({
      licenseKey,
      pluginId,
      userId,
      type,
      status: 'active',
      hardwareId: options?.hardwareId,
      maxInstalls,
      currentInstalls: 0,
      issuedAt: new Date(),
      expiresAt,
      usageLimits,
      usageData: {
        apiCalls: 0,
        storage: 0,
        lastReset: new Date()
      }
    });

    const created = await this.repository.create(license);
    return pluginLicenseToDto(created);
  }

  async verifyLicense(data: VerifyLicenseDto): Promise<LicenseVerificationResult> {
    return this.verificationService.verifyLicense(data);
  }

  async getLicenseByKey(licenseKey: string): Promise<PluginLicenseDto | null> {
    const license = await this.repository.findByLicenseKey(licenseKey);
    return license ? pluginLicenseToDto(license) : null;
  }

  async getUserLicenses(userId: number): Promise<PluginLicenseDto[]> {
    const licenses = await this.repository.findByUser(userId);
    return licenses.map(l => pluginLicenseToDto(l));
  }

  async getPluginLicenses(pluginId: number): Promise<PluginLicenseDto[]> {
    const licenses = await this.repository.findByPlugin(pluginId);
    return licenses.map(l => pluginLicenseToDto(l));
  }

  async getActiveLicenses(userId: number): Promise<PluginLicenseDto[]> {
    const licenses = await this.repository.findActiveByUser(userId);
    return licenses.map(l => pluginLicenseToDto(l));
  }

  async getExpiringLicenses(daysBeforeExpiry: number): Promise<PluginLicenseDto[]> {
    const licenses = await this.repository.findExpiring(daysBeforeExpiry);
    return licenses.map(l => pluginLicenseToDto(l));
  }

  async updateUsage(licenseId: number, metric: string, value: number): Promise<void> {
    const license = await this.repository.findById(licenseId);
    if (!license) {
      throw new AppError('License not found', 404);
    }
    
    const currentUsage = license.usageData[metric] || 0;
    const newUsage = { [metric]: currentUsage + value };
    
    await this.repository.updateUsage(licenseId, newUsage);
  }

  async resetUsage(licenseId: number): Promise<void> {
    const license = await this.repository.findById(licenseId);
    if (!license) {
      throw new AppError('License not found', 404);
    }
    
    const resetUsage = {
      apiCalls: 0,
      storage: license.usageData.storage || 0, // Storage doesn't reset
      lastReset: new Date()
    };
    
    await this.repository.updateUsage(licenseId, resetUsage);
  }

  async checkUsageLimit(licenseId: number, metric: string): Promise<boolean> {
    const license = await this.repository.findById(licenseId);
    if (!license) {
      throw new AppError('License not found', 404);
    }
    return license.isWithinUsageLimit(metric as keyof typeof license.usageLimits);
  }

  async renewLicense(licenseId: number, extensionDays: number): Promise<PluginLicenseDto> {
    const license = await this.repository.findById(licenseId);
    if (!license) {
      throw new AppError('License not found', 404);
    }
    
    if (license.status !== 'active' && license.status !== 'expired') {
      throw new AppError('Can only renew active or expired licenses', 400);
    }

    const currentExpiry = license.expiresAt || new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + extensionDays);

    const updated = await this.repository.update(licenseId, {
      expiresAt: newExpiry,
      status: 'active'
    });

    return pluginLicenseToDto(updated);
  }

  async upgradeLicense(licenseId: number, newType: 'basic' | 'premium' | 'enterprise'): Promise<PluginLicenseDto> {
    const license = await this.repository.findById(licenseId);
    if (!license) {
      throw new AppError('License not found', 404);
    }
    
    if (license.type === 'enterprise') {
      throw new AppError('Cannot upgrade from enterprise license', 400);
    }

    const typeOrder = { trial: 0, basic: 1, premium: 2, enterprise: 3 };
    if (typeOrder[newType] <= typeOrder[license.type]) {
      throw new AppError('Can only upgrade to a higher tier', 400);
    }

    const updated = await this.repository.update(licenseId, {
      type: newType,
      usageLimits: this.getDefaultLimits(newType),
      maxInstalls: this.getDefaultMaxInstalls(newType)
    });

    return pluginLicenseToDto(updated);
  }

  async revokeLicense(licenseId: number, reason?: string): Promise<void> {
    await this.repository.revoke(licenseId, reason);
    
    // Clear verification cache
    const license = await this.repository.findById(licenseId);
    if (license) {
      this.verificationService.clearLicenseCache(license.licenseKey);
    }
  }

  async suspendLicense(licenseId: number, reason?: string): Promise<void> {
    await this.repository.update(licenseId, {
      status: 'suspended',
      usageData: {
        suspendedAt: new Date(),
        suspendedReason: reason
      }
    });
    
    // Clear verification cache
    const license = await this.repository.findById(licenseId);
    if (license) {
      this.verificationService.clearLicenseCache(license.licenseKey);
    }
  }

  async reactivateLicense(licenseId: number): Promise<void> {
    const license = await this.repository.findById(licenseId);
    if (!license) {
      throw new AppError('License not found', 404);
    }
    
    if (license.status !== 'suspended') {
      throw new AppError('Can only reactivate suspended licenses', 400);
    }

    await this.repository.update(licenseId, { status: 'active' });
  }

  async bindToHardware(licenseId: number, hardwareId: string): Promise<void> {
    const license = await this.repository.findById(licenseId);
    if (!license) {
      throw new AppError('License not found', 404);
    }
    
    if (license.hardwareId) {
      throw new AppError('License is already bound to hardware', 400);
    }

    await this.repository.update(licenseId, { hardwareId });
  }

  async transferLicense(licenseId: number, newUserId: number): Promise<void> {
    const license = await this.repository.findById(licenseId);
    if (!license) {
      throw new AppError('License not found', 404);
    }
    
    if (license.type === 'enterprise') {
      throw new AppError('Enterprise licenses cannot be transferred', 400);
    }

    // Reset hardware binding on transfer
    await this.repository.update(licenseId, {
      userId: newUserId,
      hardwareId: undefined,
      currentInstalls: 0
    });
  }

  private getDefaultLimits(type: string): Record<string, any> {
    switch (type) {
      case 'trial':
        return { apiCalls: 1000, storage: 10, features: ['basic'] };
      case 'basic':
        return { apiCalls: 10000, storage: 100, features: ['basic', 'advanced'] };
      case 'premium':
        return { apiCalls: 100000, storage: 1000, features: ['basic', 'advanced', 'premium'] };
      case 'enterprise':
        return { apiCalls: -1, storage: -1, features: ['all'] }; // -1 means unlimited
      default:
        return { apiCalls: 1000, storage: 10, features: ['basic'] };
    }
  }

  private getDefaultMaxInstalls(type: string): number {
    switch (type) {
      case 'trial': return 1;
      case 'basic': return 3;
      case 'premium': return 10;
      case 'enterprise': return -1; // unlimited
      default: return 1;
    }
  }

  private getDefaultExpiration(type: string): Date | undefined {
    if (type === 'trial') {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30); // 30 days trial
      return expiry;
    }
    return undefined; // No expiration for paid licenses by default
  }
}