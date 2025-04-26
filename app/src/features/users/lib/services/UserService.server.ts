/**
 * Server-side User Service Implementation
 * 
 * This service provides a proper implementation of IUserService that works directly
 * with the UserRepository, following clean architecture principles.
 * This should be used on the server-side only.
 */

import { IUserService } from '@/domain/services/IUserService';
import { User, UserStatus, UserRole } from '@/domain/entities/User';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto, 
  UserDetailResponseDto,
  ChangePasswordDto,
  UpdateUserStatusDto,
  UserFilterParamsDto
} from '@/domain/dtos/UserDtos';
import { ActivityLogDto } from '@/domain/dtos/ActivityLogDto';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { getLogger } from '@/core/logging';
import { getErrorHandler } from '@/core/errors';
import { getValidationService } from '@/core/validation';
import { getUserRepository } from '@/core/factories/repositoryFactory';
import { getActivityLogRepository } from '@/core/factories/repositoryFactory';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IErrorHandler } from '@/core/errors';
import { IValidationService } from '@/core/validation';
import { ILoggingService } from '@/core/logging';
import { LogActionType } from '@/domain/enums/CommonEnums';
import { hashPassword, comparePasswords } from '@/core/security/password-utils';

/**
 * User Service - Server-side implementation
 * 
 * Implements the IUserService interface by directly working with repositories
 */
export class UserService implements IUserService {
  private userRepository: IUserRepository;
  private logger: ILoggingService;
  private validator: IValidationService;
  private errorHandler: IErrorHandler;

  constructor() {
    this.userRepository = getUserRepository();
    this.logger = getLogger();
    this.validator = getValidationService();
    this.errorHandler = getErrorHandler();
    this.logger.debug('Server-side UserService initialized');
  }

  /**
   * Get all users with pagination
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<UserResponseDto>> {
    try {
      const result = await this.userRepository.findAll(options);
      return {
        data: result.data.map(user => this.mapToUserResponseDto(user)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error in UserService.getAll:', error);
      return {
        data: [],
        pagination: {
          page: options?.page || 1,
          limit: options?.limit || 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Get a user by ID
   */
  async getById(id: number, options?: ServiceOptions): Promise<UserResponseDto | null> {
    try {
      this.logger.debug(`Getting user by ID: ${id}`);
      const user = await this.userRepository.findById(id);
      return user ? this.mapToUserResponseDto(user) : null;
    } catch (error) {
      this.logger.error(`Error in UserService.getById(${id}):`, error);
      return null;
    }
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string, options?: ServiceOptions): Promise<UserResponseDto | null> {
    try {
      const user = await this.userRepository.findByEmail(email);
      return user ? this.mapToUserResponseDto(user) : null;
    } catch (error) {
      this.logger.error(`Error in UserService.findByEmail(${email}):`, error);
      return null;
    }
  }

  /**
   * Find a user by name
   */
  async findByName(name: string, options?: ServiceOptions): Promise<UserResponseDto | null> {
    try {
      const user = await this.userRepository.findByName(name);
      return user ? this.mapToUserResponseDto(user) : null;
    } catch (error) {
      this.logger.error(`Error in UserService.findByName(${name}):`, error);
      return null;
    }
  }

