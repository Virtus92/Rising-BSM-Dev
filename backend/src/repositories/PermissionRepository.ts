import { BaseRepository } from '../core/BaseRepository.js';
import { IPermissionRepository } from '../interfaces/IPermissionRepository.js';
import { Permission } from '../entities/Permission.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { PrismaClient } from '@prisma/client';
import { QueryOptions, FilterCriteria } from '../interfaces/IBaseRepository.js';

/**
 * PermissionRepository
 * 
 * Implementation of IPermissionRepository for data access operations related to permissions.
 */
export class PermissionRepository extends BaseRepository<Permission, number> implements IPermissionRepository {
  /**
   * Creates a new PermissionRepository instance
   * 
   * @param prisma - Prisma client
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly prisma: PrismaClient,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    // Pass model reference to BaseRepository
    super(prisma.permission, logger, errorHandler);
    
    this.logger.debug('Initialized PermissionRepository');
  }

  /**
   * Find a permission by name
   * 
   * @param name - Permission name to search for
   * @returns Promise with permission or null if not found
   */
  async findByName(name: string): Promise<Permission | null> {
    try {
      const permission = await this.prisma.permission.findUnique({
        where: { name }
      });
      
      return permission ? this.mapToDomainEntity(permission) : null;
    } catch (error) {
      this.logger.error('Error in PermissionRepository.findByName', error instanceof Error ? error : String(error), { name });
      throw this.handleError(error);
    }
  }

  /**
   * Get all permissions by category
   * 
   * @param category - Category name
   * @returns Promise with array of permissions
   */
  async findByCategory(category: string): Promise<Permission[]> {
    try {
      const permissions = await this.prisma.permission.findMany({
        where: { category }
      });
      
      return permissions.map(p => this.mapToDomainEntity(p));
    } catch (error) {
      this.logger.error('Error in PermissionRepository.findByCategory', error instanceof Error ? error : String(error), { category });
      throw this.handleError(error);
    }
  }

  /**
   * Get permissions for a role
   * 
   * @param roleId - Role ID
   * @returns Promise with array of permissions
   */
  async getPermissionsByRole(roleId: number): Promise<Permission[]> {
    try {
      // Get permission IDs from role permissions junction table
      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: { roleId },
        select: { permissionId: true }
      });
      
      // Extract permission IDs
      const permissionIds = rolePermissions.map(rp => rp.permissionId);
      
      if (permissionIds.length === 0) {
        return [];
      }
      
      // Fetch permissions by IDs
      const permissions = await this.prisma.permission.findMany({
        where: { id: { in: permissionIds } }
      });
      
