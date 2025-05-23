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
import { getUserRepository, getActivityLogRepository } from '@/core/factories/repositoryFactory.server';
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
  /**
   * Count users with optional filtering
   */
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<{ count: number }> {
    try {
      // Convert options.filters to criteria if present
      const criteria: Record<string, any> = options?.filters || {};
      
      const count = await this.userRepository.count(criteria);
      
      // Ensure consistent response format with count property
      if (typeof count === 'number') {
        return { count };
      } else if (count && typeof count === 'object' && 'count' in count) {
        return count as { count: number };
      } else if (count && typeof count === 'object' && 'total' in count) {
        return { count: (count as { total: number }).total };
      }
      
      // Default to zero if no valid count format is found
      return { count: 0 };
    } catch (error) {
      this.logger.error('Error in UserService.count:', error as Error);
      return { count: 0 };
    }
  }
  
  /**
   * Find users by specific criteria
   */
  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<UserResponseDto[]> {
    try {
      const users = await this.userRepository.findByCriteria(criteria, options);
      return users.map(user => this.mapToUserResponseDto(user));
    } catch (error) {
      this.logger.error('Error in UserService.findByCriteria:', error as Error);
      return [];
    }
  }
  
  /**
   * Validate data against schema
   * 
   * @param data - Data to validate
   * @param isUpdate - Whether it's an update operation
   * @param entityId - ID for update validation
   * @returns Promise with validation result
   */
  async validate(data: CreateUserDto | UpdateUserDto, isUpdate?: boolean, entityId?: number): Promise<import('@/domain/dtos/ValidationDto').ValidationResultDto> {
    try {
      // For server-side validation, use validator with proper result format
      let validationResult;
      
      // Call validator with the right number of arguments
      if (isUpdate) {
        // If entityId is provided, we only pass it if the method expects it
        try {
          validationResult = this.validator.validateUpdateUser(data);
        } catch (error) {
          this.logger.error('Error validating update user:', error as Error);
        }
      } else {
        validationResult = this.validator.validateCreateUser(data);
      }

      // Import validation types
      const { ValidationResult, ValidationErrorType } = require('@/domain/enums/ValidationResults');
      
      // Always create a proper ValidationResultDto to ensure type compatibility
      return {
        result: validationResult?.isValid ? ValidationResult.SUCCESS : ValidationResult.ERROR,
        errors: validationResult?.isValid ? undefined : 
          Array.isArray(validationResult?.errors) ? 
            validationResult.errors.map((e: string | any) => {
              // Handle both string errors and object errors
              if (typeof e === 'string') {
                return {
                  type: ValidationErrorType.INVALID,
                  field: 'general',
                  message: e
                };
              } else {
                return {
                  type: e.type || ValidationErrorType.INVALID,
                  field: e.field || 'general',
                  message: e.message || String(e),
                  data: e.data
                };
              }
            }) : 
            validationResult?.errors ? 
              [{ 
                type: ValidationErrorType.INVALID, 
                field: 'general', 
                message: String(validationResult.errors) 
              }] : 
              undefined
      };
    } catch (error) {
      this.logger.error('Error in UserService.validate:', error as Error);
      
      // Import needed for proper error creation
      const { ValidationResult, ValidationErrorType } = require('@/domain/enums/ValidationResults');
      
      return {
        result: ValidationResult.ERROR,
        errors: [{
          type: ValidationErrorType.INTERNAL_ERROR,
          field: 'global',
          message: 'Validation failed due to internal error'
        }]
      };
    }
  }
  
  /**
   * Execute a transaction
   */
  async transaction<r>(callback: (service: IUserService) => Promise<r>): Promise<r> {
    try {
      // Create a copy of this service to pass to the callback
      const serviceForCallback: IUserService = {
        ...this
      } as IUserService;
      
      return await callback(serviceForCallback);
    } catch (error) {
      this.logger.error('Error in UserService.transaction:', error as Error);
      throw error;
    }
  }
  
  /**
   * Perform bulk update
   */
  async bulkUpdate(ids: number[], data: UpdateUserDto, options?: ServiceOptions): Promise<number> {
    try {
      let successCount = 0;
      
      for (const id of ids) {
        try {
          await this.update(id, data, options);
          successCount++;
        } catch (error) {
          this.logger.error(`Error updating user ${id} in bulkUpdate:`, error as Error);
          // Continue with other updates despite error
        }
      }
      
      return successCount;
    } catch (error) {
      this.logger.error('Error in UserService.bulkUpdate:', error as Error);
      return 0;
    }
  }
  
  /**
   * Convert entity to DTO
   */
  toDTO(entity: User): UserResponseDto {
    return this.mapToUserResponseDto(entity);
  }
  
  /**
   * Convert DTO to entity
   */
  fromDTO(dto: CreateUserDto | UpdateUserDto): Partial<User> {
    return dto as Partial<User>;
  }
  
  /**
   * Search for users
   */
  async search(searchText: string, options?: ServiceOptions): Promise<UserResponseDto[]> {
    return this.searchUsers(searchText, options);
  }
  
  /**
   * Check if a user exists
   */
  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const user = await this.getById(id, options);
      return !!user;
    } catch (error) {
      this.logger.error(`Error in UserService.exists(${id}):`, error as Error);
      return false;
    }
  }
  
  /**
   * Get repository instance
   */
  getRepository(): any {
    return this.userRepository;
  }
  
  /**
   * Find all with pagination
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<UserResponseDto>> {
    return this.getAll(options);
  }
  private userRepository: IUserRepository;
  private logger: ILoggingService;
  private validator: IValidationService;
  private errorHandler: IErrorHandler;
  private automationService?: any; // IAutomationService

  constructor() {
    this.userRepository = getUserRepository();
    this.logger = getLogger();
    this.validator = getValidationService();
    this.errorHandler = getErrorHandler();
    
    // Get automation service for webhook triggers
    try {
      const { getAutomationService } = require('@/core/factories');
      this.automationService = getAutomationService();
    } catch (error) {
      this.logger.warn('AutomationService not available, webhooks will not be triggered', error as Error);
    }
    
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
      this.logger.error('Error in UserService.getAll:', error as Error);
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
   * Find a user by ID (implements IUserService.findById)
   */
  async findById(id: number, options?: ServiceOptions): Promise<UserResponseDto | null> {
    try {
      this.logger.debug(`Finding user by ID: ${id}`);
      const user = await this.userRepository.findById(id);
      return user ? this.mapToUserResponseDto(user) : null;
    } catch (error) {
      this.logger.error(`Error in UserService.findById(${id}):`, error as Error);
      return null;
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
      this.logger.error(`Error in UserService.getById(${id}):`, error as Error);
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
      this.logger.error(`Error in UserService.findByEmail(${email}):`, error as Error);
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
      this.logger.error(`Error in UserService.findByName(${name}):`, error as Error);
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
        
        // Convert raw activity logs to ActivityLogDto format
        if (logs && logs.length > 0) {
          activityLogs = logs.map(log => ({
            id: log.id,
            entityType: log.entityType,
            entityId: log.entityId,
            userId: log.userId,
            action: log.action,
            details: typeof log.details === 'string' 
              ? JSON.parse(log.details)
              : log.details,
            createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt),
            updatedAt: log.updatedAt instanceof Date ? log.updatedAt.toISOString() : String(log.updatedAt)
          }));
        }
      }

      // Create detailed response
      return {
        ...this.mapToUserResponseDto(user),
        activities: activityLogs
      };
    } catch (error) {
      this.logger.error(`Error in UserService.getUserDetails(${id}):`, error as Error);
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
      
      // Trigger webhooks for user creation
      if (this.automationService) {
        try {
          await this.automationService.triggerWebhook(
            'user', // entityType (matches AutomationEntityType.USER)
            'create', // operation
            user, // entityData
            user.id // entityId
          );
          this.logger.info('Webhook triggered for user creation', { userId: user.id });
        } catch (webhookError) {
          // Log error but don't fail the user creation
          this.logger.error('Failed to trigger webhook for user creation', {
            error: webhookError instanceof Error ? webhookError.message : String(webhookError),
            userId: user.id
          });
        }
      }
      
      return this.mapToUserResponseDto(user);
    } catch (error) {
      this.logger.error('Error in UserService.create:', error as Error);
      throw this.errorHandler.handleApiError(error instanceof Error ? error : new Error(String(error)));
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

      // Prepare update data
      const updateData = { ...data };
      
      // Handle optional fields
      // Don't validate optional empty fields
      if (!updateData.phone) delete updateData.phone;
      if (!updateData.profilePicture) delete updateData.profilePicture;
      
      // Validate input - only for non-empty fields
      const validationResult = this.validator.validateUpdateUser(updateData);
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

      // Clean up input data - remove fields that don't exist in the Prisma model
      // Create a clean object from the data without any extra fields
      const cleanData = { ...data };
      
      // Normalize profilePicture path if present
      if (cleanData.profilePicture) {
        // Ensure the path starts with /uploads/ not /public/uploads/
        if (cleanData.profilePicture.includes('/public/uploads/')) {
          cleanData.profilePicture = cleanData.profilePicture.replace('/public/uploads/', '/uploads/');
        }
        
        // If no profilePictureId is provided but there's a profile picture,
        // don't set a profilePictureId to avoid type mismatch errors
        if (cleanData.profilePictureId === undefined) {
          // Skip setting it altogether rather than setting to null
          // as the repository expects a string or undefined
        }
      }
      
      // Prepare update data
      const updatedData: Partial<User> = {
        ...cleanData,
        updatedBy: options?.userId,
        updatedAt: new Date()
      };

      // Update user
      const updatedUser = await this.userRepository.update(id, updatedData);
      
      // Trigger webhooks for user update
      if (this.automationService) {
        try {
          await this.automationService.triggerWebhook(
            'user', // entityType (matches AutomationEntityType.USER)
            'update', // operation
            updatedUser, // entityData
            updatedUser.id // entityId
          );
          this.logger.info('Webhook triggered for user update', { userId: updatedUser.id });
        } catch (webhookError) {
          // Log error but don't fail the user update
          this.logger.error('Failed to trigger webhook for user update', {
            error: webhookError instanceof Error ? webhookError.message : String(webhookError),
            userId: updatedUser.id
          });
        }
      }
      
      return this.mapToUserResponseDto(updatedUser);
    } catch (error) {
      this.logger.error(`Error in UserService.update(${id}):`, error as Error);
      throw this.errorHandler.handleApiError(error instanceof Error ? error : new Error(String(error)));
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
      this.logger.error(`Error in UserService.delete(${id}):`, error as Error);
      throw this.errorHandler.handleApiError(error instanceof Error ? error : new Error(String(error)));
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
      this.logger.error('Error in UserService.findUsers:', error as Error);
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

      // Ensure all passwords are provided
      if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
        throw new Error('Current password, new password, and confirm password are required');
      }

      // Ensure user password is defined
      if (!user.password) {
        throw new Error('User has no password set');
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
        options?.ip ? options.ip : ''
      );

      return true;
    } catch (error) {
      this.logger.error(`Error in UserService.changePassword(${userId}):`, error as Error);
      throw this.errorHandler.handleApiError(error instanceof Error ? error : new Error(String(error)));
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
        LogActionType.CHANGE_STATUS,
        `User status changed to ${data.status}${data.reason ? `: ${data.reason}` : ''}`,
        options?.ip || ''
      );

      return this.mapToUserResponseDto(updatedUser);
    } catch (error) {
      this.logger.error(`Error in UserService.updateStatus(${userId}):`, error as Error);
      throw this.errorHandler.handleApiError(error instanceof Error ? error : new Error(String(error)));
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
      this.logger.error(`Error in UserService.searchUsers(${searchText}):`, error as Error);
      return [];
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(options?: ServiceOptions): Promise<any> {
    try {
      // Get user statistics from the repository
      const userStats = await this.userRepository.getUserStatistics(options);
      if (userStats) {
        return {
          totalUsers: userStats.totalUsers,
          activeUsers: userStats.activeUsers,
          inactiveUsers: userStats.inactiveUsers,
          // Add more stats as needed
        };
      }
      // Fallback to manual counting if repository method is not available
      // This is a fallback in case the repository method is not implemented
      // or if we want to ensure we have the latest data

      return {
        totalUsers: await this.userRepository.count(),
        activeUsers: await this.userRepository.count({ status: UserStatus.ACTIVE }),
        inactiveUsers: await this.userRepository.count({ status: UserStatus.INACTIVE }),
        // Add more stats as needed
      };
    } catch (error) {
      this.logger.error('Error in UserService.getUserStatistics:', error as Error);
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
      
      // Map activity records to ActivityLogDto format
      return activities.map(activity => ({
        id: activity.id,
        entityType: activity.entityType,
        entityId: activity.entityId,
        userId: activity.userId,
        action: activity.action,
        details: typeof activity.details === 'string' 
          ? JSON.parse(activity.details) 
          : activity.details,
        createdAt: activity.createdAt instanceof Date ? activity.createdAt.toISOString() : String(activity.createdAt),
        updatedAt: activity.updatedAt instanceof Date ? activity.updatedAt.toISOString() : String(activity.updatedAt),
        // Include any other required fields from ActivityLogDto
        userName: undefined, // Populate if available
        formattedDate: activity.createdAt instanceof Date 
          ? activity.createdAt.toLocaleDateString() + ' ' + activity.createdAt.toLocaleTimeString() 
          : undefined
      }));
    } catch (error) {
      this.logger.error(`Error in UserService.getUserActivity(${userId}):`, error as Error);
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
        options?.ip || ''
      );

      return true;
    } catch (error) {
      this.logger.error(`Error in UserService.softDelete(${userId}):`, error as Error);
      throw this.errorHandler.handleApiError(error instanceof Error ? error : new Error(String(error)));
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
        options?.ip || ''
      );

      // Get user data before deletion for webhook
      const user = await this.userRepository.findById(userId);
      
      // Perform hard delete
      const result = await this.userRepository.hardDelete(userId);
      
      // Trigger webhooks for user deletion
      if (result && user && this.automationService) {
        try {
          await this.automationService.triggerWebhook(
            'user', // entityType (matches AutomationEntityType.USER)
            'delete', // operation
            user, // entityData (the user we fetched earlier)
            userId // entityId
          );
          this.logger.info('Webhook triggered for user deletion', { userId });
        } catch (webhookError) {
          // Log error but don't fail the user deletion
          this.logger.error('Failed to trigger webhook for user deletion', {
            error: webhookError instanceof Error ? webhookError.message : String(webhookError),
            userId
          });
        }
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Error in UserService.hardDelete(${userId}):`, error as Error);
      throw this.errorHandler.handleApiError(error instanceof Error ? error : new Error(String(error)));
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

      // Ensure user password is defined
      if (!user.password) {
        throw new Error('User has no password set');
      }

      // Verify password
      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      // Update last login - make sure the IP is a string or empty string if undefined
      const ipAddress = options?.ip || '';
      await this.userRepository.updateLastLogin(user.id, ipAddress);

      return this.mapToUserResponseDto(user);
    } catch (error) {
      this.logger.error(`Error in UserService.authenticate(${email}):`, error as Error);
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

      // Log password change - ensure IP is a string
      const ipAddress = options?.ip || '';
      await this.userRepository.logActivity(
        userId,
        LogActionType.RESET_PASSWORD,
        'Password reset by administrator',
        ipAddress
      );

      // Return updated user
      const updatedUser = await this.userRepository.findById(userId);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return this.mapToUserResponseDto(updatedUser);
    } catch (error) {
      this.logger.error(`Error in UserService.updatePassword(${userId}):`, error as Error);
      throw this.errorHandler.handleApiError(error instanceof Error ? error : new Error(String(error)));
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
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt),
      lastLoginAt: user.lastLoginAt instanceof Date ? user.lastLoginAt.toISOString() : user.lastLoginAt
    };
  }
}
