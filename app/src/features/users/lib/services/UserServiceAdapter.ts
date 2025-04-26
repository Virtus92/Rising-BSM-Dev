/**
 * Adapter for UserService
 * 
 * This adapter bridges the gap between the static UserService methods
 * and the instance-based IUserService interface that the application expects.
 */

import { IUserService } from '@/domain/services/IUserService';
import { UserService } from './UserService';
import { UserClient } from '../clients/UserClient';
import { User } from '@/domain/entities/User';
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

/**
 * UserServiceAdapter implements IUserService interface by delegating
 * to the static methods in UserService
 */
export class UserServiceAdapter implements IUserService {
  private logger = getLogger();

  constructor() {
    this.logger.debug('Initialized UserServiceAdapter');
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
      
      const response = await UserService.getUsers(filters);
      
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
      this.logger.error('Error in UserServiceAdapter.getAll:', error as Error);
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
      const response = await UserService.getUserById(id);
      return response.success && response.data ? response.data : null;
    } catch (error) {
      this.logger.error(`Error in UserServiceAdapter.getById(${id}):`, error as Error);
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
      this.logger.error(`Error in UserServiceAdapter.findByEmail(${email}):`, error as Error);
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
      
      const response = await UserService.getUsers(filters);
      
      if (response.success && response.data && response.data.data.length > 0) {
        return response.data.data[0];
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error in UserServiceAdapter.findByName(${name}):`, error as Error);
      return null;
    }
  }

  /**
   * Get detailed user information
   */
  async getUserDetails(id: number, options?: ServiceOptions): Promise<UserDetailResponseDto | null> {
    try {
      const response = await UserService.getUserById(id);
      
      if (response.success && response.data) {
        // Convert UserResponseDto to UserDetailResponseDto
        // This might need to be expanded based on what fields are in UserDetailResponseDto
        return response.data as unknown as UserDetailResponseDto;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error in UserServiceAdapter.getUserDetails(${id}):`, error as Error);
      return null;
    }
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserDto, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      const response = await UserService.createUser(data);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create user');
    } catch (error) {
      this.logger.error('Error in UserServiceAdapter.create:', error as Error);
      throw error;
    }
  }

  /**
   * Update a user
   */
  async update(id: number, data: UpdateUserDto, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      const response = await UserService.updateUser(id, data);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update user');
    } catch (error) {
      this.logger.error(`Error in UserServiceAdapter.update(${id}):`, error as Error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const response = await UserService.deleteUser(id);
      return response.success;
    } catch (error) {
      this.logger.error(`Error in UserServiceAdapter.delete(${id}):`, error as Error);
      return false;
    }
  }

  /**
   * Find users with filters
   */
  async findUsers(filters: UserFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<UserResponseDto>> {
    try {
      const response = await UserService.getUsers(filters);
      
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
      this.logger.error('Error in UserServiceAdapter.findUsers:', error as Error);
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
      const response = await UserService.changePassword({
        oldPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });
      
      return response.success;
    } catch (error) {
      this.logger.error(`Error in UserServiceAdapter.changePassword(${userId}):`, error as Error);
      return false;
    }
  }

  /**
   * Update a user's status
   */
  async updateStatus(userId: number, data: UpdateUserStatusDto, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      const response = await UserService.updateUserStatus(userId, data);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update user status');
    } catch (error) {
      this.logger.error(`Error in UserServiceAdapter.updateStatus(${userId}):`, error as Error);
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
      
      const response = await UserService.getUsers(filters);
      
      if (response.success && response.data && response.data.data) {
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      this.logger.error(`Error in UserServiceAdapter.searchUsers(${searchText}):`, error as Error);
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
        UserService.getWeeklyStats(),
        UserService.getMonthlyStats(),
        UserService.getYearlyStats()
      ]);
      
      return {
        weekly: weeklyResponse.success ? weeklyResponse.data : null,
        monthly: monthlyResponse.success ? monthlyResponse.data : null,
        yearly: yearlyResponse.success ? yearlyResponse.data : null
      };
    } catch (error) {
      this.logger.error('Error in UserServiceAdapter.getUserStatistics:', error as Error);
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
      const response = await UserService.getUserActivity(userId, limit);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      this.logger.error(`Error in UserServiceAdapter.getUserActivity(${userId}):`, error as Error);
      return [];
    }
  }

  /**
   * Soft delete a user
   */
  async softDelete(userId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      // Implement soft delete by updating status
      const response = await UserService.updateUserStatus(userId, { status: 'deleted' });
      return response.success;
    } catch (error) {
      this.logger.error(`Error in UserServiceAdapter.softDelete(${userId}):`, error as Error);
      return false;
    }
  }

  /**
   * Hard delete a user
   */
  async hardDelete(userId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const response = await UserService.deleteUser(userId);
      return response.success;
    } catch (error) {
      this.logger.error(`Error in UserServiceAdapter.hardDelete(${userId}):`, error as Error);
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
      this.logger.warn('UserServiceAdapter.authenticate called, but this should be handled by AuthService');
      return null;
    } catch (error) {
      this.logger.error(`Error in UserServiceAdapter.authenticate(${email}):`, error as Error);
      return null;
    }
  }

  /**
   * Update a user's password (admin operation)
   */
  async updatePassword(userId: number, password: string, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      const response = await UserService.adminResetPassword(userId, password);
      
      if (response.success) {
        // Get the updated user
        const userResponse = await UserService.getUserById(userId);
        
        if (userResponse.success && userResponse.data) {
          return userResponse.data;
        }
      }
      
      throw new Error(response.message || 'Failed to update password');
    } catch (error) {
      this.logger.error(`Error in UserServiceAdapter.updatePassword(${userId}):`, error as Error);
      throw error;
    }
  }
}
