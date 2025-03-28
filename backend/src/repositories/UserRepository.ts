import { BaseRepository } from '../core/BaseRepository.js';
import { IUserRepository } from '../interfaces/IUserRepository.js';
import { User, UserRole, UserStatus } from '../entities/User.js';
import { UserFilterParams } from '../dtos/UserDtos.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { QueryOptions } from '../interfaces/IBaseRepository.js';
import { PrismaClient } from '@prisma/client';

/**
 * UserRepository
 * 
 * Implementation of IUserRepository for database operations related to User entities.
 * Extends BaseRepository to leverage common CRUD operations.
 */
export class UserRepository extends BaseRepository<User, number> implements IUserRepository {
  /**
   * Creates a new UserRepository instance
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
    // Pass user model to BaseRepository
    super(prisma.user, logger, errorHandler);
    
    this.logger.debug('Initialized UserRepository');
  }
  /**
   * Find a user by name
   * 
   * @param name - name to search for
   * @returns Promise with user or null
   */
  async findByName(name: string): Promise<User | null> {
    try {
      this.logger.debug(`Finding user by name: ${name}`);
      
      const user = await this.prisma.user.findFirst({
        where: { 
          name: { 
            equals: name,
            mode: 'insensitive'
          },
          status: { not: UserStatus.DELETED }
        }
      });
      
      return user ? this.mapToDomainEntity(user) : null;
    } catch (error) {
      this.logger.error('Error in UserRepository.findByName', error instanceof Error ? error : String(error), { name });
      throw this.handleError(error);
    }
  }

  // Transaction property for managing DB transactions
  public transaction: any = null;

