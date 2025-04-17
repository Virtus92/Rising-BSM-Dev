import { UserClient } from '@/infrastructure/api/UserClient';
import { 
  UserDto, 
  CreateUserDto,
  UpdateUserDto,
  UserFilterParamsDto,
  UpdateUserStatusDto
} from '@/domain/dtos/UserDtos';
import { ActivityLogDto } from '@/domain/dtos/ActivityLogDto';
import { ApiResponse } from './ApiClient';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

/**
 * Service for handling user-related operations
 * Acts as a facade between UI components and the API client
 */
export class UserService {
  /**
   * Get users with optional filtering
   */
  static async getUsers(filters?: UserFilterParamsDto): Promise<ApiResponse<PaginationResult<UserDto>>> {
    try {
      // Clean up filters before sending them to the API
      let cleanedFilters: UserFilterParamsDto = {};
      
      if (filters) {
        // Only include defined and non-empty values
        if (filters.page !== undefined) cleanedFilters.page = filters.page;
        if (filters.limit !== undefined) cleanedFilters.limit = filters.limit;
        if (filters.search !== undefined && filters.search !== '') cleanedFilters.search = filters.search;
        if (filters.role !== undefined) cleanedFilters.role = filters.role;
        if (filters.status !== undefined) cleanedFilters.status = filters.status;
        if (filters.sortBy !== undefined) cleanedFilters.sortBy = filters.sortBy;
        if (filters.sortDirection !== undefined) cleanedFilters.sortDirection = filters.sortDirection;
      }
      
      const response = await UserClient.getUsers(cleanedFilters);
      
      if (response.success) {
        // If the API already returns the correct pagination structure
        if (response.data && response.data.data && response.data.pagination) {
          return response;
        }
        
        // If the API returns just a data array without pagination
        if (response.data && Array.isArray(response.data)) {
          const paginationResult: PaginationResult<UserDto> = {
            data: response.data,
            pagination: {
              page: filters?.page || 1,
              limit: filters?.limit || 10,
              total: response.data.length,
              totalPages: Math.ceil(response.data.length / (filters?.limit || 10))
            }
          };
          
          return {
            success: true,
            data: paginationResult,
            message: response.message,
            statusCode: response.statusCode
          };
        }
      }
      
      return response as any;
    } catch (error) {
      console.error('Error in UserService.getUsers:', error);
      return {
        success: false,
        data: {
          data: [],
          pagination: {
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            total: 0,
            totalPages: 0
          }
        },
        message: error instanceof Error ? error.message : 'Failed to fetch users'
      };
    }
  }

  /**
   * Get a user by ID
   */
  static async getUserById(id: number | string): Promise<ApiResponse<UserDto>> {
    return UserClient.getUserById(id);
  }

  /**
   * Get the current logged-in user
   */
  static async getCurrentUser(): Promise<ApiResponse<UserDto>> {
    return UserClient.getCurrentUser();
  }

  /**
   * Create a new user
   */
  static async createUser(data: CreateUserDto): Promise<ApiResponse<UserDto>> {
    return UserClient.createUser(data);
  }

  /**
   * Update a user
   */
  static async updateUser(id: number | string, data: UpdateUserDto): Promise<ApiResponse<UserDto>> {
    return UserClient.updateUser(id, data);
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: number | string): Promise<ApiResponse<void>> {
    return UserClient.deleteUser(id);
  }

  /**
   * Reset a user's password (admin function) - generates a password automatically
   */
  static async resetUserPassword(id: number | string): Promise<ApiResponse<{ password: string }>> {
    return UserClient.resetUserPassword(id);
  }
  
  /**
   * Admin reset user password with a specific password
   */
  static async adminResetPassword(id: number | string, password: string): Promise<ApiResponse<any>> {
    return UserClient.adminResetPassword(id, password);
  }

  /**
   * Update the current user's profile
   */
  static async updateCurrentUser(data: UpdateUserDto): Promise<ApiResponse<UserDto>> {
    return UserClient.updateCurrentUser(data);
  }
  
  /**
   * Change password
   */
  static async changePassword(data: { oldPassword: string; newPassword: string; confirmPassword: string }): Promise<ApiResponse<void>> {
    return UserClient.changePassword(data);
  }

  /**
   * Get a user's permissions
   */
  static async getUserPermissions(userId: number | string): Promise<ApiResponse<{ permissions: string[] }>> {
    return UserClient.getUserPermissions(userId);
  }

  /**
   * Update a user's permissions
   */
  static async updateUserPermissions(userId: number | string, permissions: string[]): Promise<ApiResponse<any>> {
    return UserClient.updateUserPermissions(userId, permissions);
  }

  /**
   * Update a user's status
   * 
   * @param id - User ID 
   * @param data - Status update data including status and optional reason
   * @returns API response
   */
  static async updateUserStatus(id: number | string, data: UpdateUserStatusDto): Promise<ApiResponse<UserDto>> {
    return UserClient.updateUserStatus(id, data);
  }

  /**
   * Get user activity logs
   * 
   * @param userId - User ID
   * @param limit - Optional limit for number of records
   * @returns API response with activity logs
   */
  static async getUserActivity(userId: number | string, limit?: number): Promise<ApiResponse<ActivityLogDto[]>> {
    return UserClient.getUserActivity(userId, limit);
  }

  /**
   * Get total user count
   */
  static async count(): Promise<ApiResponse<{ count: number }>> {
    return UserClient.count();
  }

  /**
   * Get weekly user statistics
   */
  static async getWeeklyStats(): Promise<ApiResponse<any>> {
    return UserClient.getWeeklyStats();
  }
  
  /**
   * Get monthly user statistics
   */
  static async getMonthlyStats(): Promise<ApiResponse<any>> {
    return UserClient.getMonthlyStats();
  }
  
  /**
   * Get yearly user statistics
   */
  static async getYearlyStats(): Promise<ApiResponse<any>> {
    return UserClient.getYearlyStats();
  }
}
