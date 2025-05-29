import { PluginService } from '../services/PluginService';
import { IPluginRepository } from '@/domain/repositories/IPluginRepository';
import { Plugin, PluginPermission, PluginDependency } from '@/domain/entities/Plugin';
import { CreatePluginDto, UpdatePluginDto, PluginSearchDto } from '@/domain/dtos/PluginDtos';
import { PluginEncryptionService } from '../security/PluginEncryptionService';
import { AppError } from '@/core/errors';

jest.mock('fs/promises');

describe('PluginService', () => {
  let service: PluginService;
  let mockRepository: jest.Mocked<IPluginRepository>;
  let mockEncryptionService: jest.Mocked<PluginEncryptionService>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findByUuid: jest.fn(),
      findByAuthor: jest.fn(),
      findByCategory: jest.fn(),
      findByStatus: jest.fn(),
      search: jest.fn(),
      incrementDownloads: jest.fn(),
      updateRating: jest.fn(),
      getCategories: jest.fn(),
      getTags: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    mockEncryptionService = {
      generateKeyPair: jest.fn().mockReturnValue({
        publicKey: 'test-public-key',
        privateKey: 'test-private-key'
      }),
      calculateChecksum: jest.fn().mockResolvedValue('test-checksum'),
      signPlugin: jest.fn().mockResolvedValue('test-signature'),
      verifyPluginSignature: jest.fn().mockResolvedValue(true)
    } as any;

    service = new PluginService(mockRepository, mockEncryptionService, '/tmp/plugins');
  });

  describe('createPlugin', () => {
    const createDto: CreatePluginDto = {
      name: 'test-plugin',
      displayName: 'Test Plugin',
      description: 'A test plugin',
      version: '1.0.0',
      type: 'api',
      category: 'utilities',
      minAppVersion: '1.0.0'
    };

    it('should create a new plugin successfully', async () => {
      const authorId = 1;
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(new Plugin({
        ...createDto,
        id: 1,
        uuid: 'test-uuid',
        authorId,
        author: 'Test Author',
        status: 'pending',
        publicKey: 'test-public-key',
        certificate: '',
        checksum: '',
        downloads: 0,
        rating: 0,
        permissions: [] as PluginPermission[],
        dependencies: [] as PluginDependency[],
        tags: [],
        screenshots: [],
        pricing: {},
        trialDays: 0
      }));

      const result = await service.createPlugin(createDto, authorId);

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(result.status).toBe('pending');
      expect(mockEncryptionService.generateKeyPair).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw error if plugin name already exists', async () => {
      mockRepository.findByName.mockResolvedValue(new Plugin({ 
        name: 'test-plugin',
        uuid: 'existing-uuid',
        displayName: 'Existing Plugin',
        version: '1.0.0',
        type: 'api',
        category: 'utilities',
        authorId: 1,
        author: 'Test Author',
        status: 'pending',
        publicKey: 'key',
        certificate: '',
        checksum: '',
        downloads: 0,
        rating: 0,
        minAppVersion: '1.0.0',
        permissions: [] as PluginPermission[],
        dependencies: [] as PluginDependency[],
        tags: [],
        screenshots: [],
        pricing: {},
        trialDays: 0
      }));

      await expect(service.createPlugin(createDto, 1))
        .rejects.toThrow(new AppError('Plugin with this name already exists', 400));
    });
  });

  describe('updatePlugin', () => {
    const updateDto: UpdatePluginDto = {
      displayName: 'Updated Plugin',
      description: 'Updated description',
      category: 'tools'
    };

    it('should update plugin successfully for author', async () => {
      const plugin = new Plugin({
        id: 1,
        uuid: 'test-uuid',
        name: 'test-plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        type: 'api',
        category: 'utilities',
        authorId: 1,
        author: 'Test Author',
        status: 'pending',
        publicKey: 'key',
        certificate: '',
        checksum: '',
        downloads: 0,
        rating: 0,
        minAppVersion: '1.0.0',
        permissions: [] as PluginPermission[],
        dependencies: [] as PluginDependency[],
        tags: [],
        screenshots: [],
        pricing: {},
        trialDays: 0
      });

      mockRepository.findById.mockResolvedValue(plugin);
      mockRepository.update.mockResolvedValue(new Plugin({ ...plugin, ...updateDto }));

      const result = await service.updatePlugin(1, updateDto, 1);

      expect(result.displayName).toBe(updateDto.displayName);
      expect(mockRepository.update).toHaveBeenCalledWith(1, expect.objectContaining(updateDto));
    });

    it('should throw error for unauthorized update', async () => {
      const plugin = new Plugin({
        id: 1,
        uuid: 'test-uuid',
        name: 'test-plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        type: 'api',
        category: 'utilities',
        authorId: 1,
        author: 'Test Author',
        status: 'pending',
        publicKey: 'key',
        certificate: '',
        checksum: '',
        downloads: 0,
        rating: 0,
        minAppVersion: '1.0.0',
        permissions: [] as PluginPermission[],
        dependencies: [] as PluginDependency[],
        tags: [],
        screenshots: [],
        pricing: {},
        trialDays: 0
      });

      mockRepository.findById.mockResolvedValue(plugin);

      await expect(service.updatePlugin(1, updateDto, 2))
        .rejects.toThrow(new AppError('Unauthorized to update this plugin', 403));
    });

    it('should prevent display name change for approved plugins', async () => {
      const plugin = new Plugin({
        id: 1,
        uuid: 'test-uuid',
        name: 'test-plugin',
        displayName: 'Original Name',
        version: '1.0.0',
        type: 'api',
        category: 'utilities',
        authorId: 1,
        author: 'Test Author',
        status: 'approved',
        publicKey: 'key',
        certificate: '',
        checksum: '',
        downloads: 0,
        rating: 0,
        minAppVersion: '1.0.0',
        permissions: [] as PluginPermission[],
        dependencies: [] as PluginDependency[],
        tags: [],
        screenshots: [],
        pricing: {},
        trialDays: 0
      });

      mockRepository.findById.mockResolvedValue(plugin);
      mockRepository.update.mockResolvedValue(plugin);

      await service.updatePlugin(1, updateDto, 1);

      const calledWith = mockRepository.update.mock.calls[0][1] as any;
      expect(calledWith.displayName).toBeUndefined();
    });
  });

  describe('submitForReview', () => {
    it('should submit plugin for review', async () => {
      const plugin = new Plugin({
        id: 1,
        uuid: 'test-uuid',
        name: 'test-plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        type: 'api',
        category: 'utilities',
        authorId: 1,
        author: 'Test Author',
        status: 'pending',
        publicKey: 'key',
        certificate: '',
        checksum: '',
        downloads: 0,
        rating: 0,
        minAppVersion: '1.0.0',
        permissions: [] as PluginPermission[],
        dependencies: [] as PluginDependency[],
        tags: [],
        screenshots: [],
        pricing: {},
        trialDays: 0
      });

      mockRepository.findById.mockResolvedValue(plugin);

      // Mock fs.access to simulate bundle exists
      const fs = require('fs/promises');
      fs.access = jest.fn().mockResolvedValue(undefined);

      await service.submitForReview(1, 1);

      expect(mockRepository.update).toHaveBeenCalledWith(1, { status: 'pending' });
    });

    it('should throw error if bundle not uploaded', async () => {
      const plugin = new Plugin({
        id: 1,
        uuid: 'test-uuid',
        name: 'test-plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        type: 'api',
        category: 'utilities',
        authorId: 1,
        author: 'Test Author',
        status: 'pending',
        publicKey: 'key',
        certificate: '',
        checksum: '',
        downloads: 0,
        rating: 0,
        minAppVersion: '1.0.0',
        permissions: [] as PluginPermission[],
        dependencies: [] as PluginDependency[],
        tags: [],
        screenshots: [],
        pricing: {},
        trialDays: 0
      });

      mockRepository.findById.mockResolvedValue(plugin);

      // Mock fs.access to simulate bundle doesn't exist
      const fs = require('fs/promises');
      fs.access = jest.fn().mockRejectedValue(new Error('File not found'));

      await expect(service.submitForReview(1, 1))
        .rejects.toThrow(new AppError('Plugin bundle must be uploaded before submission', 400));
    });
  });

  describe('searchPlugins', () => {
    it('should search plugins with criteria', async () => {
      const searchDto: PluginSearchDto = {
        query: 'test',
        type: 'api',
        category: 'utilities',
        page: 1,
        limit: 20
      };

      const plugins = [
        new Plugin({ 
          id: 1, 
          name: 'test-1',
          uuid: 'uuid-1',
          displayName: 'Test 1',
          version: '1.0.0',
          type: 'api',
          category: 'utilities',
          authorId: 1,
          author: 'Author',
          status: 'approved',
          publicKey: 'key',
          certificate: '',
          checksum: '',
          downloads: 0,
          rating: 0,
          minAppVersion: '1.0.0',
          permissions: [] as PluginPermission[],
          dependencies: [] as PluginDependency[],
          tags: [],
          screenshots: [],
          pricing: {},
          trialDays: 0
        }),
        new Plugin({ 
          id: 2, 
          name: 'test-2',
          uuid: 'uuid-2',
          displayName: 'Test 2',
          version: '1.0.0',
          type: 'api',
          category: 'utilities',
          authorId: 1,
          author: 'Author',
          status: 'approved',
          publicKey: 'key',
          certificate: '',
          checksum: '',
          downloads: 0,
          rating: 0,
          minAppVersion: '1.0.0',
          permissions: [] as PluginPermission[],
          dependencies: [] as PluginDependency[],
          tags: [],
          screenshots: [],
          pricing: {},
          trialDays: 0
        })
      ];

      mockRepository.search.mockResolvedValue({
        data: plugins,
        total: 2
      });

      const result = await service.searchPlugins(searchDto);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockRepository.search).toHaveBeenCalledWith(searchDto);
    });
  });

  describe('plugin operations', () => {
    it('should get plugin by name', async () => {
      const plugin = new Plugin({ 
        id: 1, 
        name: 'test-plugin',
        uuid: 'test-uuid',
        displayName: 'Test Plugin',
        version: '1.0.0',
        type: 'api',
        category: 'utilities',
        authorId: 1,
        author: 'Author',
        status: 'approved',
        publicKey: 'key',
        certificate: '',
        checksum: '',
        downloads: 0,
        rating: 0,
        minAppVersion: '1.0.0',
        permissions: [] as PluginPermission[],
        dependencies: [] as PluginDependency[],
        tags: [],
        screenshots: [],
        pricing: {},
        trialDays: 0
      });
      mockRepository.findByName.mockResolvedValue(plugin);

      const result = await service.getPluginByName('test-plugin');

      expect(result).toBeDefined();
      expect(result?.name).toBe('test-plugin');
    });

    it('should get plugin by UUID', async () => {
      const plugin = new Plugin({ 
        id: 1, 
        uuid: 'test-uuid',
        name: 'test-plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        type: 'api',
        category: 'utilities',
        authorId: 1,
        author: 'Author',
        status: 'approved',
        publicKey: 'key',
        certificate: '',
        checksum: '',
        downloads: 0,
        rating: 0,
        minAppVersion: '1.0.0',
        permissions: [] as PluginPermission[],
        dependencies: [] as PluginDependency[],
        tags: [],
        screenshots: [],
        pricing: {},
        trialDays: 0
      });
      mockRepository.findByUuid.mockResolvedValue(plugin);

      const result = await service.getPluginByUuid('test-uuid');

      expect(result).toBeDefined();
      expect(result?.uuid).toBe('test-uuid');
    });

    it('should get plugins by author', async () => {
      const plugins = [
        new Plugin({ 
          id: 1, 
          authorId: 1,
          name: 'plugin-1',
          uuid: 'uuid-1',
          displayName: 'Plugin 1',
          version: '1.0.0',
          type: 'api',
          category: 'utilities',
          author: 'Author',
          status: 'approved',
          publicKey: 'key',
          certificate: '',
          checksum: '',
          downloads: 0,
          rating: 0,
          minAppVersion: '1.0.0',
          permissions: [] as PluginPermission[],
          dependencies: [] as PluginDependency[],
          tags: [],
          screenshots: [],
          pricing: {},
          trialDays: 0
        }),
        new Plugin({ 
          id: 2, 
          authorId: 1,
          name: 'plugin-2',
          uuid: 'uuid-2',
          displayName: 'Plugin 2',
          version: '1.0.0',
          type: 'api',
          category: 'utilities',
          author: 'Author',
          status: 'approved',
          publicKey: 'key',
          certificate: '',
          checksum: '',
          downloads: 0,
          rating: 0,
          minAppVersion: '1.0.0',
          permissions: [] as PluginPermission[],
          dependencies: [] as PluginDependency[],
          tags: [],
          screenshots: [],
          pricing: {},
          trialDays: 0
        })
      ];
      mockRepository.findByAuthor.mockResolvedValue(plugins);

      const result = await service.getPluginsByAuthor(1);

      expect(result).toHaveLength(2);
    });

    it('should increment downloads', async () => {
      await service.incrementDownloads(1);

      expect(mockRepository.incrementDownloads).toHaveBeenCalledWith(1);
    });

    it('should get categories', async () => {
      mockRepository.getCategories.mockResolvedValue(['utilities', 'tools']);

      const result = await service.getCategories();

      expect(result).toEqual(['utilities', 'tools']);
    });

    it('should get tags', async () => {
      mockRepository.getTags.mockResolvedValue(['productivity', 'automation']);

      const result = await service.getTags();

      expect(result).toEqual(['productivity', 'automation']);
    });
  });

  describe('uploadPluginBundle', () => {
    it('should upload plugin bundle successfully', async () => {
      const plugin = new Plugin({
        id: 1,
        uuid: 'test-uuid',
        name: 'test-plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        type: 'api',
        category: 'utilities',
        authorId: 1,
        author: 'Author',
        status: 'pending',
        publicKey: 'key',
        certificate: '',
        checksum: '',
        downloads: 0,
        rating: 0,
        minAppVersion: '1.0.0',
        permissions: [] as PluginPermission[],
        dependencies: [] as PluginDependency[],
        tags: [],
        screenshots: [],
        pricing: {},
        trialDays: 0
      });

      mockRepository.findById.mockResolvedValue(plugin);

      const fs = require('fs/promises');
      fs.mkdir = jest.fn().mockResolvedValue(undefined);
      fs.writeFile = jest.fn().mockResolvedValue(undefined);
      fs.readFile = jest.fn().mockResolvedValue('test-private-key');

      const bundle = Buffer.from('plugin code');
      const result = await service.uploadPluginBundle(1, bundle, 1);

      expect(result).toBe('test-signature');
      expect(mockEncryptionService.calculateChecksum).toHaveBeenCalledWith(bundle);
      expect(mockRepository.update).toHaveBeenCalledWith(1, { checksum: 'test-checksum' });
    });

    it('should throw error for unauthorized upload', async () => {
      const plugin = new Plugin({
        id: 1,
        uuid: 'test-uuid',
        name: 'test-plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        type: 'api',
        category: 'utilities',
        authorId: 1,
        author: 'Author',
        status: 'pending',
        publicKey: 'key',
        certificate: '',
        checksum: '',
        downloads: 0,
        rating: 0,
        minAppVersion: '1.0.0',
        permissions: [] as PluginPermission[],
        dependencies: [] as PluginDependency[],
        tags: [],
        screenshots: [],
        pricing: {},
        trialDays: 0
      });

      mockRepository.findById.mockResolvedValue(plugin);

      await expect(service.uploadPluginBundle(1, Buffer.from(''), 2))
        .rejects.toThrow(new AppError('Unauthorized to upload bundle for this plugin', 403));
    });
  });

  describe('signature operations', () => {
    it('should generate signature', async () => {
      const plugin = new Plugin({
        id: 1,
        uuid: 'test-uuid',
        name: 'test-plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        type: 'api',
        category: 'utilities',
        authorId: 1,
        author: 'Author',
        status: 'pending',
        publicKey: 'key',
        certificate: '',
        checksum: 'test-checksum',
        downloads: 0,
        rating: 0,
        minAppVersion: '1.0.0',
        permissions: [] as PluginPermission[],
        dependencies: [] as PluginDependency[],
        tags: [],
        screenshots: [],
        pricing: {},
        trialDays: 0
      });

      mockRepository.findById.mockResolvedValue(plugin);

      const result = await service.generateSignature(1, 'private-key');

      expect(result).toBe('test-signature');
      expect(mockEncryptionService.signPlugin).toHaveBeenCalled();
    });

    it('should verify signature', async () => {
      const plugin = new Plugin({
        id: 1,
        uuid: 'test-uuid',
        name: 'test-plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        type: 'api',
        category: 'utilities',
        authorId: 1,
        author: 'Author',
        status: 'pending',
        publicKey: 'public-key',
        certificate: '',
        checksum: 'test-checksum',
        downloads: 0,
        rating: 0,
        minAppVersion: '1.0.0',
        permissions: [] as PluginPermission[],
        dependencies: [] as PluginDependency[],
        tags: [],
        screenshots: [],
        pricing: {},
        trialDays: 0
      });

      mockRepository.findById.mockResolvedValue(plugin);

      const result = await service.verifySignature(1, 'test-signature');

      expect(result).toBe(true);
      expect(mockEncryptionService.verifyPluginSignature).toHaveBeenCalled();
    });
  });
});
