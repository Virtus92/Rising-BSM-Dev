import { BaseRepository } from '../core/BaseRepository.js';
import { IRoleRepository } from '../interfaces/IRoleRepository.js';
import { Role } from '../entities/Role.js';
import { Permission } from '../entities/Permission.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { PrismaClient } from '@prisma/client';
import { QueryOptions, FilterCriteria } from '../interfaces/IBaseRepository.js';

/**
 * Implementation of IRoleRepository for database operations.
 */
export class RoleRepository extends BaseRepository<Role, number> implements IRoleRepository {
  /**
   * Creates a new RoleRepository instance
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
    super(prisma.role, logger, errorHandler);
    this.logger.debug('Initialized RoleRepository');
  }

  /**
   * Find a role by name
   * 
   * @param name - Role name
   * @returns Promise with role or null if not found
   */
  async findByName(name: string): Promise<Role | null> {
    try {
      const role = await this.prisma.role.findUnique({
        where: { name }
      });
      
      return role ? this.mapToDomainEntity(role) : null;
    } catch (error) {
      this.logger.error('Error in RoleRepository.findByName', error instanceof Error ? error : String(error), { name });
      throw this.handleError(error);
    }
  }

  /**
   * Find a role by ID and include its permissions
   * 
   * @param id - Role ID
   * @returns Promise with role including permissions
   */
  async findByIdWithPermissions(id: number): Promise<Role | null> {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
      
      if (!role) {
        return null;
      }
      
      // Transform the result to match our domain model
      const domainRole = this.mapToDomainEntity(role);
      
      // Extract permissions from the join table
      const permissions = role.permissions.map(rp => rp.permission);
      
      // Set the permissions on the role
      domainRole.permissions = permissions.map(p => p.name);
      
      return domainRole;
    } catch (error) {
      this.logger.error('Error in RoleRepository.findByIdWithPermissions', error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Find all roles with their permissions
   * 
   * @returns Promise with roles including permissions
   */
  async findAllWithPermissions(): Promise<Role[]> {
    try {
      const roles = await this.prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
      
      // Transform the results to match our domain model
      return roles.map(role => {
        const domainRole = this.mapToDomainEntity(role);
        
        // Extract permissions from the join table
        const permissions = role.permissions.map(rp => rp.permission);
        
        // Set the permissions on the role
        domainRole.permissions = permissions.map(p => p.name);
        
        return domainRole;
      });
    } catch (error) {
      this.logger.error('Error in RoleRepository.findAllWithPermissions', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Get permissions assigned to a role
   * 
   * @param roleId - Role ID
   * @returns Promise with role's permissions
   */
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    try {
      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: { roleId },
        include: {
          permission: true
        }
      });
      
      // Extract and transform permissions
      return rolePermissions.map(rp => new Permission({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        category: rp.permission.category,
        createdAt: rp.permission.createdAt,
        updatedAt: rp.permission.updatedAt
      }));
    } catch (error) {
      this.logger.error('Error in RoleRepository.getRolePermissions', error instanceof Error ? error : String(error), { roleId });
      throw this.handleError(error);
    }
  }

  /**
   * Add permissions to a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Permission IDs to add
   * @returns Promise with success indicator
   */
  async addPermissions(roleId: number, permissionIds: number[]): Promise<boolean> {
    try {
      // Check which permissions are already assigned to avoid duplicates
      const existingPermissions = await this.prisma.rolePermission.findMany({
        where: {
          roleId,
          permissionId: { in: permissionIds }
        },
        select: {
          permissionId: true
        }
      });
      
      const existingIds = new Set(existingPermissions.map(ep => ep.permissionId));
      
      // Filter out permissions that are already assigned
      const newPermissionIds = permissionIds.filter(id => !existingIds.has(id));
      
      if (newPermissionIds.length === 0) {
        // No new permissions to add
        return true;
      }
      
      // Create the role-permission relationships
      await this.prisma.rolePermission.createMany({
        data: newPermissionIds.map(permissionId => ({
          roleId,
          permissionId,
          createdAt: new Date()
        })),
        skipDuplicates: true
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error in RoleRepository.addPermissions', error instanceof Error ? error : String(error), { roleId, permissionIds });
      throw this.handleError(error);
    }
  }

  /**
   * Remove permissions from a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Permission IDs to remove
   * @returns Promise with success indicator
   */
  async removePermissions(roleId: number, permissionIds: number[]): Promise<boolean> {
    try {
      // Delete the role-permission relationships
      await this.prisma.rolePermission.deleteMany({
        where: {
          roleId,
          permissionId: { in: permissionIds }
        }
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error in RoleRepository.removePermissions', error instanceof Error ? error : String(error), { roleId, permissionIds });
      throw this.handleError(error);
    }
  }

  /**
   * Replace all permissions for a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - New permission IDs
   * @returns Promise with success indicator
   */
  async replacePermissions(roleId: number, permissionIds: number[]): Promise<boolean> {
    try {
      // Use a transaction to ensure atomicity
      await this.prisma.$transaction(async (prisma) => {
        // Delete all existing role-permission relationships
        await prisma.rolePermission.deleteMany({
          where: { roleId }
        });
        
        // Create the new role-permission relationships
        if (permissionIds.length > 0) {
          await prisma.rolePermission.createMany({
            data: permissionIds.map(permissionId => ({
              roleId,
              permissionId,
              createdAt: new Date()
            }))
          });
        }
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error in RoleRepository.replacePermissions', error instanceof Error ? error : String(error), { roleId, permissionIds });
      throw this.handleError(error);
    }
  }

  /**
   * Get user roles with their permissions
   * 
   * @param userId - User ID
   * @returns Promise with user's roles including permissions
   */
  async getUserRoles(userId: number): Promise<Role[]> {
    try {
      // Get user's roles
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });
      
      // Transform to domain entities
      return userRoles.map(ur => {
        const domainRole = this.mapToDomainEntity(ur.role);
        
        // Extract permissions from the join table
        const permissions = ur.role.permissions.map(rp => rp.permission);
        
        // Set the permissions on the role
        domainRole.permissions = permissions.map(p => p.name);
        
        return domainRole;
      });
    } catch (error) {
      this.logger.error('Error in RoleRepository.getUserRoles', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Assign roles to a user
   * 
   * @param userId - User ID
   * @param roleIds - Role IDs to assign
   * @returns Promise with success indicator
   */
  async assignRolesToUser(userId: number, roleIds: number[]): Promise<boolean> {
    try {
      // Check which roles are already assigned to avoid duplicates
      const existingRoles = await this.prisma.userRole.findMany({
        where: {
          userId,
          roleId: { in: roleIds }
        },
        select: {
          roleId: true
        }
      });
      
      const existingIds = new Set(existingRoles.map(er => er.roleId));
      
      // Filter out roles that are already assigned
      const newRoleIds = roleIds.filter(id => !existingIds.has(id));
      
      if (newRoleIds.length === 0) {
        // No new roles to assign
        return true;
      }
      
      // Create the user-role relationships
      await this.prisma.userRole.createMany({
        data: newRoleIds.map(roleId => ({
          userId,
          roleId,
          createdAt: new Date()
        })),
        skipDuplicates: true
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error in RoleRepository.assignRolesToUser', error instanceof Error ? error : String(error), { userId, roleIds });
      throw this.handleError(error);
    }
  }

  /**
   * Remove roles from a user
   * 
   * @param userId - User ID
   * @param roleIds - Role IDs to remove
   * @returns Promise with success indicator
   */
  async removeRolesFromUser(userId: number, roleIds: number[]): Promise<boolean> {
    try {
      // Delete the user-role relationships
      await this.prisma.userRole.deleteMany({
        where: {
          userId,
          roleId: { in: roleIds }
        }
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error in RoleRepository.removeRolesFromUser', error instanceof Error ? error : String(error), { userId, roleIds });
      throw this.handleError(error);
    }
  }

  /**
   * Begin a transaction
   */
  protected async beginTransaction(): Promise<void> {
    // Prisma handles transactions differently, so this is a placeholder
  }

  /**
   * Commit a transaction
   */
  protected async commitTransaction(): Promise<void> {
    // Prisma handles transactions differently, so this is a placeholder
  }

  /**
   * Rollback a transaction
   */
  protected async rollbackTransaction(): Promise<void> {
    // Prisma handles transactions differently, so this is a placeholder
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
          return await this.prisma.role.findMany(args[0]);
          
        case 'findById':
          return await this.prisma.role.findUnique({
            where: { id: args[0] },
            ...(args[1] || {})
          });
          
        case 'findByCriteria':
          return await this.prisma.role.findMany({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'findOneByCriteria':
          return await this.prisma.role.findFirst({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'create':
          return await this.prisma.role.create({
            data: args[0]
          });
          
        case 'update':
          return await this.prisma.role.update({
            where: { id: args[0] },
            data: args[1]
          });
          
        case 'delete':
          return await this.prisma.role.delete({
            where: { id: args[0] }
          });
          
        case 'count':
          return await this.prisma.role.count({
            where: args[0]
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
   * Process criteria for ORM
   * 
   * @param criteria - Filter criteria
   * @returns ORM-specific criteria
   */
  protected processCriteria(criteria: FilterCriteria): any {
    // Simple pass-through for most cases
    return criteria;
  }

  /**
   * Map ORM entity to domain entity
   * 
   * @param ormEntity - ORM entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(ormEntity: any): Role {
    if (!ormEntity) {
      return null as any;
    }
    
    return new Role({
      id: ormEntity.id,
      name: ormEntity.name,
      description: ormEntity.description,
      isSystem: ormEntity.isSystem,
      permissions: [], // Will be populated separately when needed
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      createdBy: ormEntity.createdBy,
      updatedBy: ormEntity.updatedBy
    });
  }

  /**
   * Map domain entity to ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<Role>): any {
    // Remove undefined properties and properties that don't map directly to the database
    const result: Record<string, any> = {};
    
    Object.entries(domainEntity).forEach(([key, value]) => {
      if (value !== undefined && key !== 'permissions') {
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
   * Update multiple roles in bulk
   * 
   * @param ids - Array of role IDs
   * @param data - Data to update
   * @returns Promise with count of updated roles
   */
  async bulkUpdate(ids: number[], data: Partial<Role>): Promise<number> {
    try {
      const result = await this.prisma.role.updateMany({
        where: { id: { in: ids } },
        data: this.mapToORMEntity(data)
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in RoleRepository.bulkUpdate', error instanceof Error ? error : String(error), { ids });
      throw this.handleError(error);
    }
  }
}