/**
 * User Repository
 * 
 * Repository for User entity operations providing data access and persistence.
 */
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository.js';
import { QueryBuilder } from '../utils/query-builder.js';
import { UserFilterParams } from '../types/dtos/user.dto.js';
import { inject } from '../config/dependency-container.js';
import { DatabaseError, NotFoundError } from '../utils/error.utils.js';
import logger from '../utils/logger.js';

/**
 * User entity type
 */
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string | null;
  status: string;
  profilePicture?: string | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repository for User entity operations
 */
export class UserRepository extends BaseRepository<User, UserFilterParams> {
  /**
   * Creates a new UserRepository instance
   * @param prisma PrismaClient instance
   */
  constructor(prisma: PrismaClient = inject<PrismaClient>('PrismaClient')) {
    super(prisma, prisma.user);
  }

  /**
   * Build query conditions from filter criteria
   * @param filters Filter criteria
   * @returns Prisma-compatible where conditions
   */
  protected buildFilterConditions(filters: UserFilterParams): any {
    const { status, role, search } = filters;
    
    const builder = new QueryBuilder();
    
    // Status filter
    if (status) {
      builder.addFilter('status', status);
    }
    
    // Role filter
    if (role) {
      builder.addFilter('role', role);
    }
    
    // Search filter for name, email, and phone
    if (search) {
      builder.addSearch(search, ['name', 'email', 'phone']);
    }
    
    return builder.build();
  }

  /**
   * Find user by email
   * @param email Email address
   * @returns User or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return this.model.findUnique({
        where: { email }
      });
    } catch (error) {
      logger.error('Error in UserRepository.findByEmail', { error, email });
      throw new DatabaseError('Failed to find user by email', { cause: error });
    }
  }

  /**
   * Find user with settings
   * @param userId User ID
   * @returns User with settings or null if not found
   */
  async findWithSettings(userId: number): Promise<any> {
    try {
      return this.model.findUnique({
        where: { id: userId },
        include: {
          settings: true
        }
      });
    } catch (error) {
      logger.error('Error in UserRepository.findWithSettings', { error, userId });
      throw new DatabaseError('Failed to find user with settings', { cause: error });
    }
  }

  /**
   * Create or update user settings
   * @param userId User ID
   * @param settings Settings data
   * @returns Updated settings
   */
  async updateSettings(userId: number, settings: any): Promise<any> {
    try {
      // Check if settings exists
      const existingSettings = await this.prisma.userSettings.findUnique({
        where: { userId }
      });
      
      if (existingSettings) {
        // Update existing settings
        return this.prisma.userSettings.update({
          where: { userId },
          data: {
            ...settings,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new settings
        return this.prisma.userSettings.create({
          data: {
            userId,
            ...settings
          }
        });
      }
    } catch (error) {
      logger.error('Error in UserRepository.updateSettings', { error, userId });
      throw new DatabaseError('Failed to update user settings', { cause: error });
    }
  }

  /**
   * Create password reset token
   * @param userId User ID
   * @param token Reset token
   * @param expiry Token expiry
   */
  async createPasswordResetToken(userId: number, token: string, expiry: Date): Promise<void> {
    try {
      await this.model.update({
        where: { id: userId },
        data: {
          resetToken: token,
          resetTokenExpiry: expiry
        }
      });
    } catch (error) {
      logger.error('Error in UserRepository.createPasswordResetToken', { error, userId });
      throw new DatabaseError('Failed to create password reset token', { cause: error });
    }
  }

  /**
   * Find user by reset token
   * @param token Reset token
   * @returns User or null if token is invalid or expired
   */
  async findByResetToken(token: string): Promise<User | null> {
    try {
      return this.model.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date()
          }
        }
      });
    } catch (error) {
      logger.error('Error in UserRepository.findByResetToken', { error, token });
      throw new DatabaseError('Failed to find user by reset token', { cause: error });
    }
  }

  /**
   * Clear reset token after password reset
   * @param userId User ID
   */
  async clearResetToken(userId: number): Promise<void> {
    try {
      await this.model.update({
        where: { id: userId },
        data: {
          resetToken: null,
          resetTokenExpiry: null
        }
      });
    } catch (error) {
      logger.error('Error in UserRepository.clearResetToken', { error, userId });
      throw new DatabaseError('Failed to clear reset token', { cause: error });
    }
  }

  /**
   * Change user password
   * @param userId User ID
   * @param hashedPassword New hashed password
   * @returns Updated user
   */
  async changePassword(userId: number, hashedPassword: string): Promise<User> {
    try {
      return this.model.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error in UserRepository.changePassword', { error, userId });
      throw new DatabaseError('Failed to change password', { cause: error });
    }
  }

  /**
   * Get user activity log
   * @param userId User ID
   * @param limit Maximum number of items to return
   * @returns Activity log entries
   */
  async getUserActivity(userId: number, limit: number = 10): Promise<any[]> {
    try {
      return this.prisma.userActivity.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit
      });
    } catch (error) {
      logger.error('Error in UserRepository.getUserActivity', { error, userId });
      throw new DatabaseError('Failed to get user activity', { cause: error });
    }
  }

  /**
   * Log user activity
   * @param userId User ID
   * @param activity Activity description
   * @param ipAddress IP address
   * @returns Created activity
   */
  async logActivity(userId: number, activity: string, ipAddress?: string): Promise<any> {
    try {
      return this.prisma.userActivity.create({
        data: {
          userId,
          activity,
          ipAddress,
          timestamp: new Date()
        }
      });
    } catch (error) {
      // Log but don't fail the request on activity logging error
      logger.error('Error in UserRepository.logActivity', { error, userId, activity });
      return null;
    }
  }

  /**
   * Update user profile picture
   * @param userId User ID
   * @param picturePath Path to profile picture
   * @returns Updated user
   */
  async updateProfilePicture(userId: number, picturePath: string): Promise<User> {
    try {
      return this.model.update({
        where: { id: userId },
        data: {
          profilePicture: picturePath,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error in UserRepository.updateProfilePicture', { error, userId });
      throw new DatabaseError('Failed to update profile picture', { cause: error });
    }
  }

  /**
   * Update user status
   * @param userId User ID
   * @param status New status
   * @returns Updated user
   */
  async updateStatus(userId: number, status: string): Promise<User> {
    try {
      return this.model.update({
        where: { id: userId },
        data: {
          status,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error in UserRepository.updateStatus', { error, userId });
      throw new DatabaseError('Failed to update user status', { cause: error });
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
export default userRepository;