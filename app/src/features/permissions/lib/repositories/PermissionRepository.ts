import { IPermissionRepository } from '@/domain/repositories/IPermissionRepository';
import { Permission, UserPermission } from '@/domain/entities/Permission';
import { PermissionFilterParamsDto } from '@/domain/dtos/PermissionDtos';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors/';
import { QueryOptions } from '@/core/repositories/PrismaRepository';

// Type for role permission with included permission
interface RolePermissionWithPermission {
  role: string;
  permissionId: number;
  permission?: {
    code?: string;
    id?: number;
  };
}

// Type for permission response from DB
interface PermissionDbEntity {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}

/**
 * Implementation of the Permission Repository
 * 
 * Uses Prisma to interact with the database for permission management.
 * No fallbacks or workarounds - proper error propagation
 */
export class PermissionRepository implements IPermissionRepository {
  /**
   * Constructor
   * 
   * @param prisma - Prisma client
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    readonly prisma: any,
    readonly logger: ILoggingService,
    readonly errorHandler: IErrorHandler
  ) {
    // Validate required models are available
    if (!prisma) {
      throw new Error('Prisma client is required for PermissionRepository');
    }
    
    // Log initialization
    this.logger.info('Initialized PermissionRepository');
    
    // Validate critical models (but don't throw)
    if (!prisma.Permission) {
      this.logger.warn('Prisma Permission model not found - permissions may not work correctly');
    }
    
    if (!prisma.UserPermission) {
      this.logger.warn('Prisma UserPermission model not found - user permissions may not work correctly');
    }
    
    if (!prisma.RolePermission) {
      this.logger.warn('Prisma RolePermission model not found - role permissions may not work correctly');
    }
  }

  /**
   * Gets the repository implementation
   * 
   * @returns The repository instance
   */
  getRepository(): any {
    return this;
  }

  /**
   * Finds a permission by its code
   * 
   * @param code - Permission code
   * @returns Promise with found permission or null
   */
  async findByCode(code: string): Promise<Permission | null> {
    if (!code) {
      throw this.errorHandler.createError('Permission code is required');
    }
    
    const permission = await this.prisma.permission.findUnique({
      where: { code }
    });
    
    return permission ? this.mapToDomainEntity(permission) : null;
  }

