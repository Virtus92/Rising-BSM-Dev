import { BaseRepository } from '../core/BaseRepository.js';
import { IPermissionRepository } from '../interfaces/IPermissionRepository.js';
import { Permission } from '../entities/Permission.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { PrismaClient } from '@prisma/client';
import { QueryOptions, FilterCriteria } from '../interfaces/IBaseRepository.js';

/**
 * Implementation of IPermissionRepository for database operations.
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
   * @param name - Permission name
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
   * Find permissions by category
   * 
   * @param category - Permission category
   * @returns Promise with permissions in that category
   */
  async findByCategory(category: string): Promise<Permission[]> {
    try {
      const permissions = await this.prisma.permission.findMany({
        where: { category }
      });
      
      return permissions.map(permission => this.mapToDomainEntity(permission));
    } catch (error) {
      this.logger.error('Error in PermissionRepository.findByCategory', error instanceof Error ? error : String(error), { category });
      throw this.handleError(error);
    }
  }

  /**
   * Get all permission categories
   * 
   * @returns Promise with unique category names
   */
  async getAllCategories(): Promise<string[]> {
    try {
      // Use distinct to get unique categories
      const categories = await this.prisma.permission.findMany({
        distinct: ['category'],
        select: { category: true }
      });
      
      return categories.map(c => c.category);
    } catch (error) {
      this.logger.error('Error in PermissionRepository.getAllCategories', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Check if a user has a specific permission
   * 
   * @param userId - User ID
   * @param permissionName - Permission name
   * @returns Promise with boolean indicating if user has permission
   */
  async checkUserPermission(userId: number, permissionName: string): Promise<boolean> {
    try {
      // Query to check if user has the permission through roles
      const count = await this.prisma.permission.count({
        where: {
          name: permissionName,
          roles: {
            some: {
              role: {
                users: {
                  some: {
                    userId
                  }
                }
              }
            }
          }
        }
      });
      
      return count > 0;
    } catch (error) {
      this.logger.error('Error in PermissionRepository.checkUserPermission', error instanceof Error ? error : String(error), { userId, permissionName });
      throw this.handleError(error);
    }
  }

  /**
   * Get all permissions for a user
   * 
   * @param userId - User ID
   * @returns Promise with user's permissions
   */
  async getUserPermissions(userId: number): Promise<Permission[]> {
    try {
      // Get all permissions assigned to the user's roles
      const permissions = await this.prisma.permission.findMany({
        where: {
          roles: {
            some: {
              role: {
                users: {
                  some: {
                    userId
                  }
                }
              }
            }
          }
        }
      });
      
      return permissions.map(permission => this.mapToDomainEntity(permission));
    } catch (error) {
      this.logger.error('Error in PermissionRepository.getUserPermissions', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Create multiple permissions at once
   * 
   * @param permissions - Array of permission data
   * @returns Promise with created permissions
   */
  async createMany(permissions: Partial<Permission>[]): Promise<Permission[]> {
    try {
      // Start a transaction to create all permissions
      const createdPermissions = await this.prisma.$transaction(
        permissions.map(permission => 
          this.prisma.permission.create({
            data: this.mapToORMEntity(permission)
          })
        )
      );
      
      return createdPermissions.map(permission => this.mapToDomainEntity(permission));
    } catch (error) {
      this.logger.error('Error in PermissionRepository.createMany', error instanceof Error ? error : String(error));
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
   * Update multiple permissions in bulk
   * 
   * @param ids - Array of permission IDs
   * @param data - Data to update
   * @returns Promise with count of updated permissions
   */
  async bulkUpdate(ids: number[], data: Partial<Permission>): Promise<number> {
    try {
      const result = await this.prisma.permission.updateMany({
        where: { id: { in: ids } },
        data: this.mapToORMEntity(data)
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in PermissionRepository.bulkUpdate', error instanceof Error ? error : String(error), { ids });
      throw this.handleError(error);
    }
  }
}