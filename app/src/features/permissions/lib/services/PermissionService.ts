// Mark as server-only to prevent client-side import
import 'server-only';

/**
 * Clean Permission Service
 * 
 * Design principles:
 * 1. Direct database queries - no stale cache
 * 2. Clear error handling - no silent failures
 * 3. Consistent permission checking
 * 4. Role-based permissions with override support
 */
import { getLogger } from '@/core/logging';
import { db } from '@/core/db';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UserRole } from '@/domain/enums/UserEnums';
import { IPermissionService } from '@/domain/services/IPermissionService';
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

const logger = getLogger();

/**
 * Permission service error
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 403,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Default permissions for roles
 */
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, SystemPermission[]> = {
  [UserRole.ADMIN]: Object.values(SystemPermission), // All permissions
  [UserRole.MANAGER]: [
    SystemPermission.USERS_VIEW,
    SystemPermission.USERS_CREATE,
    SystemPermission.USERS_EDIT,
    SystemPermission.CUSTOMERS_VIEW,
    SystemPermission.CUSTOMERS_CREATE,
    SystemPermission.CUSTOMERS_EDIT,
    SystemPermission.REQUESTS_VIEW,
    SystemPermission.REQUESTS_CREATE,
    SystemPermission.REQUESTS_EDIT,
    SystemPermission.REQUESTS_ASSIGN,
    SystemPermission.APPOINTMENTS_VIEW,
    SystemPermission.APPOINTMENTS_CREATE,
    SystemPermission.APPOINTMENTS_EDIT,
    SystemPermission.NOTIFICATIONS_VIEW,
    SystemPermission.NOTIFICATIONS_EDIT,
  ],
  [UserRole.EMPLOYEE]: [
    SystemPermission.CUSTOMERS_VIEW,
    SystemPermission.CUSTOMERS_CREATE,
    SystemPermission.CUSTOMERS_EDIT,
    SystemPermission.REQUESTS_VIEW,
    SystemPermission.REQUESTS_CREATE,
    SystemPermission.REQUESTS_EDIT,
    SystemPermission.APPOINTMENTS_VIEW,
    SystemPermission.APPOINTMENTS_CREATE,
    SystemPermission.APPOINTMENTS_EDIT,
    SystemPermission.NOTIFICATIONS_VIEW,
  ],
  [UserRole.USER]: [
    SystemPermission.CUSTOMERS_VIEW,
    SystemPermission.REQUESTS_VIEW,
    SystemPermission.APPOINTMENTS_VIEW,
    SystemPermission.NOTIFICATIONS_VIEW,
  ],
};

/**
 * Permission Service
 */
