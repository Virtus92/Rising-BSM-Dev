import { BaseRepository } from '../core/BaseRepository.js';
import { IRoleRepository } from '../interfaces/IRoleRepository.js';
import { Role } from '../entities/Role.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { PrismaClient } from '@prisma/client';
import { QueryOptions, FilterCriteria } from '../interfaces/IBaseRepository.js';

/**
 * RoleRepository
 * 
 * Implementation of IRoleRepository for data access operations related to roles.
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
   * @param name - Role name to search for
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
   * Find system roles
   * 
   * @returns Promise with array of system roles
   */
  async findSystemRoles(): Promise<Role[]> {
    try {
      const roles = await this.prisma.role.findMany({
        where: { isSystem: true }
      });
      
      return roles.map(role => this.mapToDomainEntity(role));
    } catch (error) {
      this.logger.error('Error in RoleRepository.findSystemRoles', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Get roles for a user
   * 
   * @param userId - User ID
   * @returns Promise with array of roles
   */
  async getUserRoles(userId: number): Promise<Role[]> {
    try {
      // Get user roles
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: { role: true }
      });
      
      // Extract and map roles
      return userRoles.map(ur => this.mapToDomainEntity(ur.role));
    } catch (error) {
      this.logger.error('Error in RoleRepository.getUserRoles', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Check if a user has a specific role
   * 
   * @param userId - User ID
   * @param roleName - Role name to check
   * @returns Promise indicating whether the user has the role
   */
  async checkUserRole(userId: number, roleName: string): Promise<boolean> {
    try {
      // Find the role
      const role = await this.prisma.role.findUnique({
        where: { name: roleName }
      });
      
      if (!role) {
        return false;
      }
      
      // Check if user has this role
      const userRole = await this.prisma.userRole.findFirst({
        where: {
          userId,
          roleId: role.id
        }
      });
      
      return !!userRole;
    } catch (error) {
      this.logger.error('Error in RoleRepository.checkUserRole', error instanceof Error ? error : String(error), { userId, roleName });
      throw this.handleError(error);
    }
  }

  /**
   * Assign a role to a user
   * 
   * @param userId - User ID
   * @param roleId - Role ID
   * @returns Promise with success indicator
   */
  async assignRoleToUser(userId: number, roleId: number): Promise<boolean> {
    try {
      // Check if relationship already exists
      const existingUserRole = await this.prisma.userRole.findFirst({
        where: {
          userId,
          roleId
        }
      });
      
      if (existingUserRole) {
        return true; // Already assigned
      }
      
      // Create the relationship
      await this.prisma.userRole.create({
        data: {
          userId,
          roleId
        }
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error in RoleRepository.assignRoleToUser', error instanceof Error ? error : String(error), { userId, roleId });
      throw this.handleError(error);
    }
  }

  /**
   * Remove a role from a user
   * 
   * @param userId - User ID
   * @param roleId - Role ID
   * @returns Promise with success indicator
   */
  async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
    try {
      // Delete the relationship
      const result = await this.prisma.userRole.deleteMany({
        where: {
          userId,
          roleId
        }
      });
      
      return result.count > 0;
    } catch (error) {
      this.logger.error('Error in RoleRepository.removeRoleFromUser', error instanceof Error ? error : String(error), { userId, roleId });
      throw this.handleError(error);
    }
  }

  /**
   * Set user roles (replace existing)
   * 
   * @param userId - User ID
   * @param roleIds - Array of role IDs
   * @returns Promise with number of roles assigned
   */
  async setUserRoles(userId: number, roleIds: number[]): Promise<number> {
    try {
      // Use a transaction to ensure atomicity
      return await this.prisma.$transaction(async (prisma) => {
        // Delete all existing roles
        await prisma.userRole.deleteMany({
          where: { userId }
        });
        
        if (roleIds.length === 0) {
          return 0;
        }
        
        // Create new role assignments
        const createdRoles = await Promise.all(
          roleIds.map(roleId => 
            prisma.userRole.create({
              data: {
                userId,
                roleId
              }
            })
          )
        );
        
        return createdRoles.length;
      });
    } catch (error) {
      this.logger.error('Error in RoleRepository.setUserRoles', error instanceof Error ? error : String(error), { userId, roleIds });
      throw this.handleError(error);
    }
  }

  /**
   * Assign multiple roles to a user
   * 
   * @param userId - User ID
   * @param roleIds - Array of role IDs
   * @returns Promise with number of roles assigned
   */
  async assignRolesToUser(userId: number, roleIds: number[]): Promise<number> {
    try {
      if (roleIds.length === 0) {
        return 0;
      }
      
      // Get existing roles to avoid duplicates
      const existingUserRoles = await this.prisma.userRole.findMany({
        where: { userId }
      });
      
      const existingRoleIds = existingUserRoles.map(ur => ur.roleId);
      
      // Filter out roles that are already assigned
      const newRoleIds = roleIds.filter(id => !existingRoleIds.includes(id));
      
      if (newRoleIds.length === 0) {
        return 0;
      }
      
      // Create role assignments in a transaction
      const createdUserRoles = await this.prisma.$transaction(
        newRoleIds.map(roleId => 
          this.prisma.userRole.create({
            data: {
              userId,
              roleId
            }
          })
        )
      );
      
      return createdUserRoles.length;
    } catch (error) {
      this.logger.error('Error in RoleRepository.assignRolesToUser', error instanceof Error ? error : String(error), { userId, roleIds });
      throw this.handleError(error);
    }
  }

  /**
   * Remove multiple roles from a user
   * 
   * @param userId - User ID
   * @param roleIds - Array of role IDs
   * @returns Promise with number of roles removed
   */
  async removeRolesFromUser(userId: number, roleIds: number[]): Promise<number> {
    try {
      if (roleIds.length === 0) {
        return 0;
      }
      
      // Delete the relationships
      const result = await this.prisma.userRole.deleteMany({
        where: {
          userId,
          roleId: { in: roleIds }
        }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in RoleRepository.removeRolesFromUser', error instanceof Error ? error : String(error), { userId, roleIds });
      throw this.handleError(error);
    }
  }

  /**
   * Get roles for a user
   * 
   * @param userId - User ID
   * @returns Promise with array of roles
   */
  async getRolesForUser(userId: number): Promise<Role[]> {
    try {
      const userRoles = await this.prisma.$queryRaw`
        SELECT r.* FROM "Role" r
        INNER JOIN "UserRole" ur ON r.id = ur."roleId"
        WHERE ur."userId" = ${userId}
      `;
      
      return Array.isArray(userRoles) 
        ? userRoles.map(role => this.mapToDomainEntity(role))
        : [];
    } catch (error) {
      this.logger.error('Error in RoleRepository.getRolesForUser', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Set permissions for a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs
   * @returns Promise with role with updated permissions
   */
  async setPermissions(roleId: number, permissionIds: number[]): Promise<Role> {
    try {
      // First, remove all existing permissions
      await this.prisma.$executeRaw`DELETE FROM "RolePermission" WHERE "roleId" = ${roleId}`;
      
      // Then add the new permissions
      if (permissionIds.length > 0) {
        for (const permId of permissionIds) {
          await this.prisma.$executeRaw`
            INSERT INTO "RolePermission" ("roleId", "permissionId", "createdAt")
            VALUES (${roleId}, ${permId}, ${new Date()})
          `;
        }
      }
      
      // Return the updated role with permissions
      const role = await this.findById(roleId);
      if (!role) {
        throw new Error(`Role with ID ${roleId} not found`);
      }
      
      return role;
    } catch (error) {
      this.logger.error('Error in RoleRepository.setPermissions', error instanceof Error ? error : String(error), { roleId, permissionIds });
      throw this.handleError(error);
    }
  }

  /**
   * Add permissions to a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs
   * @returns Promise with number of permissions added
   */
  async addPermissions(roleId: number, permissionIds: number[]): Promise<number> {
    try {
      let addedCount = 0;
      
      for (const permId of permissionIds) {
        try {
          await this.prisma.$executeRaw`
            INSERT INTO "RolePermission" ("roleId", "permissionId", "createdAt")
            VALUES (${roleId}, ${permId}, ${new Date()})
            ON CONFLICT ("roleId", "permissionId") DO NOTHING
          `;
          addedCount++;
        } catch (error) {
          // Skip duplicates
          this.logger.debug(`Permission ${permId} already assigned to role ${roleId}`);
        }
      }
      
      return addedCount;
    } catch (error) {
      this.logger.error('Error in RoleRepository.addPermissions', error instanceof Error ? error : String(error), { roleId, permissionIds });
      throw this.handleError(error);
    }
  }

  /**
   * Remove permissions from a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs (or all if undefined)
   * @returns Promise with number of permissions removed
   */
  async removePermissions(roleId: number, permissionIds?: number[]): Promise<number> {
    try {
      if (!permissionIds || permissionIds.length === 0) {
        // Remove all permissions
        const result = await this.prisma.$executeRaw`DELETE FROM "RolePermission" WHERE "roleId" = ${roleId}`;
        return Number(result);
      } else {
        // Remove specific permissions
        const placeholders = permissionIds.map(() => '?').join(',');
        const params = [roleId, ...permissionIds];
        const query = `DELETE FROM "RolePermission" WHERE "roleId" = ? AND "permissionId" IN (${placeholders})`;
        
        const result = await this.prisma.$executeRawUnsafe(query, ...params);
        return Number(result);
      }
    } catch (error) {
      this.logger.error('Error in RoleRepository.removePermissions', error instanceof Error ? error : String(error), { roleId, permissionIds });
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
          
        case 'bulkUpdate':
          return await this.prisma.role.updateMany({
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
  protected mapToDomainEntity(ormEntity: any): Role {
    if (!ormEntity) {
      return null as any;
    }
    
    return new Role({
      id: ormEntity.id,
      name: ormEntity.name,
      description: ormEntity.description,
      isSystem: ormEntity.isSystem,
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
    // Remove undefined properties
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
}