  /**
   * Find a user by email
   * 
   * @param email - Email to search for
   * @returns Promise with user or null
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      this.logger.debug(`Finding user by email: ${email}`);
      
      const user = await this.prisma.user.findUnique({
        where: { email }
      });
      
      return user ? this.mapToDomainEntity(user) : null;
    } catch (error) {
      this.logger.error('Error in UserRepository.findByEmail', error instanceof Error ? error : String(error), { email });
      throw this.handleError(error);
    }
  }

  /**
   * Find users with advanced filtering
   * 
   * @param filters - Filter parameters
   * @returns Promise with users and pagination info
   */
  async findUsers(filters: UserFilterParams): Promise<{ data: User[]; pagination: any }> {
    try {
      // Build WHERE conditions
      const where = this.buildUserFilters(filters);
      
      // Extract pagination parameters
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;
      
      // Build ORDER BY
      const orderBy: any = {};
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortDirection || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }
      
      // Execute count query
      const total = await this.prisma.user.count({ where });
      
      // Execute main query
      const users = await this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy
      });
      
      // Map to domain entities
      const data = users.map(user => this.mapToDomainEntity(user));
      
      // Calculate pagination metadata
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
      this.logger.error('Error in UserRepository.findUsers', error instanceof Error ? error : String(error), { filters });
      throw this.handleError(error);
    }
  }

  /**
   * Search users by name or email
   * 
   * @param searchText - Search text
   * @param options - Query options
   * @returns Promise with matching users
   */
  async searchUsers(searchText: string, options?: QueryOptions): Promise<User[]> {
    try {
      // Sanitize search text
      const search = searchText.trim();
      
      // Extract pagination parameters
      const limit = options?.limit || 10;
      const skip = options?.page ? (options.page - 1) * limit : 0;
      
      // Execute search query - search by name or email
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ],
          status: { not: UserStatus.DELETED }
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      });
      
      // Map to domain entities
      return users.map(user => this.mapToDomainEntity(user));
    } catch (error) {
      this.logger.error('Error in UserRepository.searchUsers', error instanceof Error ? error : String(error), { searchText });
      throw this.handleError(error);
    }
  }

  /**
   * Update user password
   * 
   * @param userId - User ID
   * @param hashedPassword - New hashed password
   * @returns Promise with updated user
   */
  async updatePassword(userId: number, hashedPassword: string): Promise<User> {
    try {
      // Update password
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      });
      
      // Map to domain entity
      return this.mapToDomainEntity(user);
    } catch (error) {
      this.logger.error('Error in UserRepository.updatePassword', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Bulk update multiple users
   * 
   * @param ids - Array of user IDs
   * @param data - Update data
   * @returns Promise with count of updated users
   */
  async bulkUpdate(ids: number[], data: Partial<User>): Promise<number> {
    try {
      // Ensure the IDs are valid
      if (!ids.length) {
        return 0;
      }
      
      // Prepare data for Prisma
      const updateData = this.mapToORMEntity(data);
      
      // Perform the update
      const result = await this.prisma.user.updateMany({
        where: { id: { in: ids } },
        data: updateData
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in bulk update', error instanceof Error ? error : String(error), { ids, data });
      throw this.handleError(error);
    }
  }

  /**
   * Get user activity history
   * 
   * @param userId - User ID
   * @param limit - Maximum number of activities to return
   * @returns Promise with activity history
   */
  async getUserActivity(userId: number, limit: number = 10): Promise<any[]> {
    try {
      const activities = await this.prisma.userActivity.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit
      });
      
      return activities;
    } catch (error) {
      this.logger.error('Error in UserRepository.getUserActivity', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Log user activity
   * 
   * @param userId - User ID
   * @param activityType - Activity type
   * @param details - Activity details
   * @param ipAddress - IP address
   * @returns Promise with created activity
   */
  async logActivity(
    userId: number, 
    activityType: string, 
    details?: string,
    ipAddress?: string
  ): Promise<any> {
    try {      
      this.logger.info(`Logging activity for user ${userId}: ${activityType}`);

      return await this.prisma.userActivity.create({
        data: {
          userId,
          activity: activityType,
          ipAddress,
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error in UserRepository.logActivity', error instanceof Error ? error : String(error), { 
        userId, 
        activityType 
      });
      return null;
    }
  }

  /**
   * Permanently delete a user from the database
   * 
   * @param userId - User ID
   * @returns Promise indicating success
   */
  async hardDelete(userId: number): Promise<boolean> {
    try {
      this.logger.debug(`Hard deleting user with ID: ${userId}`);
      
      // Delete the user's activity records first to avoid foreign key constraints
      await this.prisma.userActivity.deleteMany({
        where: { userId }
      });
      
      // Delete the user record
      await this.prisma.user.delete({
        where: { id: userId }
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error in UserRepository.hardDelete', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Begin a transaction
   */
  protected async beginTransaction(): Promise<void> {
    // Prisma transactions are handled differently
    // This is a placeholder for the BaseRepository implementation
  }

  /**
   * Commit a transaction
   */
  protected async commitTransaction(): Promise<void> {
    if (this.transaction) {
      // Prisma handles this automatically
      this.transaction = null;
    }
  }

  /**
   * Rollback a transaction
   */
  protected async rollbackTransaction(): Promise<void> {
    if (this.transaction) {
      // Prisma handles this automatically
      this.transaction = null;
    }
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
      const model = this.prisma.user;
      
      switch (operation) {
        case 'findAll':
          return await model.findMany(args[0]);
          
        case 'findById':
          return await model.findUnique({
            where: { id: args[0] },
            ...(args[1] || {})
          });
          
        case 'findByCriteria':
          return await model.findMany({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'findOneByCriteria':
          return await model.findFirst({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'create':
          return await model.create({
            data: args[0]
          });
          
        case 'update':
          return await model.update({
            where: { id: args[0] },
            data: args[1]
          });
          
        case 'delete':
          // Soft delete by default
          return await model.update({
            where: { id: args[0] },
            data: { 
              status: UserStatus.DELETED,
              updatedAt: new Date()
            }
          });
          
        case 'count':
          return await model.count({
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
    }
    
    return result;
  }

  /**
   * Process criteria for ORM
   * 
   * @param criteria - Filter criteria
   * @returns ORM-specific criteria
   */
  protected processCriteria(criteria: Record<string, any>): any {
    // Simple conversion - in a real implementation, this would be more robust
    return criteria;
  }

  /**
   * Map ORM entity to domain entity
   * 
   * @param ormEntity - ORM entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(ormEntity: any): User {
    if (!ormEntity) {
      return null as any;
    }
    
    return new User({
      id: ormEntity.id,
      name: ormEntity.name,
      email: ormEntity.email,
      password: ormEntity.password,
      role: ormEntity.role,
      phone: ormEntity.phone,
      status: ormEntity.status,
      profilePicture: ormEntity.profilePicture,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      lastLoginAt: ormEntity.lastLoginAt,
      resetToken: ormEntity.resetToken,
      resetTokenExpiry: ormEntity.resetTokenExpiry
    });
  }

  /**
   * Map domain entity to ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<User>): any {
    // Remove undefined properties
    const result: Record<string, any> = {};
    
    Object.entries(domainEntity).forEach(([key, value]) => {
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    // Set timestamps for creates/updates
    if (!result.createdAt && !result.id) {
      result.createdAt = new Date();
    }
    
    result.updatedAt = new Date();
    
    return result;
  }

  /**
   * Check if error is a unique constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a unique constraint violation
   */
  protected isUniqueConstraintError(error: any): boolean {
    // Prisma-specific unique constraint error code
    return error.code === 'P2002';
  }

  /**
   * Check if error is a foreign key constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a foreign key constraint violation
   */
  protected isForeignKeyConstraintError(error: any): boolean {
    // Prisma-specific foreign key constraint error code
    return error.code === 'P2003';
  }

  /**
   * Build user-specific filters
   * 
   * @param filters - User filter parameters
   * @returns ORM-specific where conditions
   */
  protected buildUserFilters(filters: UserFilterParams): any {
    const where: any = {};
    
    // Add search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    // Add role filter
    if (filters.role) {
      where.role = filters.role;
    }
    
    // Add status filter
    if (filters.status) {
      where.status = filters.status;
    } else {
      // Exclude deleted users by default
      where.status = { not: UserStatus.DELETED };
    }
    
    // Add date range filters
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }
    
    return where;
  }
}