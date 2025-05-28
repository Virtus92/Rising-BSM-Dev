import { LicenseVerificationService } from '../security/LicenseVerificationService';
import { IPluginLicenseRepository } from '@/domain/repositories/IPluginLicenseRepository';
import { PluginLicense } from '@/domain/entities/PluginLicense';
import { VerifyLicenseDto } from '@/domain/dtos/PluginDtos';
import * as crypto from 'crypto';

describe('LicenseVerificationService', () => {
  let service: LicenseVerificationService;
  let mockRepository: jest.Mocked<IPluginLicenseRepository>;
  let serverKeys: { publicKey: string; privateKey: string };

  beforeEach(() => {
    // Generate test keys
    serverKeys = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    // Create mock repository
    mockRepository = {
      findByLicenseKey: jest.fn(),
      updateLastVerified: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUser: jest.fn(),
      findByPlugin: jest.fn(),
      findByUserAndPlugin: jest.fn(),
      findActiveByUser: jest.fn(),
      findExpiring: jest.fn(),
      updateUsage: jest.fn(),
      incrementInstalls: jest.fn(),
      decrementInstalls: jest.fn(),
      revoke: jest.fn()
    } as any;

    service = new LicenseVerificationService(mockRepository, serverKeys.publicKey);
  });

  const createValidLicense = (): PluginLicense => {
    return new PluginLicense({
      id: 1,
      licenseKey: 'VALID-LICENSE-KEY',
      pluginId: 100,
      userId: 1,
      type: 'basic',
      status: 'active',
      maxInstalls: 3,
      currentInstalls: 1,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      usageLimits: { apiCalls: 10000 },
      usageData: { apiCalls: 100 }
    });
  };

  const generateValidSignature = (data: VerifyLicenseDto): string => {
    const message = `${data.licenseKey}:${data.hardwareId}:${data.pluginId}:${data.timestamp}`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    return sign.sign(serverKeys.privateKey, 'base64');
  };

  describe('verifyLicense', () => {
    it('should verify valid license successfully', async () => {
      const license = createValidLicense();
      const verifyData: VerifyLicenseDto = {
        licenseKey: 'VALID-LICENSE-KEY',
        hardwareId: 'hardware123',
        pluginId: 100,
        timestamp: Date.now(),
        signature: ''
      };
      verifyData.signature = generateValidSignature(verifyData);

      mockRepository.findByLicenseKey.mockResolvedValue(license);

      const result = await service.verifyLicense(verifyData);

      expect(result.valid).toBe(true);
      expect(result.license).toBeDefined();
      expect(result.offline).toBe(false);
      expect(mockRepository.updateLastVerified).toHaveBeenCalledWith(1);
    });

    it('should reject license not found', async () => {
      const verifyData: VerifyLicenseDto = {
        licenseKey: 'INVALID-KEY',
        hardwareId: 'hardware123',
        pluginId: 100,
        timestamp: Date.now(),
        signature: ''
      };
      verifyData.signature = generateValidSignature(verifyData);

      mockRepository.findByLicenseKey.mockResolvedValue(null);

      const result = await service.verifyLicense(verifyData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('License not found');
    });

    it('should reject expired license', async () => {
      const license = createValidLicense();
      license.expiresAt = new Date(Date.now() - 1000); // Expired
      
      const verifyData: VerifyLicenseDto = {
        licenseKey: 'VALID-LICENSE-KEY',
        hardwareId: 'hardware123',
        pluginId: 100,
        timestamp: Date.now(),
        signature: ''
      };
      verifyData.signature = generateValidSignature(verifyData);

      mockRepository.findByLicenseKey.mockResolvedValue(license);

      const result = await service.verifyLicense(verifyData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('License is not active');
    });

    it('should reject license for wrong plugin', async () => {
      const license = createValidLicense();
      
      const verifyData: VerifyLicenseDto = {
        licenseKey: 'VALID-LICENSE-KEY',
        hardwareId: 'hardware123',
        pluginId: 999, // Wrong plugin ID
        timestamp: Date.now(),
        signature: ''
      };
      verifyData.signature = generateValidSignature(verifyData);

      mockRepository.findByLicenseKey.mockResolvedValue(license);

      const result = await service.verifyLicense(verifyData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('License is for a different plugin');
    });

    it('should reject license bound to different hardware', async () => {
      const license = createValidLicense();
      license.hardwareId = 'different-hardware';
      
      const verifyData: VerifyLicenseDto = {
        licenseKey: 'VALID-LICENSE-KEY',
        hardwareId: 'hardware123',
        pluginId: 100,
        timestamp: Date.now(),
        signature: ''
      };
      verifyData.signature = generateValidSignature(verifyData);

      mockRepository.findByLicenseKey.mockResolvedValue(license);

      const result = await service.verifyLicense(verifyData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('License is bound to different hardware');
    });

    it('should reject invalid signature', async () => {
      const license = createValidLicense();
      
      const verifyData: VerifyLicenseDto = {
        licenseKey: 'VALID-LICENSE-KEY',
        hardwareId: 'hardware123',
        pluginId: 100,
        timestamp: Date.now(),
        signature: 'invalid-signature'
      };

      mockRepository.findByLicenseKey.mockResolvedValue(license);

      const result = await service.verifyLicense(verifyData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });

    it('should verify license successfully on second call', async () => {
      const license = createValidLicense();
      const verifyData: VerifyLicenseDto = {
        licenseKey: 'VALID-LICENSE-KEY',
        hardwareId: 'hardware123',
        pluginId: 100,
        timestamp: Date.now(),
        signature: ''
      };
      verifyData.signature = generateValidSignature(verifyData);

      mockRepository.findByLicenseKey.mockResolvedValue(license);

      // First call
      await service.verifyLicense(verifyData);

      // Second call (will still check repository)
      const result = await service.verifyLicense(verifyData);

      expect(result.valid).toBe(true);
      expect(mockRepository.findByLicenseKey).toHaveBeenCalledTimes(2);
    });

    it('should allow offline verification within grace period', async () => {
      const license = createValidLicense();
      const verifyData: VerifyLicenseDto = {
        licenseKey: 'VALID-LICENSE-KEY',
        hardwareId: 'hardware123',
        pluginId: 100,
        timestamp: Date.now(),
        signature: ''
      };
      verifyData.signature = generateValidSignature(verifyData);

      // First successful verification
      mockRepository.findByLicenseKey.mockResolvedValue(license);
      const firstResult = await service.verifyLicense(verifyData);
      expect(firstResult.valid).toBe(true);
      expect(firstResult.offline).toBe(false);

      // Simulate offline - repository throws error
      mockRepository.findByLicenseKey.mockRejectedValue(new Error('Network error'));

      // Use the same verification data (simulating retry with same request)
      const result = await service.verifyLicense(verifyData);

      expect(result.valid).toBe(true);
      expect(result.offline).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should clear all cache', async () => {
      const license = createValidLicense();
      const verifyData: VerifyLicenseDto = {
        licenseKey: 'VALID-LICENSE-KEY',
        hardwareId: 'hardware123',
        pluginId: 100,
        timestamp: Date.now(),
        signature: ''
      };
      verifyData.signature = generateValidSignature(verifyData);

      mockRepository.findByLicenseKey.mockResolvedValue(license);

      // Cache the license
      await service.verifyLicense(verifyData);

      // Clear cache
      service.clearCache();

      // Next call should hit repository
      mockRepository.findByLicenseKey.mockClear();
      mockRepository.findByLicenseKey.mockResolvedValue(license);
      
      await service.verifyLicense(verifyData);

      expect(mockRepository.findByLicenseKey).toHaveBeenCalled();
    });

    it('should clear specific license cache', async () => {
      const license = createValidLicense();
      const verifyData: VerifyLicenseDto = {
        licenseKey: 'VALID-LICENSE-KEY',
        hardwareId: 'hardware123',
        pluginId: 100,
        timestamp: Date.now(),
        signature: ''
      };
      verifyData.signature = generateValidSignature(verifyData);

      mockRepository.findByLicenseKey.mockResolvedValue(license);

      // Cache the license
      await service.verifyLicense(verifyData);

      // Clear specific license cache
      service.clearLicenseCache('VALID-LICENSE-KEY');

      // Next call should hit repository
      mockRepository.findByLicenseKey.mockClear();
      mockRepository.findByLicenseKey.mockResolvedValue(license);
      
      await service.verifyLicense(verifyData);

      expect(mockRepository.findByLicenseKey).toHaveBeenCalled();
    });
  });

  describe('generateSignature', () => {
    it('should generate valid signature', () => {
      const licenseKey = 'TEST-LICENSE';
      const hardwareId = 'hardware123';
      const pluginId = 100;

      const signature = service.generateSignature(
        licenseKey,
        hardwareId,
        pluginId,
        serverKeys.privateKey
      );

      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
    });
  });
});