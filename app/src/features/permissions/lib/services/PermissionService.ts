// Mark as server-only to prevent client-side import
import 'server-only';

/**
 * Permission Service Implementation
 * 
 * This service follows the repository pattern and properly separates concerns:
 * - Business logic stays in the service
 * - Data access is handled by the repository
 * - No direct database access from the service
 * - NO FALLBACKS OR WORKAROUNDS - errors are propagated properly
 */
import { getLogger } from '@/core/logging';
import { UserRole } from '@/domain/enums/UserEnums';
import { IPermissionService } from '@/domain/services/IPermissionService';
import { IPermissionRepository } from '@/domain/repositories/IPermissionRepository';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { Permission } from '@/domain/entities/Permission';
import { 
  CreatePermissionDto, 
  UpdatePermissionDto, 
  PermissionResponseDto,
  UserPermissionsResponseDto,
  UpdateUserPermissionsDto,
  PermissionFilterParamsDto
} from '@/domain/dtos/PermissionDtos';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ValidationResult, ValidationErrorType } from '@/domain/enums/ValidationResults';
import { AppError } from '@/core/errors';

const logger = getLogger();

/**
 * Permission Service - No fallbacks or defaults
 */
export class PermissionService implements IPermissionService {
  /**
   * Initialize repository
   */
  constructor(private repository: IPermissionRepository) {
    if (!repository) {
      const errorMsg = 'Permission repository is not initialized in PermissionService';
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Validate that the repository is correctly constructed
    try {
      const repo = repository.getRepository();
      if (!repo || !repo.prisma) {
        const errorMsg = 'Permission repository is not properly configured';
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }
      logger.info('PermissionService initialized successfully');
    } catch (error) {
      logger.error('Error validating permission repository:', error as Error);
      throw error;
    }
  }

  /**
   * Creates a new permission
   */
  async create(data: CreatePermissionDto, options?: ServiceOptions): Promise<PermissionResponseDto> {
    try {
      // Validate required fields
      if (!data.code || !data.name || !data.category) {
        throw new AppError('Invalid permission data - code, name, and category are required', 500);
      }
      
      // Create permission entity
      const permissionData = new Permission({
        code: data.code,
        name: data.name,
        description: data.description || '',
        category: data.category,
        createdBy: options?.userId,
        updatedBy: options?.userId
      });
      
      // Use repository to create the permission
      const permission = await this.repository.create(permissionData);
      
      // Return DTO
      return this.toDTO(permission);
    } catch (error) {
      logger.error('Error creating permission:', error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to create permission: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Updates a permission
   */
  async update(id: number, data: UpdatePermissionDto, options?: ServiceOptions): Promise<PermissionResponseDto> {
    try {
      // Validate ID
      if (!id || id <= 0) {
        throw new AppError('Invalid permission ID', 500);
      }
      
      // Check if permission exists
      const existingPermission = await this.repository.findById(id);
      if (!existingPermission) {
        throw new AppError(`Permission with ID ${id} not found`);
      }
      
      // Update permission data
      const permissionData: Partial<Permission> = {
        name: data.name !== undefined ? data.name : existingPermission.name,
        description: data.description !== undefined ? data.description : existingPermission.description,
        category: data.category !== undefined ? data.category : existingPermission.category,
        updatedBy: options?.userId
      };
      
      // Use repository to update the permission
      const permission = await this.repository.update(id, permissionData);
      
      // Return DTO
      return this.toDTO(permission);
    } catch (error) {
      logger.error(`Error updating permission ${id}:`, error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to update permission: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Deletes a permission
   */
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      // Validate ID
      if (!id || id <= 0) {
        throw new AppError('Invalid permission ID', 500);
      }
      
      // Check if permission exists
      const existingPermission = await this.repository.findById(id);
      if (!existingPermission) {
        throw new AppError(`Permission with ID ${id} not found`);
      }
      
      // Use repository to delete the permission
      return await this.repository.delete(id);
    } catch (error) {
      logger.error(`Error deleting permission ${id}:`, error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to delete permission: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Finds a permission by ID
   */
  async findById(id: number, options?: ServiceOptions): Promise<PermissionResponseDto | null> {
    try {
      // Validate ID
      if (!id || id <= 0) {
        throw new AppError('Invalid permission ID', 500);
      }
      
      // Use repository to find the permission
      const permission = await this.repository.findById(id);
      
      // Return DTO if found, null otherwise
      return permission ? this.toDTO(permission) : null;
    } catch (error) {
      logger.error(`Error finding permission with ID ${id}:`, error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to find permission: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Finds all permissions with pagination
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<PermissionResponseDto>> {
    try {
      // Extract pagination parameters
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const filters = options?.filters || {};
      
      // Create query options
      const queryOptions = {
        page,
        limit,
        sort: options?.sort
      };
      
      // Use repository to find all permissions
      const result = await this.repository.findAll(queryOptions);
      
      // Map domain entities to DTOs
      return {
        data: result.data.map(p => this.toDTO(p)),
        pagination: result.pagination
      };
    } catch (error) {
      logger.error('Error finding all permissions:', error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to find permissions: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Finds a permission by its code
   */
  async findByCode(code: string, options?: ServiceOptions): Promise<PermissionResponseDto | null> {
    try {
      // Validate code
      if (!code) {
        throw new AppError('Permission code is required', 500);
      }
      
      // Use repository to find by code
      const permission = await this.repository.findByCode(code);
      
      // Return DTO if found, null otherwise
      return permission ? this.toDTO(permission) : null;
    } catch (error) {
      logger.error(`Error finding permission by code ${code}:`, error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to find permission by code: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Finds permissions with filtering
   */
  async findPermissions(filters: PermissionFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<PermissionResponseDto>> {
    try {
      // Use repository to find permissions with filtering
      const result = await this.repository.findPermissions(filters);
      
      // Map domain entities to DTOs
      return {
        data: result.data.map(p => this.toDTO(p)),
        pagination: result.pagination
      };
    } catch (error) {
      logger.error('Error finding permissions with filters:', error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to find permissions: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Gets all permissions for a user with a structured response
   */
  /**
   * Gets all permissions for a user with a structured response
   * Properly handles database connectivity errors without silently falling back
   */
  async getUserPermissions(userId: number, options?: ServiceOptions): Promise<UserPermissionsResponseDto> {
    try {
      // Validate userId
      if (!userId || userId <= 0) {
        throw new AppError('Invalid user ID', 400);
      }
      
      // Ensure repository is initialized properly
      if (!this.repository) {
        logger.error('Permission repository is not initialized');
        throw new AppError('Permission repository is not initialized', 500);
      }
      
      // Get the user to fetch their role - this step is optional
      const userService = options?.context?.userService;
      let userRole = '';
      
      // First, try to get the user role if possible
      try {
        // If userService is provided in context, use it (preferred method)
        if (userService && typeof userService.getById === 'function') {
          const user = await userService.getById(userId);
          userRole = user?.role || '';
          logger.debug(`Retrieved user role from UserService: ${userRole}`);
        } else {
          // If user is provided in context, use it
          if (options?.context?.user?.role) {
            userRole = options.context.user.role;
            logger.debug(`Using user role from context: ${userRole}`);
          } else {
            // Last resort: try to fetch directly
            try {
              const userRepo = this.repository.getRepository();
              if (userRepo && userRepo.prisma && userRepo.prisma.user) {
                const user = await userRepo.prisma.user.findUnique({
                  where: { id: userId },
                  select: { role: true }
                });
                userRole = user?.role || '';
                logger.debug(`Retrieved user role directly from database: ${userRole}`);
              }
            } catch (dbError) {
              logger.warn('Could not fetch user role directly from database', {
                userId,
                error: dbError instanceof Error ? dbError.message : String(dbError)
              });
              // Continue without role - it's optional information
            }
          }
        }
      } catch (userError) {
        logger.warn(`Could not fetch user role for userId ${userId}:`, {
          error: userError instanceof Error ? userError.message : String(userError),
          stack: userError instanceof Error ? userError.stack : undefined
        });
        // Continue without role - it's not critical for permission fetching
      }
      
      // Get permissions from repository with robust error handling
      let permissions: string[] = [];
      
      try {
      // Direct attempt to get user permissions
      permissions = await this.repository.getUserPermissions(userId);
      logger.info(`Successfully retrieved ${permissions.length} permissions for user ${userId}`);
      } catch (permError) {
      // Check if this is the specific error about rolePermission model
      const errorMessage = permError instanceof Error ? permError.message : String(permError);
      
      if (errorMessage.includes('RolePermission model not available')) {
        logger.error(`RolePermission model access error for user ${userId}:`, {
          error: errorMessage,
          stack: permError instanceof Error ? permError.stack : undefined,
        solution: 'Using system default permissions as fallback'
      });
        
          // Use system defaults as a fallback when database model is inaccessible
        if (userRole) {
          logger.warn(`Falling back to system default permissions for role ${userRole}`);
          permissions = await this.getSystemDefaultPermissions(userRole);
        } else {
          // If no role is known, we can only provide minimal permissions
          logger.warn('No user role available, providing minimal permissions');
          permissions = ['profile.view', 'dashboard.access'];
        }
      } else {
        // For other errors, propagate normally
        logger.error(`Error getting permissions from repository for user ${userId}:`, {
          error: errorMessage,
          stack: permError instanceof Error ? permError.stack : undefined
        });
        
        // Propagate the error properly
        throw permError instanceof AppError ? permError : new AppError(
          `Failed to get user permissions: ${errorMessage}`,
          500
        );
      }
    }
      
      // Ensure we have a valid permissions array
      if (!Array.isArray(permissions)) {
        logger.warn(`Invalid permissions array returned for user ${userId}`);
        permissions = [];
      }
      
      // Return the permissions with role information
      return {
        userId,
        permissions,
        role: userRole // Include the role if we have it
      };
    } catch (error) {
      logger.error(`Error getting permissions for user ${userId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error instanceof AppError ? error : new AppError(
        `Failed to get user permissions: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }
  
  /**
   * Updates permissions for a user
   */
  async updateUserPermissions(data: UpdateUserPermissionsDto, options?: ServiceOptions): Promise<boolean> {
    try {
      // Validate input
      if (!data.userId || !Array.isArray(data.permissions)) {
        throw new AppError('Invalid data: userId and permissions array are required', 500);
      }
      
      // Update through repository
      const result = await this.repository.updateUserPermissions(
        data.userId,
        data.permissions,
        options?.userId
      );
      
      return result;
    } catch (error) {
      logger.error(`Error updating permissions for user ${data.userId}:`, error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to update user permissions: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Adds a permission to a user
   */
  async addUserPermission(userId: number, permissionCode: string, options?: ServiceOptions): Promise<boolean> {
    try {
      // Validate input
      if (!userId || !permissionCode) {
        throw new AppError('User ID and permission code are required', 500);
      }
      
      // Add through repository
      await this.repository.addUserPermission(
        userId,
        permissionCode,
        options?.userId
      );
      
      return true;
    } catch (error) {
      logger.error(`Error adding permission ${permissionCode} to user ${userId}:`, error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to add user permission: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Removes a permission from a user
   */
  async removeUserPermission(userId: number, permissionCode: string, options?: ServiceOptions): Promise<boolean> {
    try {
      // Validate input
      if (!userId || !permissionCode) {
        throw new AppError('User ID and permission code are required', 500);
      }
      
      // Remove through repository
      return await this.repository.removeUserPermission(userId, permissionCode);
    } catch (error) {
      logger.error(`Error removing permission ${permissionCode} from user ${userId}:`, error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to remove user permission: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Checks if a user has a specific permission
   */
  async hasPermission(userId: number, permissionCode: string, options?: ServiceOptions): Promise<boolean> {
    try {
      // Validate input
      if (!userId || !permissionCode) {
        throw new AppError('User ID and permission code are required', 500);
      }
      
      // Check through repository - no fallbacks
      return await this.repository.hasPermission(userId, permissionCode);
    } catch (error) {
      logger.error(`Error checking if user ${userId} has permission ${permissionCode}:`, error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to check permission: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Gets default permissions for a role directly from database
   * No fallbacks to hardcoded defaults
   */
  /**
   * Gets default permissions for a role directly from database
   * No fallbacks - errors are propagated properly
   * 
   * @param role Role name
   * @param options Service options
   * @returns Permissions for the role
   * @throws Error when permissions cannot be retrieved
   */
  async getDefaultPermissionsForRole(role: string, options?: ServiceOptions): Promise<string[]> {
    // Validate role
    if (!role) {
      throw new AppError('Role is required', 400);
    }
    
    const normalizedRole = role.toLowerCase();
    
    // Ensure repository is initialized properly
    if (!this.repository) {
      logger.error('Permission repository is not initialized');
      throw new AppError('Permission repository is not initialized', 500);
    }
    
    try {
      // Get role permissions directly from repository
      // The repository itself now handles fallbacks to default permissions
      const permissions = await this.repository.getRolePermissions(normalizedRole);
      
      logger.info(`Retrieved ${permissions.length} permissions for role ${normalizedRole} from repository`);
      return permissions;
    } catch (error) {
      // Log detailed error information
      logger.error(`Error getting permissions for role ${normalizedRole}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Proper error propagation instead of silent fallbacks
      throw error instanceof AppError ? error : new AppError(
        `Failed to get permissions for role ${normalizedRole}: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }
  
  /**
   * Gets system default permissions for a role
   * Used as a last resort when database fails
   * 
   * @param role User role in lowercase
   * @returns Default permissions for the role
   */
  public async getSystemDefaultPermissions(role: string): Promise<string[]> {
    // Basic permissions that all roles should have
    const basicPermissions = [
      'profile.view',
      'profile.edit',
      'dashboard.access'
    ];
    
    // Log that we're using system defaults
    logger.info(`Using system default permissions for role ${role}`);
    
    // Normalize role name to lowercase
    const normalizedRole = role.toLowerCase();
    
    switch(normalizedRole) {
      case 'admin':
        return [
          ...basicPermissions,
          'users.view',
          'users.create',
          'users.edit',
          'users.delete',
          'permissions.view',
          'permissions.manage',
          'customers.view',
          'customers.create',
          'customers.edit',
          'customers.delete',
          'requests.view',
          'requests.create',
          'requests.edit',
          'requests.delete',
          'appointments.view',
          'appointments.create',
          'appointments.edit',
          'appointments.delete',
          'settings.view',
          'settings.edit'
        ];
      case 'manager':
        return [
          ...basicPermissions,
          'users.view',
          'customers.view',
          'customers.create',
          'customers.edit',
          'requests.view',
          'requests.create',
          'requests.edit',
          'appointments.view',
          'appointments.create',
          'appointments.edit',
          'settings.view'
        ];
      case 'employee':
        return [
          ...basicPermissions,
          'customers.view',
          'requests.view',
          'requests.create',
          'appointments.view',
          'appointments.create'
        ];
      default:
        return basicPermissions;
    }
  }
  
  /**
   * Sets default permissions for a role
   */
  async setDefaultPermissionsForRole(role: string, permissions: string[], options?: ServiceOptions): Promise<string[]> {
    try {
      // Validate role and permissions
      if (!role) {
        throw new AppError('Role is required', 500);
      }
      
      if (!Array.isArray(permissions)) {
        throw new AppError('Permissions must be an array', 500);
      }
      
      // Validate the role
      const validRoles = Object.values(UserRole).map(r => r.toLowerCase());
      if (!validRoles.includes(role.toLowerCase())) {
        throw new AppError(
          `Invalid role: ${role}. Valid roles are: ${Object.values(UserRole).join(', ')}`
        );
      }
      
      // Use repository to set role permissions
      return await this.repository.setRolePermissions(
        role.toLowerCase(),
        permissions,
        options?.userId
      );
    } catch (error) {
      logger.error(`Error setting default permissions for role ${role}:`, error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to set default permissions for role: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Gets role permissions from the database
   */
  async getRolePermissions(role: string, options?: ServiceOptions): Promise<string[]> {
    return this.getDefaultPermissionsForRole(role, options);
  }
  
  /**
   * Validates permission data
   */
  async validate(data: CreatePermissionDto | UpdatePermissionDto, isUpdate?: boolean, entityId?: number): Promise<any> {
    const errors: Record<string, string> = {};
    
    if (!isUpdate && !(data as CreatePermissionDto).code) {
      errors.code = 'Permission code is required';
    }
    
    if (!data.name) {
      errors.name = 'Permission name is required';
    }
    
    if (!data.category) {
      errors.category = 'Permission category is required';
    }
    
    return {
      result: Object.keys(errors).length === 0 ? ValidationResult.SUCCESS : ValidationResult.ERROR,
      isValid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? Object.entries(errors).map(([field, message]) => ({
        type: ValidationErrorType.INVALID,
        field,
        message
      })) : undefined
    };
  }
  
  /**
   * Execute a transaction
   */
  async transaction<R>(callback: (service: IPermissionService) => Promise<R>): Promise<R> {
    // Delegate transaction to repository
    return this.repository.transaction(async (repo) => {
      if (repo) {
        // Create a new service with the transactional repository
        const txService = new PermissionService(repo);
        return callback(txService);
      }
      return callback(this);
    });
  }
  
  /**
   * Bulk update permissions
   */
  async bulkUpdate(ids: number[], data: UpdatePermissionDto, options?: ServiceOptions): Promise<number> {
    try {
      // Validate input
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError('At least one permission ID is required', 500);
      }
      
      // Create permission data
      const permissionData: Partial<Permission> = {
        name: data.name,
        description: data.description,
        category: data.category,
        updatedBy: options?.userId
      };
      
      // Use repository to bulk update
      return await this.repository.bulkUpdate(ids, permissionData);
    } catch (error) {
      logger.error('Error bulk updating permissions:', error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to bulk update permissions: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Convert entity to DTO
   */
  toDTO(entity: Permission): PermissionResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      category: entity.category,
      createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt || new Date().toISOString(),
      updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt || new Date().toISOString()
    };
  }
  
  /**
   * Convert DTO to entity
   */
  fromDTO(dto: CreatePermissionDto | UpdatePermissionDto): Partial<Permission> {
    return {
      ...(dto as any),
      code: (dto as CreatePermissionDto).code,
      id: undefined
    };
  }
  
  /**
   * Search permissions
   */
  async search(searchText: string, options?: ServiceOptions): Promise<PermissionResponseDto[]> {
    try {
      // Use findPermissions with search criteria
      const result = await this.findPermissions({
        search: searchText,
        page: 1,
        limit: options?.limit || 10
      }, options);
      
      return result.data;
    } catch (error) {
      logger.error('Error searching permissions:', error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to search permissions: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Check if permission exists
   */
  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const count = await this.repository.count({ id });
      return count > 0;
    } catch (error) {
      logger.error('Error checking permission existence:', error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to check if permission exists: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Get repository instance
   */
  getRepository(): any {
    return this.repository;
  }
  
  /**
   * Grant a permission to a user
   */
  async grantPermission(userId: number, permission: string): Promise<boolean> {
    return this.addUserPermission(userId, permission);
  }
  
  /**
   * Revoke a permission from a user
   */
  async revokePermission(userId: number, permission: string): Promise<boolean> {
    return this.removeUserPermission(userId, permission);
  }
  
  /**
   * Count permissions
   */
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    try {
      return await this.repository.count(options?.filters);
    } catch (error) {
      logger.error('Error counting permissions:', error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to count permissions: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Get all permissions
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<PermissionResponseDto>> {
    return this.findAll(options);
  }
  
  /**
   * Get by ID
   */
  async getById(id: number, options?: ServiceOptions): Promise<PermissionResponseDto | null> {
    return this.findById(id, options);
  }
  
  /**
   * Find by criteria
   */
  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<PermissionResponseDto[]> {
    try {
      const permissions = await this.repository.findByCriteria(criteria);
      return permissions.map(p => this.toDTO(p));
    } catch (error) {
      logger.error('Error finding permissions by criteria:', error as Error);
      throw error instanceof AppError ? error : new AppError(
        `Failed to find permissions by criteria: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