  /**
   * Finds permissions with advanced filtering options
   * 
   * @param filters - Filter parameters
   * @returns Promise with found permissions and pagination
   */
  async findPermissions(filters: PermissionFilterParamsDto): Promise<PaginationResult<Permission>> {
    // Build where condition for filtering
    const where: any = {};
    
    // Apply search filter across multiple fields
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    // Apply category filter
    if (filters.category) {
      where.category = { equals: filters.category, mode: 'insensitive' };
    }
    
    // Apply code filter
    if (filters.code) {
      where.code = { contains: filters.code, mode: 'insensitive' };
    }
    
    // Set up pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    
    // Set up sorting
    const orderBy: any = {};
    orderBy[filters.sortBy || 'createdAt'] = filters.sortDirection || 'desc';
    
    // Execute queries in parallel
    const [total, permissions] = await Promise.all([
      this.prisma.permission.count({ where }),
      this.prisma.permission.findMany({
        where,
        skip,
        take: limit,
        orderBy
      })
    ]);
    
    // Map to domain entities
    const data = permissions.map((p: PermissionDbEntity) => this.mapToDomainEntity(p));
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Gets all permissions for a user
   * 
   * @param userId - User ID
   * @returns Promise with user's permissions
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    if (!userId || userId <= 0) {
      throw this.errorHandler.createError('Valid user ID is required');
    }
    
    // Validate that prisma client and all required models are available
    if (!this.prisma) {
      this.logger.error('Prisma client is not initialized in PermissionRepository', { userId });
      throw this.errorHandler.createError('Database client not initialized');
    }
    
    if (!this.prisma.user) {
      this.logger.error('Prisma user model is missing in PermissionRepository', { userId });
      throw this.errorHandler.createError('Database user model not available');
    }
    
    if (!this.prisma.userPermission) {
      this.logger.error('Prisma userPermission model is missing in PermissionRepository', { userId });
      throw this.errorHandler.createError('Database userPermission model not available');
    }
    
    // Standard Prisma model references are in PascalCase based on schema
    if (!this.prisma.RolePermission) {
      this.logger.error('RolePermission model is missing in PermissionRepository', { userId });
      throw this.errorHandler.createError('Database RolePermission model not available');
    }
    
    if (!this.prisma.permission) {
      this.logger.error('Prisma permission model is missing in PermissionRepository', { userId });
      throw this.errorHandler.createError('Database permission model not available');
    }
    
    try {
      // Find user in database to get role
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, status: true }
      });
      
      if (!user) {
        throw this.errorHandler.createNotFoundError('User not found');
      }
      
      // Special case: if user is inactive, return no permissions
      if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
        this.logger.warn(`User ${userId} is ${user.status}, returning no permissions`);
        return [];
      }
      
      // Special case: if user is admin, they implicitly have all permissions
      if (user.role.toLowerCase() === 'admin') {
        this.logger.info(`User ${userId} is an admin, getting all available permissions`);
        // For admins, get all permissions in the system
        const allPermissions = await this.prisma.permission.findMany({
          select: { code: true }
        });
        return allPermissions.map(p => p.code);
      }
      
      // Get user's role for reference
      const normalizedRole = user.role.toLowerCase();
      
      // Get user-specific permissions from the database
      const userPermissions = await this.prisma.userPermission.findMany({
        where: { userId },
        include: { 
          permission: {
            select: { code: true }
          }
        }
      });
      
      // Get user-specific permission codes with explicit null check
      const userPermissionCodes = userPermissions
        .filter(p => p.permission && p.permission.code)
        .map(p => p.permission!.code as string);
      
      // Get role-based permissions from the database using the correct model reference
      const rolePermissionModel = this.prisma.RolePermission;
      const rolePermissions = await rolePermissionModel.findMany({
        where: { role: normalizedRole },
        include: {
          permission: {
            select: { code: true }
          }
        }
      });
      
      // Extract permission codes from the result with explicit null check
      const rolePermissionCodes = rolePermissions
        .filter(rp => rp.permission && rp.permission.code)
        .map((rp: RolePermissionWithPermission) => rp.permission!.code as string);
      
      // Use a Set to ensure uniqueness of permission codes
      const allPermissions = new Set([...rolePermissionCodes, ...userPermissionCodes]);
      
      this.logger.debug(`Retrieved permissions for user ${userId}`, {
        userId,
        role: normalizedRole,
        userPermissionCount: userPermissionCodes.length,
        rolePermissionCount: rolePermissionCodes.length,
        totalUniquePermissions: allPermissions.size
      });
      
      return Array.from(allPermissions);
    } catch (error) {
      this.logger.error('Error in getUserPermissions', { 
        userId, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  /**
   * Gets default permissions for a role when database doesn't have them
   * 
   * @param role - User role in lowercase
   * @returns Array of permission codes
   */
  getDefaultPermissionsForRole(role: string): string[] {
    if (!role) {
      throw this.errorHandler.createError('Role is required');
    }
    
    // Basic permissions that all roles should have
    const basicPermissions = [
      'profile.view',
      'profile.edit',
      'dashboard.access'
    ];
    
    switch(role) {
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
   * Updates permissions for a user
   * 
   * @param userId - User ID
   * @param permissions - Permission codes to assign
   * @param updatedBy - ID of the user performing the update
   * @returns Promise with success status
   */
  async updateUserPermissions(userId: number, permissions: string[], updatedBy?: number): Promise<boolean> {
    if (!userId || userId <= 0) {
      throw this.errorHandler.createError('Valid user ID is required');
    }
    
    if (!Array.isArray(permissions)) {
      throw this.errorHandler.createError('Permissions must be an array');
    }
    
    // Get user to ensure they exist
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user) {
      throw this.errorHandler.createNotFoundError('User not found');
    }
    
    // Get role permissions from the database using the RolePermission model
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role: user.role.toLowerCase() },
      include: {
        permission: {
          select: { code: true }
        }
      }
    });
    
    const rolePermissionCodes = rolePermissions
      .map((rp: RolePermissionWithPermission) => rp.permission?.code)
      .filter(Boolean) as string[];
    
    // Convert all permissions to strings for consistent comparison
    const permissionStrings = permissions.map(String);
    const rolePermissionStrings = rolePermissionCodes.map(String);
    
    // Determine which permissions need to be explicitly added or removed
    const additionalPermissions = permissionStrings.filter(p => !rolePermissionStrings.includes(p));
    const removedPermissions = rolePermissionStrings.filter(p => !permissionStrings.includes(p));
    
    // Run this as a transaction
    await this.prisma.$transaction(async (tx: any) => {
      // Clear existing permissions
      await tx.userPermission.deleteMany({
        where: { userId }
      });
      
      // Get permissions by code
      const permissionEntities = await tx.permission.findMany({
        where: {
          code: {
            in: [...additionalPermissions, ...removedPermissions]
          }
        }
      });
      
      // Create a map of permission code to ID
      const permissionMap = new Map<string, number>();
      permissionEntities.forEach((p: { id: number, code: string }) => {
        permissionMap.set(p.code, p.id);
      });
      
      // Add explicitly granted permissions
      const grantsToAdd = additionalPermissions
        .filter(code => permissionMap.has(code))
        .map(code => ({
          userId,
          permissionId: permissionMap.get(code)!,
          grantedAt: new Date(),
          grantedBy: updatedBy
        }));
      
      // Insert all user permissions at once
      if (grantsToAdd.length > 0) {
        await tx.userPermission.createMany({
          data: grantsToAdd
        });
      }
    });
    
    return true;
  }

  /**
   * Adds a permission to a user
   * 
   * @param userId - User ID
   * @param permissionCode - Permission code
   * @param grantedBy - ID of the user granting the permission
   * @returns Promise with created user permission
   */
  async addUserPermission(userId: number, permissionCode: string, grantedBy?: number): Promise<UserPermission> {
    if (!userId || userId <= 0) {
      throw this.errorHandler.createError('Valid user ID is required');
    }
    
    if (!permissionCode) {
      throw this.errorHandler.createError('Permission code is required');
    }
    
    // Find the permission by code
    const permission = await this.findByCode(permissionCode);
    
    if (!permission) {
      throw this.errorHandler.createNotFoundError(`Permission ${permissionCode} not found`);
    }
    
    // Check if this permission already exists
    const existingPermission = await this.prisma.userPermission.findFirst({
      where: {
        userId,
        permission: { code: permissionCode }
      }
    });
    
    if (existingPermission) {
      return new UserPermission({
        userId,
        permissionId: permission.id,
        grantedAt: new Date(existingPermission.grantedAt),
        grantedBy: existingPermission.grantedBy
      });
    }
    
    // Create the permission
    const userPermission = await this.prisma.userPermission.create({
      data: {
        userId,
        permissionId: permission.id,
        grantedAt: new Date(),
        grantedBy
      },
      include: {
        permission: true
      }
    });
    
    return new UserPermission({
      userId: userPermission.userId,
      permissionId: userPermission.permissionId,
      grantedAt: new Date(userPermission.grantedAt),
      grantedBy: userPermission.grantedBy
    });
  }

  /**
   * Removes a permission from a user
   * 
   * @param userId - User ID
   * @param permissionCode - Permission code
   * @returns Promise with success status
   */
  async removeUserPermission(userId: number, permissionCode: string): Promise<boolean> {
    if (!userId || userId <= 0) {
      throw this.errorHandler.createError('Valid user ID is required');
    }
    
    if (!permissionCode) {
      throw this.errorHandler.createError('Permission code is required');
    }
    
    // Find the permission by code
    const permission = await this.findByCode(permissionCode);
    
    if (!permission) {
      throw this.errorHandler.createNotFoundError(`Permission ${permissionCode} not found`);
    }
    
    // Delete the user permission
    await this.prisma.userPermission.deleteMany({
      where: {
        userId,
        permissionId: permission.id
      }
    });
    
    return true;
  }

  /**
   * Checks if a user has a specific permission
   * 
   * @param userId - User ID
   * @param permissionCode - Permission code
   * @returns Promise with whether the user has the permission
   */
  async hasPermission(userId: number, permissionCode: string): Promise<boolean> {
    if (!userId || userId <= 0) {
      throw this.errorHandler.createError('Valid user ID is required');
    }
    
    if (!permissionCode) {
      throw this.errorHandler.createError('Permission code is required');
    }
    
    // Normalize the permission code for consistent comparison
    const normalizedPermissionCode = permissionCode.trim().toLowerCase();
    
    // Find user to ensure they exist
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true }
    });
    
    if (!user) {
      throw this.errorHandler.createNotFoundError('User not found');
    }
    
    // If user is inactive, deny permissions
    if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
      return false;
    }

    // Special case for admin users - they have all permissions
    if (user.role.toLowerCase() === 'admin') {
      return true;
    }
    
    // Check if user has this permission through their role - use proper join through the correct model
    const rolePermissionModel = this.prisma.RolePermission;
    const hasRolePermission = await rolePermissionModel.count({
      where: {
        role: user.role.toLowerCase(),
        permission: {
          code: normalizedPermissionCode
        }
      }
    });
    
    // If user has the permission through their role, return true
    if (hasRolePermission > 0) {
      return true;
    }
    
    // Check for explicit user permission with optimized query
    const hasExplicitPermission = await this.prisma.userPermission.count({
      where: {
        userId,
        permission: {
          code: normalizedPermissionCode
        }
      }
    });
    
    return hasExplicitPermission > 0;
  }

  /* IBaseRepository methods implementation */

  /**
   * Find by ID
   */
  async findById(id: number): Promise<Permission | null> {
    if (!id || id <= 0) {
      throw this.errorHandler.createError('Valid ID is required');
    }
    
    const permission = await this.prisma.permission.findUnique({
      where: { id }
    });
    
    return permission ? this.mapToDomainEntity(permission) : null;
  }

  /**
   * Find one by criteria
   */
  async findOneByCriteria(criteria: Record<string, any>): Promise<Permission | null> {
    if (!criteria || Object.keys(criteria).length === 0) {
      throw this.errorHandler.createError('Search criteria is required');
    }
    
    const where = this.processCriteria(criteria);
    
    const permission = await this.prisma.permission.findFirst({ where });
    
    return permission ? this.mapToDomainEntity(permission) : null;
  }

  /**
   * Find by criteria
   */
  async findByCriteria(criteria: Record<string, any>): Promise<Permission[]> {
    if (!criteria) {
      throw this.errorHandler.createError('Search criteria is required');
    }
    
    const where = this.processCriteria(criteria);
    
    const permissions = await this.prisma.permission.findMany({ where });
    
    return permissions.map((p: PermissionDbEntity) => this.mapToDomainEntity(p));
  }

  /**
   * Create a new permission
   */
  async create(data: Partial<Permission>): Promise<Permission> {
    if (!data) {
      throw this.errorHandler.createError('Permission data is required');
    }
    
    if (!data.code) {
      throw this.errorHandler.createError('Permission code is required');
    }
    
    const now = new Date();
    
    const permission = await this.prisma.permission.create({
      data: {
        code: data.code,
        name: data.name || '',
        description: data.description || '',
        category: data.category || 'General',
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now,
        createdBy: data.createdBy,
        updatedBy: data.updatedBy
      }
    });
    
    return this.mapToDomainEntity(permission);
  }

  /**
   * Update a permission
   */
  async update(id: number, data: Partial<Permission>): Promise<Permission> {
    if (!id || id <= 0) {
      throw this.errorHandler.createError('Valid ID is required');
    }
    
    if (!data) {
      throw this.errorHandler.createError('Permission data is required');
    }
    
    const permission = await this.findById(id);
    if (!permission) {
      throw this.errorHandler.createNotFoundError('Permission not found');
    }
    
    const updated = await this.prisma.permission.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : permission.name,
        description: data.description !== undefined ? data.description : permission.description,
        category: data.category !== undefined ? data.category : permission.category,
        updatedAt: new Date(),
        updatedBy: data.updatedBy
      }
    });
    
    return this.mapToDomainEntity(updated);
  }

  /**
   * Delete a permission
   */
  async delete(id: number): Promise<boolean> {
    if (!id || id <= 0) {
      throw this.errorHandler.createError('Valid ID is required');
    }
    
    // Check if permission exists
    const permission = await this.findById(id);
    if (!permission) {
      throw this.errorHandler.createNotFoundError('Permission not found');
    }
    
    await this.prisma.permission.delete({
      where: { id }
    });
    
    return true;
  }

  /**
   * Find all permissions
   */
  async findAll(options?: QueryOptions): Promise<PaginationResult<Permission>> {
    // Set default options if not provided
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    
    // Apply sorting
    const orderBy: any = {};
    if (options?.sort?.field) {
      orderBy[options.sort.field] = options.sort.direction || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }
    
    // Execute queries
    const [total, permissions] = await Promise.all([
      this.prisma.permission.count(),
      this.prisma.permission.findMany({
        skip,
        take: limit,
        orderBy
      })
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: permissions.map((p: PermissionDbEntity) => this.mapToDomainEntity(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Count permissions
   */
  async count(criteria?: Record<string, any>): Promise<number> {
    if (!criteria) {
      return await this.prisma.permission.count();
    }
    
    const where = this.processCriteria(criteria);
    return await this.prisma.permission.count({ where });
  }

  /**
   * Bulk update permissions
   */
  async bulkUpdate(ids: number[], data: Partial<Permission>): Promise<number> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw this.errorHandler.createError('Valid IDs array is required');
    }
    
    if (!data) {
      throw this.errorHandler.createError('Update data is required');
    }
    
    const result = await this.prisma.permission.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
    
    return result.count;
  }

  /**
   * Execute in transaction
   */
  async transaction<T>(callback: (repo?: IPermissionRepository) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(async (tx: any) => {
      // Create a transaction-specific repository to pass to the callback
      const transactionRepo = new PermissionRepository(tx, this.logger, this.errorHandler);
      return callback(transactionRepo);
    });
  }

  /**
   * Gets permissions for a role from the database directly
   * 
   * @param role - Role name
   * @returns Permissions for the role
   */
  async getRolePermissions(role: string): Promise<string[]> {
    if (!role) {
      throw this.errorHandler.createError('Role is required');
    }
    
    // Validate that prisma client is available
    if (!this.prisma || !this.prisma.permission) {
      this.logger.error('Prisma client is not properly initialized in PermissionRepository.getRolePermissions', { role });
      throw this.errorHandler.createError('Database client not initialized properly');
    }
    
    try {
      // Normalize the role to lowercase for case-insensitive comparison
      const normalizedRole = role.toLowerCase();
      
      // Get role permissions through the correct model reference
      const rolePermissionModel = this.prisma.RolePermission;
      const rolePermissions = await rolePermissionModel.findMany({
        where: { role: normalizedRole },
        include: {
          permission: {
            select: { code: true }
          }
        }
      });
      
      // Extract permission codes from the result
      const permissionCodes = rolePermissions
        .map((rp: RolePermissionWithPermission) => rp.permission?.code)
        .filter(Boolean) as string[];
        
      // If no permissions are found, return the default permissions
      if (permissionCodes.length === 0) {
        return this.getDefaultPermissionsForRole(normalizedRole);
      }
      
      return permissionCodes;
    } catch (error) {
      this.logger.error('Error in getRolePermissions', { 
        role, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Return default permissions as fallback
      return this.getDefaultPermissionsForRole(role);
    }
  }
  
  /**
   * Sets permissions for a role
   * 
   * @param role - Role name
   * @param permissions - Array of permission codes
   * @param updatedBy - ID of the user updating the permissions
   * @returns Updated permissions for the role
   */
  async setRolePermissions(role: string, permissions: string[], updatedBy?: number): Promise<string[]> {
    if (!role) {
      throw this.errorHandler.createError('Role is required');
    }
    
    if (!Array.isArray(permissions)) {
      throw this.errorHandler.createError('Permissions must be an array');
    }
    
    // Normalize role name
    const normalizedRole = role.toLowerCase();
    
    // First validate all permission codes exist in the database
    const dbPermissions = await this.prisma.permission.findMany({
      where: {
        code: {
          in: permissions
        }
      },
      select: {
        id: true,
        code: true
      }
    });
    
    // Map permission codes to IDs
    const permissionMap = new Map<string, number>();
    dbPermissions.forEach((p: { id: number, code: string }) => {
      permissionMap.set(p.code, p.id);
    });
    
    // Get valid permission codes and IDs
    const validPermissionCodes = dbPermissions.map((p: { code: string }) => p.code);
    const validPermissionIds = dbPermissions.map((p: { id: number }) => p.id);
    
    // Run in a transaction
    await this.prisma.$transaction(async (tx: any) => {
      // First delete all existing role permissions for this role
      const rolePermissionModel = tx.rolePermission || tx.RolePermission;
      await rolePermissionModel.deleteMany({
        where: {
          role: normalizedRole
        }
      });
      
      // Create new role permission entries
      const now = new Date();
      
      // Create role permission entries
      const rolePermissions = validPermissionIds.map((permId: number) => ({
        role: normalizedRole,
        permissionId: permId,
        createdAt: now,
        updatedAt: now,
        createdBy: updatedBy,
        updatedBy: updatedBy
      }));
      
      // Use createMany for more efficiency
      if (rolePermissions.length > 0) {
        const rolePermissionModel = tx.rolePermission || tx.RolePermission;
        await rolePermissionModel.createMany({
          data: rolePermissions,
          skipDuplicates: true
        });
      }
    });
    
    return validPermissionCodes;
  }
  
  /**
   * Maps a database entity to a domain entity
   * 
   * @param dbEntity - Database entity
   * @returns Domain entity
   */
  mapToDomainEntity = (dbEntity: PermissionDbEntity): Permission => {
    if (!dbEntity) {
      throw this.errorHandler.createError('Invalid permission entity');
    }
    
    return new Permission({
      id: dbEntity.id,
      code: dbEntity.code,
      name: dbEntity.name,
      description: dbEntity.description,
      category: dbEntity.category,
      createdAt: dbEntity.createdAt,
      updatedAt: dbEntity.updatedAt,
      createdBy: dbEntity.createdBy,
      updatedBy: dbEntity.updatedBy
    });
  }

  /**
   * Processes criteria for database queries
   * 
   * @param criteria - Search criteria
   * @returns Database-specific criteria
   */
  processCriteria = (criteria: Record<string, any>): any => {
    if (!criteria) {
      return {};
    }
    
    const where: any = {};
    
    for (const [key, value] of Object.entries(criteria)) {
      if (value === undefined) continue;
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Handle complex operators
        const operators: Record<string, any> = {};
        
        for (const [op, opValue] of Object.entries(value)) {
          switch (op) {
            case 'eq':
              operators.equals = opValue;
              break;
            case 'neq':
              operators.not = opValue;
              break;
            case 'gt':
              operators.gt = opValue;
              break;
            case 'gte':
              operators.gte = opValue;
              break;
            case 'lt':
              operators.lt = opValue;
              break;
            case 'lte':
              operators.lte = opValue;
              break;
            case 'contains':
              operators.contains = opValue;
              operators.mode = 'insensitive';
              break;
            case 'startsWith':
              operators.startsWith = opValue;
              break;
            case 'endsWith':
              operators.endsWith = opValue;
              break;
            case 'in':
              operators.in = opValue;
              break;
            case 'notIn':
              operators.notIn = opValue;
              break;
            default:
              operators[op] = opValue;
          }
        }
        
        where[key] = operators;
      } else if (key === 'OR' || key === 'AND') {
        // Handle logical operators
        where[key] = Array.isArray(value) 
          ? value.map((item: Record<string, any>) => this.processCriteria(item))
          : value;
      } else {
        // Simple equality check
        where[key] = value;
      }
    }
    
    return where;
  }
}
