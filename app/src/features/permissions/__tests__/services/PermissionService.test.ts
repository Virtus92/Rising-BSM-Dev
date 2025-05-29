import { PermissionService } from '@/features/permissions/lib/services/PermissionService';
import { IPermissionRepository } from '@/domain/repositories/IPermissionRepository';
import { CreatePermissionDto, UpdatePermissionDto } from '@/domain/dtos/PermissionDtos';
import { AppError } from '@/core/errors';

describe('PermissionService', () => {
  let service: PermissionService;
  let mockRepository: jest.Mocked<IPermissionRepository>;

  beforeEach(() => {
    // Create mock repository with correct method signatures
    mockRepository = {
      getRepository: jest.fn().mockReturnValue({
        prisma: {
          user: {
            findUnique: jest.fn(),
          },
        },
      }),
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByCode: jest.fn(),
      findByUserId: jest.fn(),
      findByRoleName: jest.fn(),
      checkPermission: jest.fn(),
      assignToUser: jest.fn(),
      removeFromUser: jest.fn(),
      updateUserPermissions: jest.fn(),
      getUserPermissions: jest.fn(),
    } as any;

    service = new PermissionService(mockRepository);
  });

  describe('create', () => {
    it('should create permission successfully', async () => {
      const dto: CreatePermissionDto = {
        name: 'View Users',
        code: 'users.view',
        description: 'Can view users',
        category: 'Users',
      };
      const permission = {
        id: 1,
        name: 'View Users',
        code: 'users.view',
        description: 'Can view users',
        category: 'Users',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.create.mockResolvedValue(permission as any);

      const result = await service.create(dto);

      expect(result).toMatchObject({
        id: 1,
        name: 'View Users',
        code: 'users.view',
        description: 'Can view users',
        category: 'Users',
      });
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        name: '',
        code: '',
      } as CreatePermissionDto;

      await expect(service.create(invalidDto)).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('should update permission successfully', async () => {
      const existingPermission = {
        id: 1,
        name: 'View Users',
        code: 'users.view',
        description: 'Can view users',
        category: 'Users',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const dto: UpdatePermissionDto = {
        name: 'View All Users',
        description: 'Can view all users in the system',
      };
      const updatedPermission = {
        ...existingPermission,
        ...dto,
      };
      mockRepository.findById.mockResolvedValue(existingPermission as any);
      mockRepository.update.mockResolvedValue(updatedPermission as any);

      const result = await service.update(1, dto);

      expect(result).toMatchObject({
        id: 1,
        name: 'View All Users',
        description: 'Can view all users in the system',
      });
      expect(mockRepository.update).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should throw error if permission not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(AppError);
      await expect(service.update(999, {})).rejects.toThrow('Permission with ID 999 not found');
    });
  });

  describe('delete', () => {
    it('should delete permission successfully', async () => {
      const permission = {
        id: 1,
        name: 'View Users',
        code: 'users.view',
        description: 'Can view users',
        category: 'Users',
      };
      mockRepository.findById.mockResolvedValue(permission as any);
      mockRepository.delete.mockResolvedValue(true);

      const result = await service.delete(1);

      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw error if permission not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(AppError);
      await expect(service.delete(999)).rejects.toThrow('Permission with ID 999 not found');
    });
  });

  describe('findById', () => {
    it('should find permission by id', async () => {
      const permission = {
        id: 1,
        name: 'View Users',
        code: 'users.view',
        description: 'Can view users',
        category: 'Users',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findById.mockResolvedValue(permission as any);

      const result = await service.findById(1);

      expect(result).toMatchObject({
        id: 1,
        name: 'View Users',
        code: 'users.view',
      });
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null if permission not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all permissions with pagination', async () => {
      const permissions = [
        {
          id: 1,
          name: 'View Users',
          code: 'users.view',
          description: 'Can view users',
          category: 'Users',
        },
        {
          id: 2,
          name: 'Create Users',
          code: 'users.create',
          description: 'Can create users',
          category: 'Users',
        },
      ];
      mockRepository.findAll.mockResolvedValue({
        data: permissions,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1,
        },
      } as any);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(mockRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sort: undefined,
      });
    });
  });

  describe('getUserPermissions', () => {
    it('should get user permissions', async () => {
      const permissions = ['users.view', 'users.edit'];
      mockRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await service.getUserPermissions(123);

      expect(result.userId).toBe(123);
      expect(result.permissions).toEqual(permissions);
      expect(mockRepository.getUserPermissions).toHaveBeenCalledWith(123);
    });

    it('should handle invalid user ID', async () => {
      await expect(service.getUserPermissions(0)).rejects.toThrow(AppError);
      await expect(service.getUserPermissions(-1)).rejects.toThrow(AppError);
    });
  });

  describe('updateUserPermissions', () => {
    it('should validate input parameters', async () => {
      const dto = { userId: '', permissions: [] } as any;
      await expect(service.updateUserPermissions(dto)).rejects.toThrow(AppError);
      
      const dto2 = { userId: 'user123', permissions: null as any } as any;
      await expect(service.updateUserPermissions(dto2)).rejects.toThrow(AppError);
    });
  });
});