      return permissions.map(p => this.mapToDomainEntity(p));
    } catch (error) {
      this.logger.error('Error in PermissionRepository.getPermissionsByRole', error instanceof Error ? error : String(error), { roleId });
      throw this.handleError(error);
    }
  }

  /**
   * Get permissions for a user based on their roles
   * 
   * @param userId - User ID
   * @returns Promise with array of permissions
   */
  async getUserPermissions(userId: number): Promise<Permission[]> {
    try {
      // Get user roles with their permissions
      const userRolesWithPermissions = await this.prisma.userRole.findMany({
        where: { userId },
        select: {
          role: {
            select: {
              permissions: {
                select: {
                  permission: true
                }
              }
            }
          }
        }
      });
      
      // Extract permissions from all roles, avoiding duplicates
      const permissionMap = new Map<number, any>();
      
      userRolesWithPermissions.forEach(userRole => {
        userRole.role.permissions.forEach(rolePermission => {
          const permission = rolePermission.permission;
          permissionMap.set(permission.id, permission);
        });
      });
      
      // Convert map to array and map to domain entities
      return Array.from(permissionMap.values()).map(p => this.mapToDomainEntity(p));
    } catch (error) {
      this.logger.error('Error in PermissionRepository.getUserPermissions', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Check if a user has a specific permission
   * 
   * @param userId - User ID
   * @param permissionName - Permission name to check
   * @returns Promise indicating whether the user has the permission
   */
  async checkUserPermission(userId: number, permissionName: string): Promise<boolean> {
    try {
      // Find the permission
      const permission = await this.prisma.permission.findUnique({
        where: { name: permissionName }
      });
      
      if (!permission) {
        return false;
      }
      
      // Count the number of user roles that have this permission
      const count = await this.prisma.$queryRaw`
        SELECT COUNT(*) as c
        FROM "UserRole" ur
        JOIN "RolePermission" rp ON ur."roleId" = rp."roleId"
        WHERE ur."userId" = ${userId}
        AND rp."permissionId" = ${permission.id}
      `;
      
      return count[0].c > 0;
    } catch (error) {
      this.logger.error('Error in PermissionRepository.checkUserPermission', error instanceof Error ? error : String(error), { userId, permissionName });
      throw this.handleError(error);
    }
  }

  /**
   * Assign permissions to a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs to assign
   * @returns Promise with the number of permissions assigned
   */
  async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<number> {
    try {
      // Validate that the role exists
      const role = await this.prisma.role.findUnique({
        where: { id: roleId }
      });
      
      if (!role) {
        throw this.errorHandler.createNotFoundError(`Role with ID ${roleId} not found`);
      }
      
      // Get existing permissions for this role to avoid duplicates
      const existingRolePermissions = await this.prisma.rolePermission.findMany({
        where: { roleId }
      });
      
      const existingPermissionIds = existingRolePermissions.map(rp => rp.permissionId);
      
      // Filter out permissions that are already assigned
      const newPermissionIds = permissionIds.filter(id => !existingPermissionIds.includes(id));
      
      if (newPermissionIds.length === 0) {
        return 0;
      }
      
      // Create role-permission relationships in a transaction
      await this.prisma.$transaction(
        newPermissionIds.map(permissionId =>
          this.prisma.rolePermission.create({
            data: {
              roleId,
              permissionId
            }
          })
        )
      );
      
      return newPermissionIds.length;
    } catch (error) {
      this.logger.error('Error in PermissionRepository.assignPermissionsToRole', error instanceof Error ? error : String(error), { roleId, permissionIds });
      throw this.handleError(error);
    }
  }

  /**
   * Remove permissions from a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs to remove
   * @returns Promise with the number of permissions removed
   */
  async removePermissionsFromRole(roleId: number, permissionIds: number[]): Promise<number> {
    try {
      // Delete the role-permission relationships
      const result = await this.prisma.rolePermission.deleteMany({
        where: {
          roleId,
          permissionId: { in: permissionIds }
        }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in PermissionRepository.removePermissionsFromRole', error instanceof Error ? error : String(error), { roleId, permissionIds });
      throw this.handleError(error);
    }
  }

  /**
   * Get all unique categories
   * 
   * @returns Promise with array of category names
   */
  async getAllCategories(): Promise<string[]> {
    try {
      const result = await this.prisma.permission.groupBy({
        by: ['category']
      });
      
      return result.map(item => item.category);
    } catch (error) {
      this.logger.error('Error in PermissionRepository.getAllCategories', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Begin a transaction
   */
  protected async beginTransaction(): Promise<void> {
    // Prisma handles transactions differently, no explicit begin needed
  }

  /**
   * Commit a transaction
   */
  protected async commitTransaction(): Promise<void> {
    // Prisma handles transactions differently, no explicit commit needed
  }

  /**
   * Rollback a transaction
   */
  protected async rollbackTransaction(): Promise<void> {
    // Prisma handles transactions differently, no explicit rollback needed
  }

  /**
   * Execute a query
   * 
   * @param operation - Operation name
   * @param args - Query arguments
   * @returns Promise with query result
   */
  protected async executeQuery(operation: string, ...args: any[]): Promise<any> {
    try {
      switch (operation) {
        case 'findAll':
          return await this.prisma.permission.findMany(args[0]);
          
        case 'findById':
          return await this.prisma.permission.findUnique({
            where: { id: args[0] },
            ...(args[1] || {})
          });
          
        case 'findByCriteria':
          return await this.prisma.permission.findMany({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'findOneByCriteria':
          return await this.prisma.permission.findFirst({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'create':
          return await this.prisma.permission.create({
            data: args[0]
          });
          
        case 'update':
          return await this.prisma.permission.update({
            where: { id: args[0] },
            data: args[1]
          });
          
        case 'delete':
          return await this.prisma.permission.delete({
            where: { id: args[0] }
          });
          
        case 'count':
          return await this.prisma.permission.count({
            where: args[0]
          });
          
        case 'bulkUpdate':
          return await this.prisma.permission.updateMany({
            where: { id: { in: args[0] } },
            data: args[1]
          });
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      this.logger.error(`Error executing query: ${operation}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Process criteria for ORM
   * 
   * @param criteria - Filter criteria
   * @returns ORM-specific criteria
   */
  protected processCriteria(criteria: FilterCriteria): any {
    return criteria;
  }

  /**
   * Build query options for ORM
   * 
   * @param options - Query options
   * @returns ORM-specific query options
   */
  protected buildQueryOptions(options?: QueryOptions): any {
    if (!options) {
      return {};
    }
    
    const result: any = {};
    
    // Add pagination
    if (options.page !== undefined && options.limit !== undefined) {
      result.skip = (options.page - 1) * options.limit;
      result.take = options.limit;
    }
    
    // Add select fields
    if (options.select && options.select.length > 0) {
      result.select = options.select.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    // Add relations
    if (options.relations && options.relations.length > 0) {
      result.include = options.relations.reduce((acc, relation) => {
        acc[relation] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    // Add sorting
    if (options.sort) {
      result.orderBy = {
        [options.sort.field]: options.sort.direction.toLowerCase()
      };
    } else {
      // Default sorting
      result.orderBy = { name: 'asc' };
    }
    
    return result;
  }

  /**
   * Map ORM entity to domain entity
   * 
   * @param ormEntity - ORM entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(ormEntity: any): Permission {
    if (!ormEntity) {
      return null as any;
    }
    
    return new Permission({
      id: ormEntity.id,
      name: ormEntity.name,
      description: ormEntity.description,
      category: ormEntity.category,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt
    });
  }

  /**
   * Map domain entity to ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<Permission>): any {
    // Remove undefined properties
    const result: Record<string, any> = {};
    
    Object.entries(domainEntity).forEach(([key, value]) => {
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    return result;
  }

  /**
   * Check if error is a unique constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a unique constraint violation
   */
  protected isUniqueConstraintError(error: any): boolean {
    return error.code === 'P2002';
  }

  /**
   * Check if error is a foreign key constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a foreign key constraint violation
   */
  protected isForeignKeyConstraintError(error: any): boolean {
    return error.code === 'P2003';
  }

  /**
   * Execute queries directly on the Permission table if the model is not available
   */
  protected async directPermissionQuery(query: string, ...params: any[]): Promise<any> {
    return await this.prisma.$executeRawUnsafe(query, ...params);
  }

  // When accessing permission model through prisma, use a helper
  protected get permissionModel(): any {
    return (this.prisma as any).permission;
  }

  // When accessing rolePermission model through prisma, use a helper
  protected get rolePermissionModel(): any {
    return (this.prisma as any).rolePermission;
  }

  // When accessing userRole model through prisma, use a helper
  protected get userRoleModel(): any {
    return (this.prisma as any).userRole;
  }

  // When accessing role model through prisma, use a helper
  protected get roleModel(): any {
    return (this.prisma as any).role;
  }

  // When accessing count results, use proper type casting
  protected asCountResult(result: any): { count: number } {
    return result as { count: number };
  }

  // Use these methods in your queries - for example:
  // Replace this.prisma.permission with this.permissionModel
  // Replace this.prisma.rolePermission with this.rolePermissionModel
  // etc.

  // For functions with implicit 'any' parameters, add types:
  protected mapDomainEntities(items: any[]): Permission[] {
    return items.map((item: any) => this.mapToDomainEntity(item));
  }
}