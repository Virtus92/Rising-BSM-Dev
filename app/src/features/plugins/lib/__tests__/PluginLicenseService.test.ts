import { PluginLicenseService } from '../services/PluginLicenseService';
import { IPluginLicenseRepository } from '@/domain/repositories/IPluginLicenseRepository';
import { IPluginRepository } from '@/domain/repositories/IPluginRepository';
import { PluginLicense } from '@/domain/entities/PluginLicense';
import { Plugin } from '@/domain/entities/Plugin';
import { VerifyLicenseDto } from '@/domain/dtos/PluginDtos';
import { AppError } from '@/core/errors';
import { PluginEncryptionService } from '../security/PluginEncryptionService';

describe('PluginLicenseService', () => {
  let service: PluginLicenseService;
  let mockLicenseRepository: jest.Mocked<IPluginLicenseRepository>;
  let mockPluginRepository: jest.Mocked<IPluginRepository>;
  let mockEncryptionService: jest.Mocked<PluginEncryptionService>;

  beforeEach(() => {
    mockLicenseRepository = {
      findById: jest.fn(),
      findByLicenseKey: jest.fn(),
      findByUser: jest.fn(),
      findByPlugin: jest.fn(),
      findByUserAndPlugin: jest.fn(),
      findActiveByUser: jest.fn(),
      findExpiring: jest.fn(),
      updateUsage: jest.fn(),
      updateUsageData: jest.fn(),
      incrementInstalls: jest.fn(),
      decrementInstalls: jest.fn(),
      updateLastVerified: jest.fn(),
      revoke: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    mockPluginRepository = {
      findById: jest.fn(),
      findByName: jest.fn()
    } as any;

    mockEncryptionService = {
      generateLicenseKey: jest.fn().mockReturnValue('TEST-LICENSE-KEY')
    } as any;

    service = new PluginLicenseService(
      mockLicenseRepository,
      mockPluginRepository,
      mockEncryptionService,
      'server-public-key'
    );
  });

  describe('generateLicense', () => {
    it('should generate a new license successfully', async () => {
      const plugin = new Plugin({
        id: 1,
        name: 'test-plugin',
        status: 'approved'
      });

      mockPluginRepository.findById.mockResolvedValue(plugin);
      mockLicenseRepository.findByUserAndPlugin.mockResolvedValue(null);
      mockLicenseRepository.create.mockResolvedValue(new PluginLicense({
        id: 1,
        licenseKey: 'TEST-LICENSE-KEY',
        pluginId: 1,
        userId: 1,
        type: 'basic',
        status: 'active'
      }));

      const result = await service.generateLicense(1, 1, 'basic');

      expect(result).toBeDefined();
      expect(result.licenseKey).toBe('TEST-LICENSE-KEY');
      expect(result.type).toBe('basic');
      expect(mockEncryptionService.generateLicenseKey).toHaveBeenCalled();
    });

    it('should throw error if plugin not found', async () => {
      mockPluginRepository.findById.mockResolvedValue(null);

      await expect(service.generateLicense(1, 1, 'basic'))
        .rejects.toThrow(new AppError('Plugin not found', 404));
    });

    it('should throw error if plugin not approved', async () => {
      const plugin = new Plugin({
        id: 1,
        status: 'pending'
      });

      mockPluginRepository.findById.mockResolvedValue(plugin);

      await expect(service.generateLicense(1, 1, 'basic'))
        .rejects.toThrow(new AppError('Plugin is not approved for licensing', 400));
    });

    it('should throw error if user already has active license', async () => {
      const plugin = new Plugin({
        id: 1,
        status: 'approved'
      });

      const existingLicense = new PluginLicense({
        id: 1,
        status: 'active',
        expiresAt: new Date(Date.now() + 10000)
      });

      mockPluginRepository.findById.mockResolvedValue(plugin);
      mockLicenseRepository.findByUserAndPlugin.mockResolvedValue(existingLicense);

      await expect(service.generateLicense(1, 1, 'basic'))
        .rejects.toThrow(new AppError('User already has an active license for this plugin', 400));
    });

    it('should set correct limits for different license types', async () => {
      const plugin = new Plugin({
        id: 1,
        status: 'approved'
      });

      mockPluginRepository.findById.mockResolvedValue(plugin);
      mockLicenseRepository.findByUserAndPlugin.mockResolvedValue(null);

      let createdLicense: any;
      mockLicenseRepository.create.mockImplementation(async (license: Partial<PluginLicense>) => {
        createdLicense = license;
        return new PluginLicense(license);
      });

      // Test trial license
      await service.generateLicense(1, 1, 'trial');
      expect(createdLicense.usageLimits?.apiCalls).toBe(1000);
      expect(createdLicense.maxInstalls).toBe(1);
      expect(createdLicense.expiresAt).toBeDefined();

      // Test premium license
      await service.generateLicense(1, 1, 'premium');
      expect(createdLicense.usageLimits?.apiCalls).toBe(100000);
      expect(createdLicense.maxInstalls).toBe(10);
    });
  });

  describe('license management', () => {
    it('should get license by key', async () => {
      const license = new PluginLicense({
        id: 1,
        licenseKey: 'TEST-KEY'
      });

      mockLicenseRepository.findByLicenseKey.mockResolvedValue(license);

      const result = await service.getLicenseByKey('TEST-KEY');

      expect(result).toBeDefined();
      expect(result?.licenseKey).toBe('TEST-KEY');
    });

    it('should get user licenses', async () => {
      const licenses = [
        new PluginLicense({ id: 1, userId: 1 }),
        new PluginLicense({ id: 2, userId: 1 })
      ];

      mockLicenseRepository.findByUser.mockResolvedValue(licenses);

      const result = await service.getUserLicenses(1);

      expect(result).toHaveLength(2);
    });

    it('should get active licenses', async () => {
      const licenses = [
        new PluginLicense({ id: 1, status: 'active' })
      ];

      mockLicenseRepository.findActiveByUser.mockResolvedValue(licenses);

      const result = await service.getActiveLicenses(1);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('active');
    });

    it('should get expiring licenses', async () => {
      const licenses = [
        new PluginLicense({
          id: 1,
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        })
      ];

      mockLicenseRepository.findExpiring.mockResolvedValue(licenses);

      const result = await service.getExpiringLicenses(7);

      expect(result).toHaveLength(1);
      expect(mockLicenseRepository.findExpiring).toHaveBeenCalledWith(7);
    });
  });

  describe('usage tracking', () => {
    it('should update usage', async () => {
      const license = new PluginLicense({
        id: 1,
        usageData: { apiCalls: 100 }
      });

      mockLicenseRepository.findById.mockResolvedValue(license);

      await service.updateUsage(1, 'apiCalls', 50);

      expect(mockLicenseRepository.updateUsageData).toHaveBeenCalledWith(1, { apiCalls: 150 });
    });

    it('should reset usage', async () => {
      const license = new PluginLicense({
        id: 1,
        usageData: { apiCalls: 1000, storage: 50 }
      });

      mockLicenseRepository.findById.mockResolvedValue(license);

      await service.resetUsage(1);

      const updateCall = mockLicenseRepository.updateUsageData.mock.calls[0];
      const updateData = updateCall[1] as any;
      expect(updateData.apiCalls).toBe(0);
      expect(updateData.storage).toBe(50); // Storage doesn't reset
      expect(updateData.lastReset).toBeDefined();
    });

    it('should check usage limit', async () => {
      const license = new PluginLicense({
        id: 1,
        usageLimits: { apiCalls: 1000 },
        usageData: { apiCalls: 500 }
      });

      mockLicenseRepository.findById.mockResolvedValue(license);

      const result = await service.checkUsageLimit(1, 'apiCalls');

      expect(result).toBe(true);
    });
  });

  describe('license operations', () => {
    it('should renew license', async () => {
      const license = new PluginLicense({
        id: 1,
        status: 'active',
        expiresAt: new Date()
      });

      const renewedLicense = new PluginLicense({
        ...license,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      mockLicenseRepository.findById.mockResolvedValue(license);
      mockLicenseRepository.update.mockResolvedValue(renewedLicense);

      const result = await service.renewLicense(1, 30);

      expect(result.expiresAt).toBeDefined();
      const updateCall = mockLicenseRepository.update.mock.calls[0];
      expect(updateCall[1].status).toBe('active');
    });

    it('should upgrade license', async () => {
      const license = new PluginLicense({
        id: 1,
        type: 'basic'
      });

      mockLicenseRepository.findById.mockResolvedValue(license);
      mockLicenseRepository.update.mockResolvedValue(new PluginLicense({
        ...license,
        type: 'premium'
      }));

      const result = await service.upgradeLicense(1, 'premium');

      const updateCall = mockLicenseRepository.update.mock.calls[0];
      expect(updateCall[1].type).toBe('premium');
      expect(updateCall[1].usageLimits).toBeDefined();
    });

    it('should not allow downgrade', async () => {
      const license = new PluginLicense({
        id: 1,
        type: 'premium'
      });

      mockLicenseRepository.findById.mockResolvedValue(license);

      await expect(service.upgradeLicense(1, 'basic'))
        .rejects.toThrow(new AppError('Can only upgrade to a higher tier', 400));
    });

    it('should revoke license', async () => {
      const license = new PluginLicense({
        id: 1,
        licenseKey: 'TEST-KEY'
      });

      mockLicenseRepository.findById.mockResolvedValue(license);

      await service.revokeLicense(1, 'Violation of terms');

      expect(mockLicenseRepository.revoke).toHaveBeenCalledWith(1, 'Violation of terms');
    });

    it('should suspend license', async () => {
      const license = new PluginLicense({
        id: 1,
        licenseKey: 'TEST-KEY'
      });

      mockLicenseRepository.findById.mockResolvedValue(license);

      await service.suspendLicense(1, 'Suspicious activity');

      const updateCall = mockLicenseRepository.update.mock.calls[0];
      expect(updateCall[1].status).toBe('suspended');
      expect(updateCall[1].usageData?.suspendedReason).toBe('Suspicious activity');
    });

    it('should bind to hardware', async () => {
      const license = new PluginLicense({
        id: 1,
        hardwareId: undefined
      });

      mockLicenseRepository.findById.mockResolvedValue(license);

      await service.bindToHardware(1, 'hardware123');

      expect(mockLicenseRepository.update).toHaveBeenCalledWith(1, { hardwareId: 'hardware123' });
    });

    it('should not bind if already bound', async () => {
      const license = new PluginLicense({
        id: 1,
        hardwareId: 'existing-hardware'
      });

      mockLicenseRepository.findById.mockResolvedValue(license);

      await expect(service.bindToHardware(1, 'new-hardware'))
        .rejects.toThrow(new AppError('License is already bound to hardware', 400));
    });

    it('should transfer license', async () => {
      const license = new PluginLicense({
        id: 1,
        type: 'basic',
        userId: 1
      });

      mockLicenseRepository.findById.mockResolvedValue(license);

      await service.transferLicense(1, 2);

      expect(mockLicenseRepository.update).toHaveBeenCalledWith(1, {
        userId: 2,
        hardwareId: undefined,
        currentInstalls: 0
      });
    });

    it('should not transfer enterprise licenses', async () => {
      const license = new PluginLicense({
        id: 1,
        type: 'enterprise'
      });

      mockLicenseRepository.findById.mockResolvedValue(license);

      await expect(service.transferLicense(1, 2))
        .rejects.toThrow(new AppError('Enterprise licenses cannot be transferred', 400));
    });
  });
});