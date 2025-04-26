import { IPermissionRepository } from '@/domain/repositories/IPermissionRepository';
import { Permission, UserPermission } from '@/domain/entities/Permission';
import { PermissionFilterParamsDto } from '@/domain/dtos/PermissionDtos';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors/';
import { getPermissionsForRole } from '@/domain/enums/PermissionEnums';
import { SystemPermissionMap, getAllPermissionCodes } from '@/domain/permissions/SystemPermissionMap';
import { UserRole } from '@/domain/entities/User';
import { QueryOptions } from './PrismaRepository';

/**
 * Implementation of the Permission Repository
 * 
 * Uses Prisma to interact with the database for permission management.
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
    private readonly prisma: any,
    public readonly logger: ILoggingService,
    public readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized PermissionRepository');
  }

  /**
   * Seeds default permissions into the database if not already present
   * 
   * This should be called during application initialization
   */
  async seedDefaultPermissions(): Promise<void> {
    try {
      // Check if we already have permissions in the database
      const count = await this.prisma.permission.count();
      if (count > 0) {
        this.logger.debug(`Found ${count} existing permissions in database.`);
        return; // Exit if we already have permissions
      }
      
      this.logger.info('Seeding default permissions into database...');
      
      // Get permission definitions from centralized map
      const allPermissions = Object.values(SystemPermissionMap).map(permission => ({
        code: permission.code,
        name: permission.name,
        description: permission.description,
        category: permission.category
      }));
      
      // Insert all permissions in a transaction
      await this.prisma.$transaction(
        allPermissions.map(p => 
          this.prisma.permission.create({
            data: {
              code: p.code,
              name: p.name,
              description: p.description,
              category: p.category,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        )
      );
      
      this.logger.info(`Successfully seeded ${allPermissions.length} default permissions.`);
    } catch (error) {
      this.logger.error('Error seeding default permissions:', { error });
      throw this.errorHandler.createError('Failed to seed default permissions');
    }
  }

  /**
   * Finds a permission by its code
   * 
   * @param code - Permission code
   * @returns Promise with found permission or null
   */
  async findByCode(code: string): Promise<Permission | null> {
    try {
      this.logger.debug(`Finding permission by code: ${code}`);
      
      const permission = await this.prisma.permission.findUnique({
        where: { code }
      });
      
      return permission ? this.mapToDomainEntity(permission) : null;
    } catch (error) {
      this.logger.error('Error in PermissionRepository.findByCode', { error, code });
      throw this.errorHandler.createError('Failed to find permission by code');
    }
  }

  /**
   * Finds permissions with advanced filtering options
   * 
   * @param filters - Filter parameters
   * @returns Promise with found permissions and pagination
   */
  async findPermissions(filters: PermissionFilterParamsDto): Promise<PaginationResult<Permission>> {
    try {
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
      const data = permissions.map((p: any) => this.mapToDomainEntity(p));
      
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
    } catch (error) {
      this.logger.error('Error in PermissionRepository.findPermissions', { error, filters });
      throw this.errorHandler.createError('Failed to find permissions');
    }
  }

  /**
   * Gets all permissions for a user
   * 
   * @param userId - User ID
   * @returns Promise with user's permissions
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    try {
      this.logger.debug(`Getting permissions for user ${userId}`);
      
      // Find user in database to get role
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, status: true }
      });
      
      if (!user) {
        this.logger.warn(`User with ID ${userId} not found when fetching permissions`);
        throw this.errorHandler.createNotFoundError('User not found');
      }

      // Check if user is active
      if (user.status !== 'active') {
        this.logger.warn(`User with ID ${userId} has inactive status: ${user.status}`);
        // Still continue to get permissions, but log a warning
      }
      
      // First get role-based default permissions
      const normalizedRole = user.role.toLowerCase();
      this.logger.debug(`Getting role-based permissions for user ${userId} with role ${normalizedRole}`);
      const rolePermissions = getPermissionsForRole(normalizedRole);
      
      // Then get user-specific permissions from the database
      const userPermissions = await this.prisma.userPermission.findMany({
        where: { userId },
        include: { permission: true }
      });
      
      // Combine role permissions with user-specific permissions
      const userPermissionCodes = userPermissions.map((up: any) => up.permission.code);
      
      // Use a Set to ensure uniqueness of permission codes
      const allPermissions = new Set([...rolePermissions, ...userPermissionCodes]);
      const result = Array.from(allPermissions);
      
      this.logger.debug(`Retrieved ${result.length} permissions for user ${userId} (${rolePermissions.length} from role, ${userPermissionCodes.length} individual)`);
      
      return result;
    } catch (error) {
      this.logger.error('Error in PermissionRepository.getUserPermissions', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId 
      });
      throw this.errorHandler.createError('Failed to get user permissions');
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
    try {
      this.logger.debug(`Updating permissions for user ${userId}`);
      
      // Get role-based permissions to determine which ones should be stored in database
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      
      if (!user) {
        throw this.errorHandler.createNotFoundError('User not found');
      }
      
      // Get default permissions for the user's role
      const rolePermissions = getPermissionsForRole(user.role);
      
      // Determine which permissions need to be explicitly added or removed
      // We only need to store permissions in the database that differ from role defaults
      const additionalPermissions = permissions.filter(p => !rolePermissions.includes(p));
      const removedPermissions = rolePermissions.filter(p => !permissions.includes(p));
      
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
              in: additionalPermissions.concat(removedPermissions)
            }
          }
        });
        
        // Create a map of permission code to ID
        const permissionMap = new Map<string, number>();
        permissionEntities.forEach((p: any) => permissionMap.set(p.code, p.id));
        
        // Add explicitly granted permissions
        const grantsToAdd = additionalPermissions.filter(code => permissionMap.has(code))
          .map(code => ({
            userId,
            permissionId: permissionMap.get(code)!,
            grantedAt: new Date(),
            grantedBy: updatedBy
          }));
        
        // Add negative grants for explicitly removed permissions
        const grantsToRemove = removedPermissions.filter(code => permissionMap.has(code))
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
        
        // Log the action
        this.logger.info(`Updated permissions for user ${userId}`, {
          added: additionalPermissions.length,
          removed: removedPermissions.length,
          updatedBy
        });
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error in PermissionRepository.updateUserPermissions', { error, userId, permissions });
      throw this.errorHandler.createError('Failed to update user permissions');
    }
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
    try {
      this.logger.debug(`Adding permission ${permissionCode} to user ${userId}`);
      
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
    } catch (error) {
      this.logger.error('Error in PermissionRepository.addUserPermission', { error, userId, permissionCode });
      throw this.errorHandler.createError('Failed to add user permission');
    }
  }

  /**
   * Removes a permission from a user
   * 
   * @param userId - User ID
   * @param permissionCode - Permission code
   * @returns Promise with success status
   */
  async removeUserPermission(userId: number, permissionCode: string): Promise<boolean> {
    try {
      this.logger.debug(`Removing permission ${permissionCode} from user ${userId}`);
      
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
      
      this.logger.info(`Removed permission ${permissionCode} from user ${userId}`);
      
      return true;
    } catch (error) {
      this.logger.error('Error in PermissionRepository.removeUserPermission', { error, userId, permissionCode });
      throw this.errorHandler.createError('Failed to remove user permission');
    }
  }

  /**
   * Checks if a user has a specific permission
   * 
   * @param userId - User ID
   * @param permissionCode - Permission code
   * @returns Promise with whether the user has the permission
   */
  async hasPermission(userId: number, permissionCode: string): Promise<boolean> {
    try {
      // First check if the user has this permission through their role
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      
      if (!user) {
        throw this.errorHandler.createNotFoundError('User not found');
      }
      
      // Get role-based permissions
      const rolePermissions = getPermissionsForRole(user.role);
      if (rolePermissions.includes(permissionCode)) {
        return true;
      }
      
      // If not in role permissions, check for explicit user permission
      const permission = await this.findByCode(permissionCode);
      if (!permission) {
        return false; // Permission doesn't exist
      }
      
      const userPermission = await this.prisma.userPermission.findFirst({
        where: {
          userId,
          permissionId: permission.id
        }
      });
      
      return !!userPermission;
    } catch (error) {
      this.logger.error('Error in PermissionRepository.hasPermission', { error, userId, permissionCode });
      throw this.errorHandler.createError('Failed to check permission');
    }
  }

  /* IBaseRepository methods implementation */

  /**
   * Find by ID
   */
  async findById(id: number): Promise<Permission | null> {
    try {
      const permission = await this.prisma.permission.findUnique({
        where: { id }
      });
      
      return permission ? this.mapToDomainEntity(permission) : null;
    } catch (error) {
      this.logger.error('Error in PermissionRepository.findById', { error, id });
      throw this.errorHandler.createError('Failed to find permission by ID');
    }
  }

  /**
   * Find one by criteria
   */
  async findOneByCriteria(criteria: Record<string, any>): Promise<Permission | null> {
    try {
      const where = this.processCriteria(criteria);
      
      const permission = await this.prisma.permission.findFirst({ where });
      
      return permission ? this.mapToDomainEntity(permission) : null;
    } catch (error) {
      this.logger.error('Error in PermissionRepository.findOneByCriteria', { error, criteria });
      throw this.errorHandler.createError('Failed to find permission by criteria');
    }
  }

  /**
   * Find by criteria
   */
  async findByCriteria(criteria: Record<string, any>): Promise<Permission[]> {
    try {
      const where = this.processCriteria(criteria);
      
      const permissions = await this.prisma.permission.findMany({ where });
      
      return permissions.map((p: any) => this.mapToDomainEntity(p));
    } catch (error) {
      this.logger.error('Error in PermissionRepository.findByCriteria', { error, criteria });
      throw this.errorHandler.createError('Failed to find permissions by criteria');
    }
  }

  /**
   * Create
   */
  async create(data: Partial<Permission>): Promise<Permission> {
    try {
      const now = new Date();
      
      const permission = await this.prisma.permission.create({
        data: {
          code: data.code || '',
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
    } catch (error) {
      this.logger.error('Error in PermissionRepository.create', { error, data });
      throw this.errorHandler.createError('Failed to create permission');
    }
  }

  /**
   * Update
   */
  async update(id: number, data: Partial<Permission>): Promise<Permission> {
    try {
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
    } catch (error) {
      this.logger.error('Error in PermissionRepository.update', { error, id, data });
      throw this.errorHandler.createError('Failed to update permission');
    }
  }

  /**
   * Delete
   */
  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.permission.delete({
        where: { id }
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error in PermissionRepository.delete', { error, id });
      throw this.errorHandler.createError('Failed to delete permission');
    }
  }

  /**
   * Find all
   */
  async findAll(options?: QueryOptions): Promise<PaginationResult<Permission>> {
    try {
      if (!options) {
        // Return all permissions with default pagination
        const permissions = await this.prisma.permission.findMany();
        const total = permissions.length;
        
        return {
          data: permissions.map((p: any) => this.mapToDomainEntity(p)),
          pagination: {
            page: 1,
            limit: total,
            total,
            totalPages: 1
          }
        };
      }
      
      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;
      
      // Apply sorting
      const orderBy: any = {};
      if (options.sort?.field) {
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
        data: permissions.map((p: any) => this.mapToDomainEntity(p)),
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error('Error in PermissionRepository.findAll', { error, options });
      throw this.errorHandler.createError('Failed to find all permissions');
    }
  }

  /**
   * Count
   */
  async count(criteria?: Record<string, any>): Promise<number> {
    try {
      if (!criteria) {
        return await this.prisma.permission.count();
      }
      
      const where = this.processCriteria(criteria);
      return await this.prisma.permission.count({ where });
    } catch (error) {
      this.logger.error('Error in PermissionRepository.count', { error, criteria });
      throw this.errorHandler.createError('Failed to count permissions');
    }
  }

  /**
   * Bulk update
   */
  async bulkUpdate(ids: number[], data: Partial<Permission>): Promise<number> {
    try {
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
    } catch (error) {
      this.logger.error('Error in PermissionRepository.bulkUpdate', { error, ids, data });
      throw this.errorHandler.createError('Failed to bulk update permissions');
    }
  }

  /**
   * Execute in transaction
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(async () => {
        return callback();
      });
    } catch (error) {
      this.logger.error('Error in PermissionRepository.transaction', { error });
      throw this.errorHandler.createError('Transaction failed');
    }
  }

  /**
   * Log activity for permissions
   */
  async logActivity(userId: number, action: string, details?: string, ipAddress?: string): Promise<any> {
    try {
      return await this.prisma.userActivity.create({
        data: {
          userId,
          activity: action,
          details,
          ipAddress,
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error logging permission activity', { error, userId, action });
      // Don't throw here to avoid breaking the main operation
      return null;
    }
  }

  /**
   * Maps a database entity to a domain entity
   * 
   * @param dbEntity - Database entity
   * @returns Domain entity
   */
  private mapToDomainEntity(dbEntity: any): Permission {
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
  private processCriteria(criteria: Record<string, any>): any {
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
