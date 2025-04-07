import { PrismaClient, User, UserActivity } from '@prisma/client';
import { ILoggingService } from '../lib/interfaces/ILoggingService.js';
import { IErrorHandler } from '../lib/interfaces/IErrorHandler.js';
import { 
  IProfileService, 
  ActivityLogFilterParams, 
  PaginatedActivityLogs,
  ProfileServiceOptions 
} from '../lib/interfaces/IProfileService.js';
import { UpdateProfileDto } from '../dtos/ProfileDtos.js';
import { ChangePasswordDto } from '../dtos/UserDtos.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

/**
 * Service for managing user profiles
 */
export class ProfileService implements IProfileService {
  /**
   * Creates a new ProfileService instance
   * 
   * @param prisma - Prisma client
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: ILoggingService,
    private readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized ProfileService');
  }

  /**
   * Get user profile details
   * 
   * @param userId - ID of the user
   * @returns User profile details
   */
  async getProfileDetails(userId: number): Promise<User | null> {
    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          settings: true
        }
      });

      if (!user) {
        throw this.errorHandler.createNotFoundError(`User with ID ${userId} not found`);
      }

      return user;
    } catch (error) {
      this.logger.error(`Error getting profile details for user ${userId}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Update user profile
   * 
   * @param userId - ID of the user
   * @param data - Profile data to update
   * @param options - Optional service options
   * @returns Updated user profile
   */
  async updateProfile(
    userId: number,
    data: UpdateProfileDto,
    options?: ProfileServiceOptions
  ): Promise<User> {
    try {
      const context = options?.context;
      
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw this.errorHandler.createNotFoundError(`User with ID ${userId} not found`);
      }

      // Check if email is already taken
      if (data.email && data.email !== user.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: data.email }
        });

        if (existingUser) {
          throw this.errorHandler.createError('Email is already taken', 400);
        }
      }

      // Ensure name is set if firstName and lastName are provided
      if (data.firstName && data.lastName) {
        data.name = `${data.firstName} ${data.lastName}`;
      }

      // Update user
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone
        },
        include: {
          settings: true
        }
      });

      // Log activity
      await this.prisma.userActivity.create({
        data: {
          userId,
          activity: 'Profile updated',
          ipAddress: context?.ipAddress
        }
      });

      this.logger.info(
        `Profile updated for user ${userId}`, 
        { userId: context?.userId, ipAddress: context?.ipAddress }
      );

      return updatedUser;
    } catch (error) {
      this.logger.error(`Error updating profile for user ${userId}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Change user password
   * 
   * @param userId - ID of the user
   * @param data - Password change data
   * @param options - Optional service options
   * @returns Whether the operation was successful
   */
  async changePassword(
    userId: number,
    data: ChangePasswordDto,
    options?: ProfileServiceOptions
  ): Promise<boolean> {
    try {
      const context = options?.context;
      
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw this.errorHandler.createNotFoundError(`User with ID ${userId} not found`);
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
      
      if (!isPasswordValid) {
        throw this.errorHandler.createError('Current password is incorrect', 400);
      }

      // Verify that new password and confirmation match
      if (data.newPassword !== data.confirmPassword) {
        throw this.errorHandler.createValidationError('Password confirmation does not match', ['New password and confirmation must match']);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(data.newPassword, 10);

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword
        }
      });

      // Log activity
      await this.prisma.userActivity.create({
        data: {
          userId,
          activity: 'Password changed',
          ipAddress: context?.ipAddress
        }
      });

      this.logger.info(
        `Password changed for user ${userId}`, 
        { userId: context?.userId, ipAddress: context?.ipAddress }
      );

      return true;
    } catch (error) {
      this.logger.error(`Error changing password for user ${userId}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Update user profile picture
   * 
   * @param userId - ID of the user
   * @param filePath - Path to the uploaded profile picture
   * @param options - Optional service options
   * @returns Updated user profile
   */
  async updateProfilePicture(
    userId: number,
    filePath: string,
    options?: ProfileServiceOptions
  ): Promise<User> {
    try {
      const context = options?.context;
      
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw this.errorHandler.createNotFoundError(`User with ID ${userId} not found`);
      }

      // If there's an existing profile picture, delete it
      if (user.profilePicture) {
        const oldFilePath = path.join(process.cwd(), 'public', user.profilePicture);
        
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Get the relative path for storage in DB
      const relativePath = filePath.replace(path.join(process.cwd(), 'public'), '');
      
      // Update user with new profile picture path
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilePicture: relativePath
        },
        include: {
          settings: true
        }
      });

      // Log activity
      await this.prisma.userActivity.create({
        data: {
          userId,
          activity: 'Profile picture updated',
          ipAddress: context?.ipAddress
        }
      });

      this.logger.info(
        `Profile picture updated for user ${userId}`, 
        { userId: context?.userId, ipAddress: context?.ipAddress }
      );

      return updatedUser;
    } catch (error) {
      this.logger.error(`Error updating profile picture for user ${userId}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Remove user profile picture
   * 
   * @param userId - ID of the user
   * @param options - Optional service options
   * @returns Updated user profile
   */
  async removeProfilePicture(
    userId: number,
    options?: ProfileServiceOptions
  ): Promise<User> {
    try {
      const context = options?.context;
      
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw this.errorHandler.createNotFoundError(`User with ID ${userId} not found`);
      }

      // If there's an existing profile picture, delete it
      if (user.profilePicture) {
        const filePath = path.join(process.cwd(), 'public', user.profilePicture);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Update user to remove profile picture reference
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilePicture: null
        },
        include: {
          settings: true
        }
      });

      // Log activity
      await this.prisma.userActivity.create({
        data: {
          userId,
          activity: 'Profile picture removed',
          ipAddress: context?.ipAddress
        }
      });

      this.logger.info(
        `Profile picture removed for user ${userId}`, 
        { userId: context?.userId, ipAddress: context?.ipAddress }
      );

      return updatedUser;
    } catch (error) {
      this.logger.error(`Error removing profile picture for user ${userId}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Get user activity logs
   * 
   * @param userId - ID of the user
   * @param filters - Filter parameters
   * @returns Paginated activity logs
   */
  async getUserActivityLogs(
    userId: number,
    filters?: ActivityLogFilterParams
  ): Promise<PaginatedActivityLogs> {
    try {
      // Default values for filters
      const {
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = 'timestamp',
        sortDirection = 'desc'
      } = filters || {};

      // Build where condition
      const where: any = {
        userId
      };

      if (startDate && endDate) {
        where.timestamp = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      } else if (startDate) {
        where.timestamp = {
          gte: new Date(startDate)
        };
      } else if (endDate) {
        where.timestamp = {
          lte: new Date(endDate)
        };
      }

      // Count total matching records
      const total = await this.prisma.userActivity.count({ where });

      // Calculate pagination
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(total / limit);

      // Get paginated data
      const data = await this.prisma.userActivity.findMany({
        where,
        orderBy: {
          [sortBy]: sortDirection
        },
        skip,
        take: limit
      });

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error(`Error getting activity logs for user ${userId}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }
}