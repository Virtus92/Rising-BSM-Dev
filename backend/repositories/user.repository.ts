/**
 * User Repository
 * 
 * Data access layer for user operations.
 * Implements database operations for user entity.
 * @module repositories/user
 */
import { PrismaClient, User, Prisma } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository.js';
import { FindManyOptions } from '../types/repository.types.js';
import { UserFilterParams } from '../types/dtos/user.dto.js';
import { QueryBuilder } from '../utils/data.utils.js';
import { logger } from '../utils/common.utils.js';
import { DatabaseError } from '../utils/error.utils.js';
import { sanitizeLikeString } from '../utils/data.utils.js';
import { inject } from '../config/dependency-container.js';

/**
 * Repository for user operations
 */
export class UserRepository extends BaseRepository<User, UserFilterParams> {
  /**
   * Creates a new UserRepository instance
   */
  constructor() {
    // Get PrismaClient instance from dependency container
    const prisma = inject<PrismaClient>('PrismaClient');
    super(prisma, prisma.user);
  }

  /**
   * Build Prisma where conditions from filter parameters
   * @param filters Filter criteria
   * @returns Prisma-compatible where conditions
   */
  protected buildFilterConditions(filters: UserFilterParams): any {
    const queryBuilder = new QueryBuilder();

    // Add status filter
    if (filters.status) {
      queryBuilder.addFilter('status', filters.status);
    }
    
    // Add role filter
    if (filters.role) {
      queryBuilder.addFilter('role', filters.role);
    }
    
    // Add search filter across multiple fields
    if (filters.search) {
      queryBuilder.addSearch(filters.search, ['name', 'email', 'phone']);
    }
    
    // Add date range filter
    if (filters.startDate || filters.endDate) {
      queryBuilder.addDateRangeBetween('createdAt', filters.startDate, filters.endDate);
    }
    
    return queryBuilder.build();
  }

  /**
   * Find user by email
   * @param email Email to search for
   * @returns User if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.model.findUnique({
        where: { email }
      });
    } catch (error) {
      logger.error('Error finding user by email', { error, email });
      throw new DatabaseError('Failed to find user by email', { cause: error });
    }
  }

  /**
   * Find users by role
   * @param role Role to search for
   * @param options Query options
   * @returns List of users with the specified role
   */
  async findByRole(
    role: string, 
    options: FindManyOptions = {}
  ): Promise<{ data: User[]; pagination: any }> {
    try {
      const filters: UserFilterParams = { role };
      return this.findAll(filters, options);
    } catch (error) {
      logger.error('Error finding users by role', { error, role });
      throw new DatabaseError('Failed to find users by role', { cause: error });
    }
  }

  /**
   * Search users with advanced filtering
   * @param term Search term
   * @param options Query options
   * @returns List of matching users
   */
  async searchUsers(
    term: string, 
    options: FindManyOptions = {}
  ): Promise<{ data: User[]; pagination: any }> {
    try {
      // Sanitize the search term
      const sanitizedTerm = sanitizeLikeString(term);
      
      // Build where conditions using QueryBuilder
      const queryBuilder = new QueryBuilder();
      queryBuilder.addSearch(sanitizedTerm, ['name', 'email', 'phone']);
      
      // Add status filter (only active/inactive, not deleted users)
      queryBuilder.addFilter('status', { notIn: ['deleted'] });
      
      // Process pagination
      const page = Math.max(1, options.page || 1);
      const limit = Math.max(1, options.limit || 20);
      const skip = (page - 1) * limit;
      
      // Build order by
      const orderBy: any = options.orderBy || { createdAt: 'desc' };
      
      // Execute count query to get total results
      const total = await this.model.count({
        where: queryBuilder.build()
      });
      
      // Execute main query with pagination
      const data = await this.model.findMany({
        where: queryBuilder.build(),
        skip,
        take: limit,
        orderBy,
        include: options.include,
        select: options.select
      });
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const pagination = {
        current: page,
        limit,
        total: totalPages,
        totalRecords: total
      };
      
      return { data, pagination };
    } catch (error) {
      logger.error('Error searching users', { error, term });
      throw new DatabaseError('Failed to search users', { cause: error });
    }
  }

  /**
   * Update user password
   * @param id User ID
   * @param hashedPassword New hashed password
   * @returns Updated user
   */
  async updatePassword(id: number, hashedPassword: string): Promise<User> {
    try {
      return await this.model.update({
        where: { id },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error updating user password', { error, id });
      throw new DatabaseError('Failed to update user password', { cause: error });
    }
  }

  /**
   * Bulk update users
   * @param ids Array of user IDs
   * @param data Data to update
   * @returns Count of updated records
   */
  async bulkUpdate(ids: number[], data: Partial<User>): Promise<number> {
    try {
      // Ensure IDs array is not empty
      if (!ids.length) {
        return 0;
      }
      
      // Update all users with the provided IDs
      const result = await this.model.updateMany({
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
      logger.error('Error bulk updating users', { error, ids, data });
      throw new DatabaseError('Failed to bulk update users', { cause: error });
    }
  }

  /**
   * Get user activity
   * @param userId User ID
   * @param limit Maximum number of activities to return
   * @returns List of user activities
   */
  async getUserActivity(userId: number, limit: number = 10): Promise<any[]> {
    try {
      return await this.prisma.userActivity.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit
      });
    } catch (error) {
      logger.error('Error getting user activity', { error, userId });
      throw new DatabaseError('Failed to get user activity', { cause: error });
    }
  }

  /**
   * Log user activity
   * @param userId User ID
   * @param activity Activity description
   * @param ipAddress IP address (optional)
   * @returns Created activity log
   */
  async logActivity(userId: number, activity: string, ipAddress?: string): Promise<any> {
    try {
      return await this.prisma.userActivity.create({
        data: {
          userId,
          activity,
          ipAddress,
          timestamp: new Date()
        }
      });
    } catch (error) {
      // Log error but don't throw - avoid disrupting main operations for logging failures
      logger.error('Error logging user activity', { error, userId, activity });
      return null;
    }
  }
}