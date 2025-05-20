'use client';
/**
 * Client-side User Service Implementation
 * 
 * This service implements IUserService by using the UserClient to make API calls.
 * It's meant to be used on the client-side only.
 */

import { IUserService } from '@/domain/services/IUserService';
import { UserStatus } from '@/domain/enums/UserEnums';
import { UserClient } from '../clients/UserClient';
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
import { User } from '@/domain/entities/User';

/**
 * User Service - Client-side implementation
 * 
 * Implements the IUserService interface by making API calls through UserClient
 */
export class UserServiceClient implements IUserService {
  /**
   * Count users with optional filtering
   */
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    try {
      const response = await UserClient.count();
      return response.success && response.data ? response.data.count : 0;
    } catch (error) {
      console.error('Error in UserServiceClient.count:', error);
      return 0;
    }
  }

  /**
   * Get all users with pagination
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<UserResponseDto>> {
    try {
      const filters = {
        page: options?.page || 1,
        limit: options?.limit || 10
      };
      
      const response = await UserClient.getUsers(filters);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return {
        data: [],
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: 0,
          totalPages: 0
        }
      };
    } catch (error) {
      console.error('Error in UserServiceClient.getAll:', error);
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
      const response = await UserClient.getUserById(id);
      return response.success && response.data ? response.data : null;
    } catch (error) {
      console.error(`Error in UserServiceClient.findById(${id}):`, error);
      return null;
    }
  }

  /**
   * Get a user by ID
   */
  async getById(id: number, options?: ServiceOptions): Promise<UserResponseDto | null> {
    try {
      const response = await UserClient.getUserById(id);
      return response.success && response.data ? response.data : null;
    } catch (error) {
      console.error(`Error in UserServiceClient.getById(${id}):`, error);
      return null;
    }
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string, options?: ServiceOptions): Promise<UserResponseDto | null> {
    try {
      const response = await UserClient.findByEmail(email);
      return response.success && response.data ? response.data : null;
    } catch (error) {
      console.error(`Error in UserServiceClient.findByEmail(${email}):`, error);
      return null;
    }
  }

  /**
   * Find a user by name
   */
  async findByName(name: string, options?: ServiceOptions): Promise<UserResponseDto | null> {
    try {
      // Using the getUsers method with a search filter
      const filters = {
        search: name,
        limit: 1
      };
      
      const response = await UserClient.getUsers(filters);
      
      if (response.success && response.data && response.data.data.length > 0) {
        return response.data.data[0];
      }
      
      return null;
    } catch (error) {
      console.error(`Error in UserServiceClient.findByName(${name}):`, error);
      return null;
    }
  }

  /**
   * Get detailed user information
   */
  async getUserDetails(id: number, options?: ServiceOptions): Promise<UserDetailResponseDto | null> {
    try {
      const response = await UserClient.getUserById(id);
      
      if (response.success && response.data) {
        // Get activity logs if requested
        let activity: ActivityLogDto[] = [];
        
        if (options?.includeActivity) {
          const activityResponse = await UserClient.getUserActivity(id, options.limit);
          if (activityResponse.success && activityResponse.data) {
            activity = activityResponse.data;
          }
        }
        
        // Convert UserResponseDto to UserDetailResponseDto
        return {
          ...response.data,
          activities: activity
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error in UserServiceClient.getUserDetails(${id}):`, error);
      return null;
    }
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserDto, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      // Remove confirmPassword if present to prevent Prisma errors
      const { confirmPassword, ...cleanData } = data as any;
      
      const response = await UserClient.createUser(cleanData);
      
      console.log('UserServiceClient.create response:', JSON.stringify(response));
      
      // Ensure we have proper data format
      if (response.success && response.data) {
        // Make sure the response has an ID before returning
        if (!response.data.id) {
          console.error('User creation succeeded but returned invalid data without ID');
          throw new Error('API returned success without valid user data');
        }
        return response.data;
      }
      
      // If we get a success response but no data, throw a meaningful error
      if (response.success) {
        console.warn('UserClient.createUser returned success but no data');
        throw new Error('Server returned success but no user data');
      }
      
      throw new Error(response.error || response.message || 'Failed to create user');
    } catch (error) {
      console.error('Error in UserServiceClient.create:', error);
      throw error;
    }
  }

  /**
   * Update a user
   */
  async update(id: number, data: UpdateUserDto, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      // Remove confirmPassword if present to prevent Prisma errors
      const { confirmPassword, ...cleanData } = data as any;
      
      const response = await UserClient.updateUser(id, cleanData);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update user');
    } catch (error) {
      console.error(`Error in UserServiceClient.update(${id}):`, error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const response = await UserClient.deleteUser(id);
      return response.success;
    } catch (error) {
      console.error(`Error in UserServiceClient.delete(${id}):`, error);
      return false;
    }
  }

  /**
   * Find users with filters
   */
  async findUsers(filters: UserFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<UserResponseDto>> {
    try {
      // Include auth headers in request if options.userId is provided
      const customHeaders: Record<string, string> = {};
      if (options?.userId) {
        customHeaders['X-Auth-User-ID'] = options.userId.toString();
      }
      
      const response = await UserClient.getUsers(filters, customHeaders);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      // Log specific error for debugging
      console.error('UserClient.getUsers returned unsuccessful response:', response.error);
      
      return {
        data: [],
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: 0,
          totalPages: 0
        }
      };
    } catch (error) {
      console.error('Error in UserServiceClient.findUsers:', error);
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
      const response = await UserClient.changePassword({
        oldPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });
      
      return response.success;
    } catch (error) {
      console.error(`Error in UserServiceClient.changePassword(${userId}):`, error);
      return false;
    }
  }

  /**
   * Update a user's status
   */
  async updateStatus(userId: number, data: UpdateUserStatusDto, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      const response = await UserClient.updateUserStatus(userId, data);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update user status');
    } catch (error) {
      console.error(`Error in UserServiceClient.updateStatus(${userId}):`, error);
      throw error;
    }
  }

  /**
   * Search for users
   */
  async searchUsers(searchText: string, options?: ServiceOptions): Promise<UserResponseDto[]> {
    try {
      const filters = {
        search: searchText,
        limit: options?.limit || 20
      };
      
      const response = await UserClient.getUsers(filters);
      
      if (response.success && response.data && response.data.data) {
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      console.error(`Error in UserServiceClient.searchUsers(${searchText}):`, error);
      return [];
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(options?: ServiceOptions): Promise<any> {
    try {
      // Combine weekly, monthly, and yearly stats
      const [weeklyResponse, monthlyResponse, yearlyResponse] = await Promise.all([
        UserClient.getWeeklyStats(),
        UserClient.getMonthlyStats(),
        UserClient.getYearlyStats()
      ]);
      
      return {
        weekly: weeklyResponse.success ? weeklyResponse.data : null,
        monthly: monthlyResponse.success ? monthlyResponse.data : null,
        yearly: yearlyResponse.success ? yearlyResponse.data : null
      };
    } catch (error) {
      console.error('Error in UserServiceClient.getUserStatistics:', error);
      return {
        weekly: null,
        monthly: null,
        yearly: null
      };
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivity(userId: number, limit?: number, options?: ServiceOptions): Promise<ActivityLogDto[]> {
    try {
      const response = await UserClient.getUserActivity(userId, limit);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error(`Error in UserServiceClient.getUserActivity(${userId}):`, error);
      return [];
    }
  }

  /**
   * Soft delete a user
   */
  async softDelete(userId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      // Implement soft delete by updating status
      const response = await UserClient.updateUserStatus(userId, { status: UserStatus.DELETED });
      return response.success;
    } catch (error) {
      console.error(`Error in UserServiceClient.softDelete(${userId}):`, error);
      return false;
    }
  }

  /**
   * Hard delete a user
   */
  async hardDelete(userId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const response = await UserClient.deleteUser(userId);
      return response.success;
    } catch (error) {
      console.error(`Error in UserServiceClient.hardDelete(${userId}):`, error);
      return false;
    }
  }

  /**
   * Authenticate a user
   */
  async authenticate(email: string, password: string, options?: ServiceOptions): Promise<UserResponseDto | null> {
    try {
      // This should be handled by AuthService, not UserService
      // For now, just return null
      console.warn('UserServiceClient.authenticate called, but this should be handled by AuthService');
      return null;
    } catch (error) {
      console.error(`Error in UserServiceClient.authenticate(${email}):`, error);
      return null;
    }
  }

  /**
   * Update a user's password (admin operation)
   */
  async updatePassword(userId: number, password: string, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      const response = await UserClient.adminResetPassword(userId, password);
      
      if (response.success) {
        // Get the updated user
        const userResponse = await UserClient.getUserById(userId);
        
        if (userResponse.success && userResponse.data) {
          return userResponse.data;
        }
      }
      
      throw new Error(response.message || 'Failed to update password');
    } catch (error) {
      console.error(`Error in UserServiceClient.updatePassword(${userId}):`, error);
      throw error;
    }
  }

  /**
   * Find users by specific criteria
   */
  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<UserResponseDto[]> {
    try {
      // Convert criteria to filters format expected by API
      const filters = {
        ...criteria,
        page: options?.page || 1,
        limit: options?.limit || 20
      };
      
      const response = await UserClient.getUsers(filters);
      
      if (response.success && response.data?.data) {
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error in UserServiceClient.findByCriteria:', error);
      return [];
    }
  }
  
  /**
   * Validate user data
   * 
   * @param data - Data to validate
   * @param isUpdate - Whether it's an update operation
   * @param entityId - ID for update validation
   * @returns Promise with validation result
   */
  async validate(data: CreateUserDto | UpdateUserDto, isUpdate: boolean = false, entityId?: number): Promise<import('@/domain/dtos/ValidationDto').ValidationResultDto> {
    try {
      // For client-side validation, perform basic validation
      const errors: import('@/domain/dtos/ValidationDto').ValidationErrorDto[] = [];
      
      // Import ValidationErrorType
      const { ValidationErrorType } = await import('@/domain/enums/ValidationResults');
      const { ValidationResult } = await import('@/domain/enums/ValidationResults');
      
      // Basic email validation
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push({
          type: ValidationErrorType.INVALID_FORMAT,
          field: 'email',
          message: 'Invalid email format'
        });
      }
      
      // Basic password validation
      if ('password' in data && data.password && data.password.length < 8) {
        errors.push({
          type: ValidationErrorType.TOO_SHORT,
          field: 'password',
          message: 'Password must be at least 8 characters'
        });
      }
      
      // Name validation
      if (data.name && data.name.trim().length < 2) {
        errors.push({
          type: ValidationErrorType.TOO_SHORT,
          field: 'name',
          message: 'Name is too short'
        });
      }
      
      return {
        result: errors.length === 0 ? ValidationResult.SUCCESS : ValidationResult.ERROR,
        errors: errors.length > 0 ? errors : undefined,
        data: { isUpdate, entityId }
      };
    } catch (error) {
      console.error('Error in UserServiceClient.validate:', error);
      
      // Import needed for error creation
      const { ValidationErrorType } = await import('@/domain/enums/ValidationResults');
      const { ValidationResult } = await import('@/domain/enums/ValidationResults');
      
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
   * Execute a transaction (not applicable on client)
   */
  async transaction<r>(callback: (service: IUserService) => Promise<r>): Promise<r> {
    // No transaction support on client side, just execute the callback
    try {
      // Create a new instance to avoid 'this' type issues
      const serviceForCallback: IUserService = {
        ...this
      } as IUserService;
      
      return await callback(serviceForCallback);
    } catch (error) {
      console.error('Error in UserServiceClient.transaction:', error);
      throw error;
    }
  }
  
  /**
   * Perform a bulk update
   */
  async bulkUpdate(ids: number[], data: UpdateUserDto, options?: ServiceOptions): Promise<number> {
    try {
      // Client doesn't support bulk operations directly
      // Implement by calling update multiple times
      let successCount = 0;
      
      for (const id of ids) {
        try {
          await this.update(id, data, options);
          successCount++;
        } catch (error) {
          console.error(`Error updating user ${id} in bulkUpdate:`, error);
          // Continue with other updates despite error
        }
      }
      
      return successCount;
    } catch (error) {
      console.error('Error in UserServiceClient.bulkUpdate:', error);
      return 0;
    }
  }
  
  /**
   * Convert a User entity to a DTO
   */
  toDTO(entity: User): UserResponseDto {
    // Simple pass-through since we're already working with DTOs on the client
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      role: entity.role,
      status: entity.status,
      phone: entity.phone,
      profilePicture: entity.profilePicture,
      createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : String(entity.createdAt),
      updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : String(entity.updatedAt),
      lastLoginAt: entity.lastLoginAt instanceof Date ? entity.lastLoginAt.toISOString() : entity.lastLoginAt
    };
  }
  
  /**
   * Convert a DTO to a User entity
   */
  fromDTO(dto: CreateUserDto | UpdateUserDto): Partial<User> {
    // Simple pass-through on the client
    return dto as Partial<User>;
  }
  
  /**
   * Advanced search for users
   */
  async search(searchText: string, options?: ServiceOptions): Promise<UserResponseDto[]> {
    // Reuse searchUsers implementation
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
      console.error(`Error in UserServiceClient.exists(${id}):`, error);
      return false;
    }
  }

  /**
   * Get access to the repository (not applicable on client)
   */
  getRepository(): any {
    console.warn('getRepository called on client-side UserService - not applicable');
    return null;
  }

  /**
   * Find all entries with pagination and filtering
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<UserResponseDto>> {
    // Reuse getAll implementation
    return this.getAll(options);
  }
}
