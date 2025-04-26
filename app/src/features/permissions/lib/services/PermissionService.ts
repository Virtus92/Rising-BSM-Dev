import { 
  PermissionDto, 
  CreatePermissionDto, 
  UpdatePermissionDto, 
  PermissionResponseDto, 
  UserPermissionsResponseDto,
  UpdateUserPermissionsDto,
  PermissionFilterParamsDto
} from '@/domain/dtos/PermissionDtos';
import { IPermissionService } from '@/domain/services/IPermissionService';
import { Permission } from '@/domain/entities/Permission';
import { IPermissionRepository } from '@/domain/repositories/IPermissionRepository';
import { IErrorHandler } from '@/core/errors';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IValidationService } from '@/core/validation/IValidationService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { getPermissionsForRole } from '@/domain/enums/PermissionEnums';

/**
 * Service for managing permissions
 */
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';

export class PermissionService implements IPermissionService {
  /**
   * Constructor
   * 
   * @param permissionRepository - Permission repository
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handling service
   */
  constructor(
    public readonly permissionRepository: IPermissionRepository,
    public readonly logger: ILoggingService,
    public readonly validator: IValidationService,
    public readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized PermissionService');
  }
  
  /**
   * Helper method to invalidate the permission cache for a user
   * 
   * @param userId - User ID to invalidate the cache for
   * @returns Promise that resolves when cache invalidation is complete
   */
  private async invalidateUserPermissionCache(userId: number): Promise<boolean> {
    try {
      // Check if permissionMiddleware module is available
      if (!permissionMiddleware || !permissionMiddleware.invalidatePermissionCache) {
        this.logger.warn(`Cannot invalidate permission cache for user ${userId}: permissionMiddleware module not available`);
        return false;
      }
      
      // Call the cache invalidation function
      const result = await permissionMiddleware.invalidatePermissionCache(userId);
      this.logger.info(`Invalidated permission cache for user ${userId}, result: ${result}`);
      return result;
    } catch (error) {
      // Log error but don't throw it to avoid breaking the main operation
      this.logger.error(`Failed to invalidate permission cache for user ${userId}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId
      });
      return false;
    }
  }

  /**
   * Counts permissions based on optional filters
   * 
   * @param options - Counting options and filters
   * @returns Number of permissions matching the filters
   */
  async count(options?: { context?: any; filters?: Record<string, any>; }): Promise<number> {
    try {
      const filters = options?.filters || {};
      const result = await this.permissionRepository.count(filters);
      return result;
    } catch (error) {
      this.logger.error('Error in PermissionService.count', { error, options });
      throw error;
    }
  }

  /**
   * Finds all permissions with pagination
   * 
   * @param options - Service options including pagination parameters
   * @returns Paginated list of permissions
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<PermissionResponseDto>> {
    try {
      const page = options?.filters?.page || 1;
      const limit = options?.filters?.limit || 10;
      const filters = options?.filters || {};
      
      const result = await this.permissionRepository.findAll({
        page,
        limit,
        ...filters
      });
      
      // Assuming repository returns data in expected format or convert it here
      const paginatedData = Array.isArray(result) 
        ? { 
            data: result, 
            pagination: { page, limit, total: result.length, totalPages: Math.ceil(result.length / limit) } 
          }
        : (result as PaginationResult<Permission>);
      
      return {
        data: paginatedData.data.map((permission: Permission) => this.mapToResponseDto(permission)),
        pagination: paginatedData.pagination
      };
    } catch (error) {
      this.logger.error('Error in PermissionService.findAll', { error, options });
      throw error;
    }
  }

  /**
   * Gets the repository instance
   * This allows direct repository access when needed for specific operations
   * 
   * @returns The repository instance
   */
  public getRepository(): IPermissionRepository {
    return this.permissionRepository;
  }
  
  /**
   * Seeds default permissions into the database if not already present
   * This should be called during application initialization
   * 
   * @returns Promise indicating success
   */
  public async seedDefaultPermissions(): Promise<boolean> {
    try {
      this.logger.info('Initiating permission seeding...');
      await this.permissionRepository.seedDefaultPermissions();
      this.logger.info('Default permissions seeded successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to seed default permissions', { error });
      return false;
    }
  }

  /**
   * Finds a permission by code
   * 
   * @param code - Permission code
   * @param options - Service options
   * @returns Found permission or null
   */
  async findByCode(code: string, options?: ServiceOptions): Promise<PermissionResponseDto | null> {
    try {
      const permission = await this.permissionRepository.findByCode(code);
      if (!permission) return null;
      
      return this.mapToResponseDto(permission);
    } catch (error) {
      this.logger.error('Error in PermissionService.findByCode', { error, code });
      throw error;
    }
  }

  /**
   * Finds permissions with advanced filtering
   * 
   * @param filters - Filter parameters
   * @param options - Service options
   * @returns Found permissions with pagination
   */
  async findPermissions(filters: PermissionFilterParamsDto, options?: ServiceOptions): 
    Promise<PaginationResult<PermissionResponseDto>> {
    try {
      const result = await this.permissionRepository.findPermissions(filters);
      
      return {
        data: result.data.map(permission => this.mapToResponseDto(permission)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error in PermissionService.findPermissions', { error, filters });
      throw error;
    }
  }

  /**
   * Gets all permissions for a user
   * 
   * @param userId - User ID
   * @param options - Service options
   * @returns User's permissions
   */
  async getUserPermissions(userId: number, options?: ServiceOptions): Promise<UserPermissionsResponseDto> {
    try {
      // First, check if the user exists and get their role
      const userService = options?.context?.serviceFactory?.createUserService();
      let userRole = 'user'; // Default role
      
      if (userService) {
        const user = await userService.getById(userId);
        if (user) {
          userRole = user.role.toLowerCase();
        }
      }
      
      // Get permissions for the user
      const permissions = await this.permissionRepository.getUserPermissions(userId);
      
      return {
        userId,
        role: userRole,
        permissions
      };
    } catch (error) {
      this.logger.error('Error in PermissionService.getUserPermissions', { error, userId });
      throw error;
    }
  }

  /**
   * Updates permissions for a user
   * 
   * @param data - Update data
   * @param options - Service options
   * @returns Whether the operation was successful
   */
  async updateUserPermissions(data: UpdateUserPermissionsDto, options?: ServiceOptions): Promise<boolean> {
    try {
      // Validate that all permissions are valid
      const invalidPermissions = await this.validatePermissions(data.permissions);
      if (invalidPermissions.length > 0) {
        throw this.errorHandler.createValidationError(
          `Invalid permissions: ${invalidPermissions.join(', ')}`
        );
      }
      
      // Update the permissions
      const result = await this.permissionRepository.updateUserPermissions(
        data.userId, 
        data.permissions,
        options?.context?.userId
      );
      
      // Invalidate permission cache for this user if the update was successful
      if (result) {
        await this.invalidateUserPermissionCache(data.userId);
      }
      
      return result;
    } catch (error) {
      this.logger.error('Error in PermissionService.updateUserPermissions', { error, data });
      throw error;
    }
  }

  /**
   * Validates that all permission codes exist
   * 
   * @param permissions - Permission codes to validate
   * @returns List of invalid permission codes
   */
  private async validatePermissions(permissions: string[]): Promise<string[]> {
    try {
      const invalidPermissions: string[] = [];
      
      for (const code of permissions) {
        const permission = await this.permissionRepository.findByCode(code);
        if (!permission) {
          invalidPermissions.push(code);
        }
      }
      
      return invalidPermissions;
    } catch (error) {
      this.logger.error('Error validating permissions', { error, permissions });
      throw error;
    }
  }

  /**
   * Adds a permission to a user
   * 
   * @param userId - User ID
   * @param permissionCode - Permission code
   * @param options - Service options
   * @returns Whether the operation was successful
   */
  async addUserPermission(userId: number, permissionCode: string, options?: ServiceOptions): Promise<boolean> {
    try {
      const result = await this.permissionRepository.addUserPermission(
        userId, 
        permissionCode,
        options?.context?.userId
      );
      
      // Invalidate permission cache for this user
      await this.invalidateUserPermissionCache(userId);
      
      return true;
    } catch (error) {
      this.logger.error('Error in PermissionService.addUserPermission', { error, userId, permissionCode });
      throw error;
    }
  }

  /**
   * Removes a permission from a user
   * 
   * @param userId - User ID
   * @param permissionCode - Permission code
   * @param options - Service options
   * @returns Whether the operation was successful
   */
  async removeUserPermission(userId: number, permissionCode: string, options?: ServiceOptions): Promise<boolean> {
    try {
      const result = await this.permissionRepository.removeUserPermission(userId, permissionCode);
      
      // Invalidate permission cache for this user if the removal was successful
      if (result) {
        await this.invalidateUserPermissionCache(userId);
      }
      
      return result;
    } catch (error) {
      this.logger.error('Error in PermissionService.removeUserPermission', { error, userId, permissionCode });
      throw error;
    }
  }

  /**
   * Checks if a user has a specific permission
   * 
   * @param userId - User ID
   * @param permissionCode - Permission code
   * @param options - Service options
   * @returns Whether the user has the permission
   */
  async hasPermission(userId: number, permissionCode: string, options?: ServiceOptions): Promise<boolean> {
    try {
      return await this.permissionRepository.hasPermission(userId, permissionCode);
    } catch (error) {
      this.logger.error('Error in PermissionService.hasPermission', { error, userId, permissionCode });
      throw error;
    }
  }

  /**
   * Gets the default permissions for a role
   * 
   * @param role - User role
   * @param options - Service options
   * @returns Default permissions for the role
   */
  async getDefaultPermissionsForRole(role: string, options?: ServiceOptions): Promise<string[]> {
    try {
      this.logger.debug(`Getting default permissions for role: ${role}`);
      
      // Normalize role name to lowercase for case-insensitive comparison
      const normalizedRole = role.toLowerCase();
      
      // Get the default permissions for the role from the enum
      const permissions = getPermissionsForRole(normalizedRole);
      
      this.logger.debug(`Found ${permissions.length} default permissions for role ${role}`);
      
      return permissions;
    } catch (error) {
      this.logger.error('Error in PermissionService.getDefaultPermissionsForRole', { 
        error: error instanceof Error ? error.message : String(error),
        role 
      });
      throw error;
    }
  }

  /**
   * Creates a new permission
   * 
   * @param data - Permission creation data
   * @param options - Service options
   * @returns Created permission
   */
  async create(data: CreatePermissionDto, options?: ServiceOptions): Promise<PermissionResponseDto> {
    try {
      // Check if permission code already exists
      const existingPermission = await this.permissionRepository.findByCode(data.code);
      if (existingPermission) {
        throw this.errorHandler.createValidationError(`Permission with code ${data.code} already exists`);
      }
      
      // Create permission
      const permission = await this.permissionRepository.create({
        ...data,
        createdBy: options?.context?.userId,
        updatedBy: options?.context?.userId
      });
      
      return this.mapToResponseDto(permission);
    } catch (error) {
      this.logger.error('Error in PermissionService.create', { error, data });
      throw error;
    }
  }

  /**
   * Updates a permission
   * 
   * @param id - Permission ID
   * @param data - Permission update data
   * @param options - Service options
   * @returns Updated permission
   */
  async update(id: number, data: UpdatePermissionDto, options?: ServiceOptions): Promise<PermissionResponseDto> {
    try {
      // Check if permission exists
      const existingPermission = await this.permissionRepository.findById(id);
      if (!existingPermission) {
        throw this.errorHandler.createNotFoundError('Permission not found');
      }
      
      // Update permission
      const permission = await this.permissionRepository.update(id, {
        ...data,
        updatedBy: options?.context?.userId
      });
      
      return this.mapToResponseDto(permission);
    } catch (error) {
      this.logger.error('Error in PermissionService.update', { error, id, data });
      throw error;
    }
  }

  /**
   * Deletes a permission
   * 
   * @param id - Permission ID
   * @param options - Service options
   * @returns Whether the operation was successful
   */
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      // Check if permission exists
      const existingPermission = await this.permissionRepository.findById(id);
      if (!existingPermission) {
        throw this.errorHandler.createNotFoundError('Permission not found');
      }
      
      // Delete permission
      return await this.permissionRepository.delete(id);
    } catch (error) {
      this.logger.error('Error in PermissionService.delete', { error, id });
      throw error;
    }
  }

  /**
   * Gets all permissions
   * 
   * @param options - Service options
   * @returns All permissions with pagination
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<PermissionResponseDto>> {
    return this.findAll(options);
  }

  /**
   * Gets a permission by ID
   * 
   * @param id - Permission ID
   * @param options - Service options
   * @returns Found permission or null
   */
  async getById(id: number, options?: ServiceOptions): Promise<PermissionResponseDto | null> {
    try {
      const permission = await this.permissionRepository.findById(id);
      if (!permission) return null;
      
      return this.mapToResponseDto(permission);
    } catch (error) {
      this.logger.error('Error in PermissionService.getById', { error, id });
      throw error;
    }
  }

  /**
   * Maps a Permission entity to a PermissionResponseDto
   * 
   * @param permission - Permission entity
   * @returns PermissionResponseDto
   */
  public mapToResponseDto(permission: Permission): PermissionResponseDto {
    return this.toDTO(permission);
  }

  /**
   * Maps a domain entity to a DTO
   * 
   * @param entity - Domain entity
   * @returns DTO
   */
  public toDTO(entity: Permission): PermissionResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      category: entity.category,
      createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
      updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt
    };
  }

  /** 
   * Additional BaseService methods
   */
  
  /**
   * Maps a DTO to a domain entity
   * 
   * @param dto - DTO
   * @returns Domain entity
   */
  public fromDTO(dto: any): Permission {
    return new Permission({
      id: dto.id,
      code: dto.code,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      createdAt: typeof dto.createdAt === 'string' ? new Date(dto.createdAt) : dto.createdAt,
      updatedAt: typeof dto.updatedAt === 'string' ? new Date(dto.updatedAt) : dto.updatedAt
    });
  }

  /**
   * Searches for permissions
   * 
   * @param term - Search term
   * @param options - Service options
   * @returns Search results
   */
  async search(term: string, options?: ServiceOptions): Promise<PermissionResponseDto[]> {
    try {
      // Search permissions by code, name, or description
      const result = await this.permissionRepository.findByCriteria({
        OR: [
          { code: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } }
        ]
      });
      
      return result.map(permission => this.mapToResponseDto(permission));
    } catch (error) {
      this.logger.error('Error in PermissionService.search', { error, term });
      throw error;
    }
  }

  /**
   * Checks if a permission exists by ID
   * 
   * @param id - Permission ID
   * @param options - Service options
   * @returns Whether the permission exists
   */
  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const result = await this.permissionRepository.findById(id);
      return !!result;
    } catch (error) {
      this.logger.error('Error in PermissionService.exists', { error, id });
      throw error;
    }
  }
  
  /**
   * Checks if a permission exists by criteria
   * 
   * @param criteria - Search criteria
   * @param options - Service options
   * @returns Whether the permission exists
   */
  async existsByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<boolean> {
    try {
      const result = await this.permissionRepository.findOneByCriteria(criteria);
      return !!result;
    } catch (error) {
      this.logger.error('Error in PermissionService.existsByCriteria', { error, criteria });
      throw error;
    }
  }

  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<PermissionResponseDto[]> {
    try {
      const permissions = await this.permissionRepository.findByCriteria(criteria);
      return permissions.map(permission => this.mapToResponseDto(permission));
    } catch (error) {
      this.logger.error('Error in PermissionService.findByCriteria', { error, criteria });
      throw error;
    }
  }

  async validate(data: any, schema: any): Promise<any> {
    return this.validator.validate(data, schema);
  }

  async transaction<T>(callback: (service: any) => Promise<T>): Promise<T> {
    return callback(this);
  }

  async bulkUpdate(ids: number[], data: Partial<Permission>): Promise<number> {
    // Not implemented yet
    return 0;
  }
}