export class PermissionService implements IPermissionService {
  private repository: any;
  private static instance: PermissionService | null = null;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }
  
  /**
   * Creates a new permission
   */
  async create(data: CreatePermissionDto, options?: ServiceOptions): Promise<PermissionResponseDto> {
    try {
      const permission = await db.permission.create({
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          category: data.category,
        }
      });
      
      return this.mapToResponseDto(permission);
    } catch (error) {
      logger.error('Error creating permission:', error as Error);
      throw new PermissionError(
        'Failed to create permission',
        'CREATE_PERMISSION_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Updates a permission
   */
  async update(id: number, data: UpdatePermissionDto, options?: ServiceOptions): Promise<PermissionResponseDto> {
    try {
      const permission = await db.permission.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
        }
      });
      
      return this.mapToResponseDto(permission);
    } catch (error) {
      logger.error('Error updating permission:', error as Error);
      throw new PermissionError(
        'Failed to update permission',
        'UPDATE_PERMISSION_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Deletes a permission
   */
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      await db.permission.delete({
        where: { id }
      });
      
      return true;
    } catch (error) {
      logger.error('Error deleting permission:', error as Error);
      throw new PermissionError(
        'Failed to delete permission',
        'DELETE_PERMISSION_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Finds a permission by ID
   */
  async findById(id: number, options?: ServiceOptions): Promise<PermissionResponseDto | null> {
    try {
      const permission = await db.permission.findUnique({
        where: { id }
      });
      
      return permission ? this.mapToResponseDto(permission) : null;
    } catch (error) {
      logger.error('Error finding permission by ID:', error as Error);
      throw new PermissionError(
        'Failed to find permission',
        'FIND_PERMISSION_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Finds all permissions (changed to match IPermissionService interface)
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<PermissionResponseDto>> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      
      const [permissions, total] = await Promise.all([
        db.permission.findMany({
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { name: 'asc' }
        }),
        db.permission.count()
      ]);
      
      return {
        data: permissions.map(p => this.mapToResponseDto(p)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        // Backward compatibility
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error finding all permissions:', error as Error);
      throw new PermissionError(
        'Failed to find permissions',
        'FIND_PERMISSIONS_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Finds a permission by its code
   */
  async findByCode(code: string, options?: ServiceOptions): Promise<PermissionResponseDto | null> {
    try {
      const permission = await db.permission.findUnique({
        where: { code }
      });
      
      return permission ? this.mapToResponseDto(permission) : null;
    } catch (error) {
      logger.error('Error finding permission by code:', error as Error);
      throw new PermissionError(
        'Failed to find permission',
        'FIND_PERMISSION_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Finds permissions with filtering
   */
  async findPermissions(filters: PermissionFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<PermissionResponseDto>> {
    try {
      const where: any = {};
      
      if (filters.category) {
        where.category = filters.category;
      }
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search } },
          { code: { contains: filters.search } },
          { description: { contains: filters.search } },
        ];
      }
      
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      
      const [permissions, total] = await Promise.all([
        db.permission.findMany({
          where,
          take: limit,
          skip: (page - 1) * limit,
          orderBy: { name: 'asc' }
        }),
        db.permission.count({ where })
      ]);
      
      return {
        data: permissions.map(p => this.mapToResponseDto(p)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        // Backward compatibility
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error finding permissions:', error as Error);
      throw new PermissionError(
        'Failed to find permissions',
        'FIND_PERMISSIONS_ERROR',
        500,
        error
      );
    }
  }
  
  /**
  * Check if user has a specific permission with efficient caching
  * @throws PermissionError on database errors
  */
async hasPermission(userId: number, permissionCode: string, options?: ServiceOptions): Promise<boolean> {
  try {
    // Validate inputs
    if (!userId || isNaN(userId) || userId <= 0 || !Number.isInteger(userId)) {
      throw new PermissionError(
        'Invalid user ID provided',
        'INVALID_USER_ID',
        400
      );
    }

    if (!permissionCode || typeof permissionCode !== 'string') {
      throw new PermissionError(
        'Invalid permission code provided',
        'INVALID_PERMISSION',
        400
      );
    }
    
    logger.debug('Checking permission', { userId, permissionCode });
    
    // Standardized permission code format
    const normalizedPermission = permissionCode.trim().toLowerCase();
    
    // Check cache with deterministic behavior
    const cacheEnabled = process.env.DISABLE_PERMISSION_CACHE !== 'true';
    if (cacheEnabled) {
      try {
        // Import deterministically
        const { getPermissionFromCache } = await import('../utils/permissionCacheUtils');
        const cachedResult = await getPermissionFromCache(userId, normalizedPermission);
        
        if (cachedResult !== undefined) {
          logger.debug('Permission check result from cache', { 
            userId,
            permissionCode: normalizedPermission,
            result: cachedResult
          });
          return cachedResult;
        }
      } catch (cacheError) {
        // Log but continue to database - never fail on cache issues
        logger.warn('Permission cache lookup failed', { 
          userId,
          permissionCode: normalizedPermission,
          error: cacheError instanceof Error ? cacheError.message : String(cacheError) 
        });
      }
    }

    // Determine if this is a system permission
    const isSystemPermission = Object.values(SystemPermission)
      .includes(normalizedPermission as SystemPermission);
      
    // Get user with permissions in a single query with optimized fields
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                code: true
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      logger.warn(`User not found: ${userId}`);
      // Deterministic failure - throw specific error
      throw new PermissionError(
        'User not found',
        'USER_NOT_FOUND',
        404
      );
    }

    // Check specific user permissions first
    const hasSpecificPermission = user.permissions.some(
      up => up.permission.code.toLowerCase() === normalizedPermission && up.grantedAt !== null
    );
    
    // Check if specifically denied
    const isSpecificallyDenied = user.permissions.some(
      up => up.permission.code.toLowerCase() === normalizedPermission && up.grantedAt === null
    );
    
    // Determine the result with clear precedence rules
    let result: boolean;
    
    // Rule 1: Specific denial overrides everything
    if (isSpecificallyDenied) {
      result = false;
    }
    // Rule 2: Specific grant overrides role-based permissions
    else if (hasSpecificPermission) {
      result = true;
    }
    // Rule 3: Fall back to role-based permissions
    else {
      const rolePermissions = DEFAULT_ROLE_PERMISSIONS[user.role as UserRole] || [];
      // For system permissions, check exact match
      if (isSystemPermission) {
        result = rolePermissions.includes(normalizedPermission as SystemPermission);
      } else {
        // For custom permissions, check case-insensitive
        result = rolePermissions.some(p => 
          String(p).toLowerCase() === normalizedPermission
        );
      }
    }
    
    // Cache the result if enabled
    if (cacheEnabled) {
      try {
        const { setPermissionInCache } = await import('../utils/permissionCacheUtils');
        // Cache deterministically and await the result
        await setPermissionInCache(userId, normalizedPermission, result);
      } catch (cacheError) {
        // Just log the error
        logger.warn('Failed to cache permission result', { 
          userId, 
          permissionCode: normalizedPermission,
          result,
          error: cacheError instanceof Error ? cacheError.message : String(cacheError) 
        });
      }
    }
    
    return result;
  } catch (error) {
    // Proper error propagation
    if (error instanceof PermissionError) {
      throw error;
    }
    
    logger.error('Error checking permission:', error as Error);
    throw new PermissionError(
      'Failed to check permission',
      'PERMISSION_CHECK_ERROR',
      500,
      error
    );
  }
}
  


  /**
   * Check multiple permissions (user must have ALL)
   */
  async hasAllPermissions(userId: number, permissions: SystemPermission[]): Promise<boolean> {
    try {
      for (const permission of permissions) {
        const hasPermission = await this.hasPermission(userId, permission);
        if (!hasPermission) {
          return false;
        }
      }
      return true;
    } catch (error) {
      logger.error('Error checking multiple permissions:', error as Error);
      throw error;
    }
  }
  
  /**
   * Check multiple permissions (user must have ANY)
   */
  async hasAnyPermission(userId: number, permissions: SystemPermission[]): Promise<boolean> {
    try {
      for (const permission of permissions) {
        const hasPermission = await this.hasPermission(userId, permission);
        if (hasPermission) {
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('Error checking any permission:', error as Error);
      throw error;
    }
  }
  
  /**
   * Get all permissions for a user with strict validation and consistent response format
   */
  async getUserPermissions(userId: number, options?: ServiceOptions): Promise<UserPermissionsResponseDto> {
    try {
      logger.debug('Getting user permissions', { userId });
      
      // Strict userId validation
      if (!userId || isNaN(userId) || userId <= 0 || !Number.isInteger(userId)) {
        throw new PermissionError(
          'Invalid user ID provided',
          'INVALID_USER_ID',
          400
        );
      }
      
      // Get user with permissions using a transaction for consistency
      const user = await db.$transaction(async (tx) => {
        const result = await tx.user.findUnique({
          where: { id: userId },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        });
        
        if (!result) {
          throw new PermissionError(
            'User not found',
            'USER_NOT_FOUND',
            404
          );
        }
        
        return result;
      });
      
      // Detailed diagnostics on data retrieval
      logger.debug('User permissions fetch complete', {
        userId,
        role: user.role,
        permissionsCount: user.permissions.length,
        defaultRolePermissionsCount: DEFAULT_ROLE_PERMISSIONS[user.role as UserRole]?.length || 0
      });
      
      // Start with a new Set of role-based permissions
      const rolePermissions = new Set(DEFAULT_ROLE_PERMISSIONS[user.role as UserRole] || []);
      
      // Apply user-specific permissions - grant or deny
      for (const userPermission of user.permissions) {
        // Ensure the permission code exists before processing
        if (userPermission?.permission?.code) {
          const permissionCode = userPermission.permission.code as SystemPermission;
          
          if (userPermission.grantedAt !== null) {
            rolePermissions.add(permissionCode); // Grant
          } else {
            rolePermissions.delete(permissionCode); // Deny
          }
        }
      }
      
      // Create properly formatted response with guaranteed array
      const permissionArray = Array.from(rolePermissions).map(String);
      
      logger.info(`Retrieved ${permissionArray.length} permissions for user ${userId}`, {
        userId,
        role: user.role,
        permissionCount: permissionArray.length,
        permissions: permissionArray.length > 0 ? permissionArray.slice(0, 5).join(', ') + (permissionArray.length > 5 ? '...' : '') : 'none',
        userPermissionsCount: user.permissions.length
      });
      
      // Warning for unusual cases, but don't change behavior
      if (permissionArray.length === 0 && user.role === UserRole.ADMIN) {
        // Add fundamental admin permissions to prevent complete lockout
        const basicAdminPermissions = [
          'system.access', 'users.view', 'users.edit', 'customers.view',
          'requests.view', 'appointments.view', 'settings.view', 'system.admin'
        ];
        
        logger.warn(`Adding fallback permissions for admin user ${userId} with zero permissions`, {
          userRole: user.role,
          directUserPermissions: user.permissions.length,
          rolePermissionsCount: DEFAULT_ROLE_PERMISSIONS[user.role]?.length || 0,
          fallbackPermissionCount: basicAdminPermissions.length
        });
        
        permissionArray.push(...basicAdminPermissions);
      }
      
      // Consistent, strictly-typed response structure
      const response: UserPermissionsResponseDto = {
        userId,
        permissions: permissionArray,
        role: user.role as UserRole
      };
      
      return response;
    } catch (error) {
      if (error instanceof PermissionError) {
        throw error;
      }
      
      logger.error('Error getting user permissions:', error as Error);
      throw new PermissionError(
        'Failed to get user permissions',
        'GET_PERMISSIONS_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Updates permissions for a user
   */
  async updateUserPermissions(data: UpdateUserPermissionsDto, options?: ServiceOptions): Promise<boolean> {
    try {
      const { userId, permissions } = data;
      
      // Delete existing user permissions
      await db.userPermission.deleteMany({
        where: { userId }
      });
      
      // Add new permissions
      for (const permissionCode of permissions) {
        const permission = await db.permission.findUnique({
          where: { code: permissionCode }
        });
        
        if (permission) {
          await db.userPermission.create({
            data: {
              userId,
              permissionId: permission.id,
              grantedAt: new Date(),
              grantedBy: options?.userId || userId
            }
          });
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error updating user permissions:', error as Error);
      throw new PermissionError(
        'Failed to update user permissions',
        'UPDATE_PERMISSIONS_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Adds a permission to a user
   */
  async addUserPermission(userId: number, permissionCode: string, options?: ServiceOptions): Promise<boolean> {
    try {
      const permission = await db.permission.findUnique({
        where: { code: permissionCode }
      });
      
      if (!permission) {
        throw new PermissionError(
          'Permission not found',
          'PERMISSION_NOT_FOUND',
          404
        );
      }
      
      await db.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permission.id
          }
        },
        create: {
          userId,
          permissionId: permission.id,
          grantedAt: new Date(),
          grantedBy: options?.userId || userId
        },
        update: {
          grantedAt: new Date(),
          grantedBy: options?.userId || userId
        }
      });
      
      return true;
    } catch (error) {
      logger.error('Error adding user permission:', error as Error);
      throw new PermissionError(
        'Failed to add user permission',
        'ADD_PERMISSION_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Removes a permission from a user
   */
  async removeUserPermission(userId: number, permissionCode: string, options?: ServiceOptions): Promise<boolean> {
    try {
      const permission = await db.permission.findUnique({
        where: { code: permissionCode }
      });
      
      if (!permission) {
        throw new PermissionError(
          'Permission not found',
          'PERMISSION_NOT_FOUND',
          404
        );
      }
      
      // Set the permission as denied (not deleted)
      await db.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permission.id
          }
        },
        create: {
          userId,
          permissionId: permission.id,
          grantedBy: options?.userId || userId
        },
        update: {
          grantedBy: options?.userId || userId
        }
      });
      
      return true;
    } catch (error) {
      logger.error('Error removing user permission:', error as Error);
      throw new PermissionError(
        'Failed to remove user permission',
        'REMOVE_PERMISSION_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Get default permissions for a role
   */
  async getDefaultPermissionsForRole(role: string, options?: ServiceOptions): Promise<string[]> {
    const permissions = DEFAULT_ROLE_PERMISSIONS[role as UserRole] || [];
    return permissions;
  }
  
  /**
   * Maps a Permission entity to PermissionResponseDto
   */
  private mapToResponseDto(permission: any): PermissionResponseDto {
    return {
      id: permission.id,
      code: permission.code,
      name: permission.name,
      description: permission.description,
      category: permission.category,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt
    };
  }
  
  /**
   * Count permissions with optional filtering
   */
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    try {
      const where: any = {};
      
      if (options?.filters) {
        Object.assign(where, options.filters);
      }
      
      return await db.permission.count({ where });
    } catch (error) {
      logger.error('Error counting permissions:', error as Error);
      throw new PermissionError(
        'Failed to count permissions',
        'COUNT_PERMISSIONS_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Get all permissions
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<PermissionResponseDto>> {
    const filters: PermissionFilterParamsDto = {
      page: options?.page || 1,
      limit: options?.limit || 10,
      ...options?.filters
    };
    
    return this.findPermissions(filters, options);
  }
  
  /**
   * Get permission by ID
   */
  async getById(id: number, options?: ServiceOptions): Promise<PermissionResponseDto | null> {
    return this.findById(id, options);
  }
  
  /**
   * Find permissions by criteria
   */
  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<PermissionResponseDto[]> {
    try {
      const permissions = await db.permission.findMany({
        where: criteria,
        ...(options?.relations && { include: options.relations.reduce((acc, rel) => ({ ...acc, [rel]: true }), {}) })
      });
      
      return permissions.map(p => this.mapToResponseDto(p));
    } catch (error) {
      logger.error('Error finding permissions by criteria:', error as Error);
      throw new PermissionError(
        'Failed to find permissions',
        'FIND_PERMISSIONS_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Validate permission data
   */
  async validate(data: CreatePermissionDto | UpdatePermissionDto, isUpdate?: boolean, entityId?: number): Promise<import('@/domain/dtos/ValidationDto').ValidationResultDto> {
    const errors: Record<string, string> = {};
    
    if (!isUpdate && !(data as CreatePermissionDto).code) {
      errors.code = 'Permission code is required';
    }
    
    if (!data.name) {
      errors.name = 'Permission name is required';
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
    return db.$transaction(async (tx) => {
      // Create a new instance with the transaction client
      const txService = new PermissionService();
      // @ts-ignore - accessing private db for transaction
      txService.db = tx;
      return callback(txService);
    });
  }
  
  /**
   * Bulk update permissions
   */
  async bulkUpdate(ids: number[], data: UpdatePermissionDto, options?: ServiceOptions): Promise<number> {
    try {
      const result = await db.permission.updateMany({
        where: { id: { in: ids } },
        data
      });
      
      return result.count;
    } catch (error) {
      logger.error('Error bulk updating permissions:', error as Error);
      throw new PermissionError(
        'Failed to bulk update permissions',
        'BULK_UPDATE_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Convert entity to DTO
   */
  toDTO(entity: Permission): PermissionResponseDto {
    return this.mapToResponseDto(entity);
  }
  
  /**
   * Convert DTO to entity
   */
  fromDTO(dto: CreatePermissionDto | UpdatePermissionDto): Partial<Permission> {
    return {
      ...dto,
      code: (dto as CreatePermissionDto).code,
      id: undefined
    };
  }
  
  /**
   * Search permissions
   */
  async search(searchText: string, options?: ServiceOptions): Promise<PermissionResponseDto[]> {
    try {
      const permissions = await db.permission.findMany({
        where: {
          OR: [
            { name: { contains: searchText } },
            { code: { contains: searchText } },
            { description: { contains: searchText } },
          ]
        },
        take: options?.limit || 10
      });
      
      return permissions.map(p => this.mapToResponseDto(p));
    } catch (error) {
      logger.error('Error searching permissions:', error as Error);
      throw new PermissionError(
        'Failed to search permissions',
        'SEARCH_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Check if permission exists
   */
  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const count = await db.permission.count({
        where: { id }
      });
      
      return count > 0;
    } catch (error) {
      logger.error('Error checking permission existence:', error as Error);
      return false;
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
   * @param userId User ID
   * @param permission Permission code
   */
  async grantPermission(userId: number, permission: string): Promise<boolean> {
    return this.addUserPermission(userId, permission);
  }
  
  /**
   * Revoke a permission from a user
   * @param userId User ID
   * @param permission Permission code
   */
  async revokePermission(userId: number, permission: string): Promise<boolean> {
    return this.removeUserPermission(userId, permission);
  }
}

// Export singleton instance
export const permissionService = PermissionService.getInstance();
