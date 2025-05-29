import * as crypto from 'crypto';
import { IPluginLicenseRepository } from '@/domain/repositories/IPluginLicenseRepository';
import { PluginLicense } from '@/domain/entities/PluginLicense';
import { LicenseVerificationResult } from '@/domain/services/IPluginLicenseService';
import { VerifyLicenseDto } from '@/domain/dtos/PluginDtos';

interface CachedLicense {
  license: PluginLicense;
  cachedAt: Date;
  signature: string;
}

export class LicenseVerificationService {
  private cache: Map<string, CachedLicense> = new Map();
  private readonly cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours
  private readonly gracePeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly serverPublicKey: string;

  constructor(
    private licenseRepository: IPluginLicenseRepository,
    serverPublicKey: string
  ) {
    this.serverPublicKey = serverPublicKey;
  }

  async verifyLicense(
    data: VerifyLicenseDto
  ): Promise<LicenseVerificationResult> {
    try {
      // 1. Validate signature first
      if (!this.validateSignature(data)) {
        return {
          valid: false,
          error: 'Invalid signature'
        };
      }

      // 2. Try online verification
      const license = await this.licenseRepository.findByLicenseKey(data.licenseKey);
      
      if (!license) {
        return {
          valid: false,
          error: 'License not found'
        };
      }

      // 3. Validate license
      const validationResult = await this.validateLicense(license, data);
      if (!validationResult.valid) {
        return validationResult;
      }

      // 4. Update verification timestamp
      await this.licenseRepository.updateLastVerified(license.id!);

      // 5. Update cache
      this.cacheLicense(data.licenseKey, license, data.signature || '');

      return {
        valid: true,
        license: this.licenseToDto(license),
        offline: false
      };
    } catch (error) {
      // 6. Check offline grace period
      const cached = this.getCachedLicense(data.licenseKey);
      if (cached && this.withinGracePeriod(cached)) {
        // Validate that the signature matches what we have in cache
        if (cached.signature === data.signature || this.validateSignature(data)) {
          return {
            valid: true,
            license: this.licenseToDto(cached.license),
            offline: true
          };
        }
      }

      return {
        valid: false,
        error: 'License verification failed',
        offline: true
      };
    }
  }

  private async validateLicense(
    license: PluginLicense,
    data: VerifyLicenseDto
  ): Promise<LicenseVerificationResult> {
    // Check if license is active
    if (!license.isValid()) {
      return {
        valid: false,
        error: 'License is not active'
      };
    }

    // Check plugin ID
    if (license.pluginId !== data.pluginId) {
      return {
        valid: false,
        error: 'License is for a different plugin'
      };
    }

    // Check hardware binding
    if (license.hardwareId && license.hardwareId !== data.hardwareId) {
      return {
        valid: false,
        error: 'License is bound to different hardware'
      };
    }

    // Check installation limit
    if (!license.canInstall()) {
      return {
        valid: false,
        error: 'Installation limit exceeded'
      };
    }

    return { valid: true };
  }

  private validateSignature(data: VerifyLicenseDto): boolean {
    const message = `${data.licenseKey}:${data.hardwareId}:${data.pluginId}:${data.timestamp}`;
    
    try {
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(message);
      return verify.verify(this.serverPublicKey, data.signature || '', 'base64');
    } catch {
      return false;
    }
  }

  generateSignature(
    licenseKey: string,
    hardwareId: string,
    pluginId: number,
    privateKey: string
  ): string {
    const timestamp = Date.now();
    const message = `${licenseKey}:${hardwareId}:${pluginId}:${timestamp}`;
    
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    return sign.sign(privateKey, 'base64');
  }

  private getCachedLicense(licenseKey: string): CachedLicense | null {
    return this.cache.get(licenseKey) || null;
  }

  private cacheLicense(
    licenseKey: string,
    license: PluginLicense,
    signature: string
  ): void {
    this.cache.set(licenseKey, {
      license,
      cachedAt: new Date(),
      signature
    });
  }

  private isExpired(cached: CachedLicense): boolean {
    const age = Date.now() - cached.cachedAt.getTime();
    return age > this.cacheMaxAge;
  }

  private withinGracePeriod(cached: CachedLicense): boolean {
    const age = Date.now() - cached.cachedAt.getTime();
    return age <= this.gracePeriod;
  }

  private licenseToDto(license: PluginLicense): any {
    return {
      id: license.id,
      licenseKey: license.licenseKey,
      pluginId: license.pluginId,
      userId: license.userId,
      type: license.type,
      status: license.status,
      expiresAt: license.expiresAt,
      usageLimits: license.usageLimits,
      usageData: license.usageData
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearLicenseCache(licenseKey: string): void {
    this.cache.delete(licenseKey);
  }
}