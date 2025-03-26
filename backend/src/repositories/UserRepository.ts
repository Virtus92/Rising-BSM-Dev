import { BaseRepository } from '../core/BaseRepository.js';
import { IUserRepository } from '../interfaces/IUserRepository.js';
import { User, UserRole, UserStatus } from '../entities/User.js';
import { UserFilterParams } from '../dtos/UserDtos.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { QueryOptions } from '../interfaces/IBaseRepository.js';

/**
 * UserRepository
 * 
 * Implementation of IUserRepository for database operations related to User entities.
 * Extends BaseRepository to leverage common CRUD operations.
 */
export class UserRepository extends BaseRepository<User, number, any> implements IUserRepository {
  /**
   * Creates a new UserRepository instance
   * 
   * @param dbClient - Database client (e.g., Prisma, Sequelize, etc.)
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly dbClient: any,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    // Pass model reference to BaseRepository
    super(dbClient.user, logger, errorHandler);
    
    this.logger.debug('Initialized UserRepository');
  }

  /**
   * Find a user by username
   * 
   * @param username - Username to search for
   * @returns Promise with user or null
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      const user = await this.dbClient.user.findUnique({
        where: { username }
      });
      
      return user ? this.mapToDomainEntity(user) : null;
    } catch (error) {
      this.logger.error('Error in UserRepository.findByUsername', error instanceof Error ? error : String(error), { username });
      throw this.handleError(error);
    }
  }

  /**
   * Find a user by email
   * 
   * @param email - Email to search for
   * @returns Promise with user or null
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.dbClient.user.findUnique({
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
      const total = await this.dbClient.user.count({ where });
      
      // Execute main query
      const users = await this.dbClient.user.findMany({
        where,
        skip,
        take: limit,
        orderBy
      });
      
      // Map to domain entities
      const data = users.map((user: any) => this.mapToDomainEntity(user));
      
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
      
      // Execute search query
      const users = await this.dbClient.user.findMany({
        where: {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } }
          ],
          status: { not: UserStatus.DELETED }
        },
        skip,
        take: limit,
        orderBy: { username: 'asc' }
      });
      
      // Map to domain entities
      return users.map((user: any) => this.mapToDomainEntity(user));
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
      const user = await this.dbClient.user.update({
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
    
    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();
    
    // Perform the update
    const result = await this.dbClient.user.updateMany({
      where: { id: { in: ids } },
      data: updateData
    });
    
    return result.count;
  } catch (error) {
    this.logger.error('Error in bulkUpdate', error instanceof Error ? error : String(error), { ids, data });
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
      const activities = await this.dbClient.userActivity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
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
      return await this.dbClient.userActivity.create({
        data: {
          userId,
          type: activityType,
          details,
          ipAddress,
          createdAt: new Date()
        }
      });
    } catch (error) {
      // Log error but don't throw - avoid disrupting main operations for logging failures
      this.logger.error('Error in UserRepository.logActivity', error instanceof Error ? error : String(error), { 
        userId, 
        activityType 
      });
      return null;
    }
  }

  /**
   * Begin a transaction
   */
  protected async beginTransaction(): Promise<void> {
    // Most ORMs use a different approach, but this is a typical pattern
    this.transaction = await this.dbClient.$transaction.start();
  }

  /**
   * Commit a transaction
   */
  protected async commitTransaction(): Promise<void> {
    if (this.transaction) {
      await this.transaction.commit();
      this.transaction = null;
    }
  }

  /**
   * Rollback a transaction
   */
  protected async rollbackTransaction(): Promise<void> {
    if (this.transaction) {
      await this.transaction.rollback();
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
      // Use transaction if available
      const client = this.transaction || this.dbClient;
      
      switch (operation) {
        case 'findAll':
          return await client.user.findMany(args[0]);
          
        case 'findById':
          return await client.user.findUnique({
            where: { id: args[0] },
            ...(args[1] || {})
          });
          
        case 'findByCriteria':
          return await client.user.findMany({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'findOneByCriteria':
          return await client.user.findFirst({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'create':
          return await client.user.create({
            data: args[0]
          });
          
        case 'update':
          return await client.user.update({
            where: { id: args[0] },
            data: args[1]
          });
          
        case 'delete':
          // Soft delete by default
          return await client.user.update({
            where: { id: args[0] },
            data: { 
              status: UserStatus.DELETED,
              updatedAt: new Date()
            }
          });
          
        case 'count':
          return await client.user.count({
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
      username: ormEntity.username,
      email: ormEntity.email,
      password: ormEntity.password,
      firstName: ormEntity.firstName,
      lastName: ormEntity.lastName,
      role: ormEntity.role as UserRole,
      status: ormEntity.status as UserStatus,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      createdBy: ormEntity.createdBy,
      updatedBy: ormEntity.updatedBy,
      lastLoginAt: ormEntity.lastLoginAt
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
    // Implement based on your ORM's error structure
    // Example for Prisma:
    return error.code === 'P2002';
  }

  /**
   * Check if error is a foreign key constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a foreign key constraint violation
   */
  protected isForeignKeyConstraintError(error: any): boolean {
    // Implement based on your ORM's error structure
    // Example for Prisma:
    return error.code === 'P2003';
  }

  /**
   * Build user-specific filters
   * 
   * @param filters - User filter parameters
   * @returns ORM-specific where conditions
   */
  private buildUserFilters(filters: UserFilterParams): any {
    const where: any = {};
    
    // Add search filter
    if (filters.search) {
      where.OR = [
        { username: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } }
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
  
  // Transaction property for managing DB transactions
  public transaction: any = null;
}