  /**
   * Get detailed user information
   */
  async getUserDetails(id: number, options?: ServiceOptions): Promise<UserDetailResponseDto | null> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) return null;

      // Get activity logs if needed
      let activityLogs: ActivityLogDto[] = [];
      if (options?.includeActivity) {
        const activityLogRepo = getActivityLogRepository();
        const logs = await this.userRepository.getUserActivity(id, 10);
        activityLogs = logs || [];
      }

      // Create detailed response
      return {
        ...this.mapToUserResponseDto(user),
        activity: activityLogs
      };
    } catch (error) {
      this.logger.error(`Error in UserService.getUserDetails(${id}):`, error);
      return null;
    }
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserDto, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      // Validate input
      const validationResult = this.validator.validateCreateUser(data);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors?.join(', ') || 'Invalid user data');
      }

      // Check for existing user with same email
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new Error('A user with this email already exists');
      }

      // Hash password if provided
      let hashedPassword: string | undefined;
      if (data.password) {
        hashedPassword = await hashPassword(data.password);
      }

      // Prepare user data
      const userData: Partial<User> = {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || UserRole.USER,
        status: data.status || UserStatus.ACTIVE,
        phone: data.phone,
        profilePicture: data.profilePicture,
        createdBy: options?.userId
      };

      // Create user
      const user = await this.userRepository.create(userData);
      return this.mapToUserResponseDto(user);
    } catch (error) {
      this.logger.error('Error in UserService.create:', error);
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Update a user
   */
  async update(id: number, data: UpdateUserDto, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Validate input
      const validationResult = this.validator.validateUpdateUser(data);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors?.join(', ') || 'Invalid user data');
      }

      // Check if email is being changed and if it already exists
      if (data.email && data.email !== existingUser.email) {
        const userWithEmail = await this.userRepository.findByEmail(data.email);
        if (userWithEmail && userWithEmail.id !== id) {
          throw new Error('A user with this email already exists');
        }
      }

      // Prepare update data
      const updateData: Partial<User> = {
        ...data,
        updatedBy: options?.userId,
        updatedAt: new Date()
      };

      // Update user
      const updatedUser = await this.userRepository.update(id, updateData);
      return this.mapToUserResponseDto(updatedUser);
    } catch (error) {
      this.logger.error(`Error in UserService.update(${id}):`, error);
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Delete a user
   */
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      // Check if hard delete is specified
      if (options?.hardDelete) {
        return await this.hardDelete(id, options);
      }
      
      // Otherwise perform soft delete
      return await this.softDelete(id, options);
    } catch (error) {
      this.logger.error(`Error in UserService.delete(${id}):`, error);
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Find users with filters
   */
  async findUsers(filters: UserFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<UserResponseDto>> {
    try {
      const result = await this.userRepository.findUsers(filters);
      return {
        data: result.data.map(user => this.mapToUserResponseDto(user)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error in UserService.findUsers:', error);
      return {
        data: [],
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Change a user's password
   */
  async changePassword(userId: number, data: ChangePasswordDto, options?: ServiceOptions): Promise<boolean> {
    try {
      // Get the user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate current password
      const isPasswordValid = await comparePasswords(data.currentPassword, user.password);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password
      if (data.newPassword !== data.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      // Password validation
      const validationResult = this.validator.validatePassword(data.newPassword);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors?.join(', ') || 'Password does not meet security requirements');
      }

      // Hash new password
      const hashedPassword = await hashPassword(data.newPassword);

      // Update password
      await this.userRepository.updatePassword(userId, hashedPassword);

      // Log password change
      await this.userRepository.logActivity(
        userId,
        LogActionType.CHANGE_PASSWORD,
        'Password changed by user',
        options?.ip
      );

      return true;
    } catch (error) {
      this.logger.error(`Error in UserService.changePassword(${userId}):`, error);
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Update a user's status
   */
  async updateStatus(userId: number, data: UpdateUserStatusDto, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      // Check if user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update user status
      const updatedUser = await this.userRepository.update(userId, {
        status: data.status,
        updatedBy: options?.userId,
        updatedAt: new Date()
      });

      // Log status change
      await this.userRepository.logActivity(
        userId,
        LogActionType.UPDATE_STATUS,
        `User status changed to ${data.status}${data.reason ? `: ${data.reason}` : ''}`,
        options?.ip
      );

      return this.mapToUserResponseDto(updatedUser);
    } catch (error) {
      this.logger.error(`Error in UserService.updateStatus(${userId}):`, error);
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Search for users
   */
  async searchUsers(searchText: string, options?: ServiceOptions): Promise<UserResponseDto[]> {
    try {
      const limit = options?.limit || 20;
      const users = await this.userRepository.searchUsers(searchText, limit);
      return users.map(user => this.mapToUserResponseDto(user));
    } catch (error) {
      this.logger.error(`Error in UserService.searchUsers(${searchText}):`, error);
      return [];
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(options?: ServiceOptions): Promise<any> {
    try {
      // TODO: Implement proper stats collection from repository
      // For now return a placeholder
      return {
        totalUsers: await this.userRepository.count(),
        activeUsers: await this.userRepository.count({ status: UserStatus.ACTIVE }),
        inactiveUsers: await this.userRepository.count({ status: UserStatus.INACTIVE }),
        // Add more stats as needed
      };
    } catch (error) {
      this.logger.error('Error in UserService.getUserStatistics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0
      };
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivity(userId: number, limit?: number, options?: ServiceOptions): Promise<ActivityLogDto[]> {
    try {
      const activities = await this.userRepository.getUserActivity(userId, limit || 10);
      return activities.map(activity => ({
        id: activity.id,
        userId: activity.userId,
        timestamp: activity.createdAt,
        activity: activity.action,
        details: typeof activity.details === 'string' 
          ? activity.details 
          : JSON.stringify(activity.details),
        ipAddress: activity.ip
      }));
    } catch (error) {
      this.logger.error(`Error in UserService.getUserActivity(${userId}):`, error);
      return [];
    }
  }

  /**
   * Soft delete a user
   */
  async softDelete(userId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      // Update user status to deleted
      await this.userRepository.update(userId, {
        status: UserStatus.DELETED,
        updatedBy: options?.userId,
        updatedAt: new Date()
      });

      // Log deletion
      await this.userRepository.logActivity(
        userId,
        LogActionType.DELETE,
        'User soft deleted',
        options?.ip
      );

      return true;
    } catch (error) {
      this.logger.error(`Error in UserService.softDelete(${userId}):`, error);
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Hard delete a user
   */
  async hardDelete(userId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      // Log deletion first (since the user will be gone after hard delete)
      await this.userRepository.logActivity(
        userId,
        LogActionType.DELETE,
        'User permanently deleted',
        options?.ip
      );

      // Perform hard delete
      return await this.userRepository.hardDelete(userId);
    } catch (error) {
      this.logger.error(`Error in UserService.hardDelete(${userId}):`, error);
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Authenticate a user
   */
  async authenticate(email: string, password: string, options?: ServiceOptions): Promise<UserResponseDto | null> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return null;
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        throw new Error('User account is not active');
      }

      // Verify password
      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      // Update last login
      await this.userRepository.updateLastLogin(user.id, options?.ip);

      return this.mapToUserResponseDto(user);
    } catch (error) {
      this.logger.error(`Error in UserService.authenticate(${email}):`, error);
      return null;
    }
  }

  /**
   * Update a user's password (admin operation)
   */
  async updatePassword(userId: number, password: string, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      // Check if user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate password
      const validationResult = this.validator.validatePassword(password);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors?.join(', ') || 'Password does not meet security requirements');
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Update password
      await this.userRepository.updatePassword(userId, hashedPassword);

      // Log password change
      await this.userRepository.logActivity(
        userId,
        LogActionType.RESET_PASSWORD,
        'Password reset by administrator',
        options?.ip
      );

      // Return updated user
      const updatedUser = await this.userRepository.findById(userId);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return this.mapToUserResponseDto(updatedUser);
    } catch (error) {
      this.logger.error(`Error in UserService.updatePassword(${userId}):`, error);
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Map domain entity to response DTO
   */
  private mapToUserResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt
    };
  }
}
