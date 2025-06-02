import { PluginService } from '../services/PluginService.server';
import { IPluginRepository } from '@/domain/repositories/IPluginRepository';
import { ILoggingService } from '@/core/logging';
import { IValidationService } from '@/core/validation';
import { IActivityLogService } from '@/domain/services/IActivityLogService';
import { IAutomationService } from '@/domain/services/IAutomationService';
import { IUserService } from '@/domain/services/IUserService';
import { PluginEncryptionService } from '../security/PluginEncryptionService';
import { CreatePluginDto } from '@/domain/dtos/PluginDtos';
import { Plugin } from '@/domain/entities/Plugin';
import { UserDto } from '@/domain/dtos/UserDtos';
import { ValidationResult } from '@/domain/enums/ValidationResults';

// Mock dependencies
const mockRepository: jest.Mocked<IPluginRepository> = {
  findByName: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  findByCriteria: jest.fn(),
  findByAuthor: jest.fn(),
  findByCategory: jest.fn(),
  findByStatus: jest.fn(),
  updateInstallCount: jest.fn(),
  updateRevenue: jest.fn(),
  updateRating: jest.fn(),
  findByUuid: jest.fn(),
  search: jest.fn(),
  getCategories: jest.fn(),
  getTags: jest.fn(),
  incrementDownloads: jest.fn(),
  findApproved: jest.fn(),
} as any;

const mockLogger: jest.Mocked<ILoggingService> = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
} as any;

const mockValidator: jest.Mocked<IValidationService> = {
  validate: jest.fn(),
} as any;

const mockActivityLog: jest.Mocked<IActivityLogService> = {
  createLog: jest.fn(),
} as any;

const mockAutomationService: jest.Mocked<IAutomationService> = {
  triggerWebhook: jest.fn(),
} as any;

const mockUserService: jest.Mocked<IUserService> = {
  getById: jest.fn(),
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as any;

const mockEncryptionService: jest.Mocked<PluginEncryptionService> = {
  generateKeyPair: jest.fn(),
  calculateChecksum: jest.fn(),
  signPlugin: jest.fn(),
  verifyPluginSignature: jest.fn(),
  encryptPlugin: jest.fn(),
  decryptPlugin: jest.fn(),
  generateLicenseKey: jest.fn(),
  watermarkCode: jest.fn(),
} as any;

describe('PluginService.server', () => {
  let service: PluginService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    service = new PluginService(
      mockRepository,
      mockLogger,
      mockValidator,
      mockActivityLog,
      mockAutomationService,
      mockEncryptionService,
      mockUserService
    );

    // Set up default mocks
    mockValidator.validate.mockResolvedValue({
      result: ValidationResult.SUCCESS,
      isValid: true
    });
    
    mockEncryptionService.generateKeyPair.mockResolvedValue({
      publicKey: 'test-public-key',
      privateKey: 'test-private-key'
    });
  });

  describe('create', () => {
    it('should fetch author name from user service when creating plugin', async () => {
      // Arrange
      const createDto: CreatePluginDto = {
        name: 'test-plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        type: 'ui',
        category: 'utilities',
        minAppVersion: '1.0.0'
      };

      const mockUser: UserDto = {
        id: 123,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 1,
        updatedBy: 1
      };

      mockRepository.findByName.mockResolvedValue(null);
      mockUserService.getById.mockResolvedValue(mockUser);
      mockRepository.create.mockImplementation((plugin: Plugin) => 
        Promise.resolve({ ...plugin, id: 1 })
      );

      // Act
      const result = await service.create(createDto, { context: { userId: 123 } });

      // Assert
      expect(mockUserService.getById).toHaveBeenCalledWith(123);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          author: 'John Doe',
          authorId: 123
        })
      );
      expect(result.author).toBe('John Doe');
      expect(result.authorId).toBe(123);
    });

    it('should handle missing user gracefully', async () => {
      // Arrange
      const createDto: CreatePluginDto = {
        name: 'test-plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        type: 'api',
        category: 'utilities',
        minAppVersion: '1.0.0'
      };

      mockRepository.findByName.mockResolvedValue(null);
      mockUserService.getById.mockResolvedValue(null);
      mockRepository.create.mockImplementation((plugin: Plugin) => 
        Promise.resolve({ ...plugin, id: 1 })
      );

      // Act
      const result = await service.create(createDto, { context: { userId: 456 } });

      // Assert
      expect(mockUserService.getById).toHaveBeenCalledWith(456);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Author user not found when creating plugin',
        { authorId: 456 }
      );
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          author: '',
          authorId: 456
        })
      );
    });

    it('should handle user service errors gracefully', async () => {
      // Arrange
      const createDto: CreatePluginDto = {
        name: 'test-plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        type: 'automation',
        category: 'utilities',
        minAppVersion: '1.0.0'
      };

      mockRepository.findByName.mockResolvedValue(null);
      mockUserService.getById.mockRejectedValue(new Error('User service error'));
      mockRepository.create.mockImplementation((plugin: Plugin) => 
        Promise.resolve({ ...plugin, id: 1 })
      );

      // Act
      const result = await service.create(createDto, { context: { userId: 789 } });

      // Assert
      expect(mockUserService.getById).toHaveBeenCalledWith(789);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch author information',
        expect.objectContaining({ authorId: 789 })
      );
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          author: '',
          authorId: 789
        })
      );
      // Plugin creation should still succeed
      expect(result).toBeDefined();
    });

    it('should include author name in activity log and automation webhook', async () => {
      // Arrange
      const createDto: CreatePluginDto = {
        name: 'test-plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        type: 'mixed',
        category: 'utilities',
        minAppVersion: '1.0.0'
      };

      const mockUser: UserDto = {
        id: 999,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'MANAGER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 1,
        updatedBy: 1
      };

      mockRepository.findByName.mockResolvedValue(null);
      mockUserService.getById.mockResolvedValue(mockUser);
      mockRepository.create.mockImplementation((plugin: Plugin) => 
        Promise.resolve({ ...plugin, id: 1 })
      );

      // Act
      await service.create(createDto, { context: { userId: 999 } });

      // Assert
      expect(mockActivityLog.createLog).toHaveBeenCalledWith(
        expect.any(String),
        1,
        999,
        'plugin.created',
        { pluginName: 'test-plugin', authorName: 'Jane Smith' }
      );

      expect(mockAutomationService.triggerWebhook).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          pluginId: 1,
          pluginName: 'test-plugin',
          authorId: 999,
          authorName: 'Jane Smith'
        }),
        1
      );
    });
  });

  describe('createPlugin', () => {
    it('should delegate to create method with proper context', async () => {
      // Arrange
      const createDto: CreatePluginDto = {
        name: 'delegate-plugin',
        displayName: 'Delegate Plugin',
        version: '1.0.0',
        type: 'ui',
        category: 'testing',
        minAppVersion: '1.0.0'
      };

      const mockUser: UserDto = {
        id: 555,
        name: 'Test Developer',
        email: 'dev@example.com',
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 1,
        updatedBy: 1
      };

      mockRepository.findByName.mockResolvedValue(null);
      mockUserService.getById.mockResolvedValue(mockUser);
      mockRepository.create.mockImplementation((plugin: Plugin) => 
        Promise.resolve({ ...plugin, id: 2 })
      );

      // Act
      const result = await service.createPlugin(createDto, 555);

      // Assert
      expect(mockUserService.getById).toHaveBeenCalledWith(555);
      expect(result.author).toBe('Test Developer');
      expect(result.authorId).toBe(555);
    });
  });
});
