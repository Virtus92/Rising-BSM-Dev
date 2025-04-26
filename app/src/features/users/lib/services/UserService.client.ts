/**
 * Client-side User Service Implementation
 * 
 * This service implements IUserService by using the UserClient to make API calls.
 * It's meant to be used on the client-side only.
 */

import { IUserService } from '@/domain/services/IUserService';
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

/**
 * User Service - Client-side implementation
 * 
 * Implements the IUserService interface by making API calls through UserClient
 */
export class UserServiceClient implements IUserService {
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
          activity
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
      const response = await UserClient.createUser(data);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create user');
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
      const response = await UserClient.updateUser(id, data);
      
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
      const response = await UserClient.getUsers(filters);
      
      if (response.success && response.data) {
        return response.data;
      }
      
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
      const response = await UserClient.updateUserStatus(userId, { status: 'deleted' });
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
}
