// Re-export for backward compatibility
import { UserServiceClient } from './UserService.client';

// For proper import by default
export * from './UserService.client';
import { 
  UserDto, 
  CreateUserDto,
  UpdateUserDto,
  UserFilterParamsDto,
  UpdateUserStatusDto
} from '@/domain/dtos/UserDtos';
import { ActivityLogDto } from '@/domain/dtos/ActivityLogDto';
import { ApiResponse, ApiClient } from '@/core/api';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

// Create instance of UserServiceClient to use for static methods
const userServiceClientInstance = new UserServiceClient();

/**
 * Helper function to wrap responses in API format
 */
function wrapInApiResponse<T>(data: T, message = 'Success'): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    error: null,
  };
}

/**
 * Helper function to handle errors and wrap in API format
 */
function handleError(error: any, message = 'An error occurred'): ApiResponse<any> {
  console.error(message, error);
  return {
    success: false,
    data: null,
    error: error instanceof Error ? error.message : String(error),
    message: error instanceof Error ? error.message : String(message),
    statusCode: 500
  };
}

/**
 * Proxy Service for handling user-related operations
 * This file re-exports the client-side UserService implementation for backward compatibility
 * This pattern follows the service.client.ts and service.server.ts pattern used in other modules
 */
export class UserService {
  /**
   * Get users with optional filtering
   */
  static async getUsers(filters?: UserFilterParamsDto) {
    try {
      const result = await userServiceClientInstance.findUsers(filters || {});
      return wrapInApiResponse(result);
    } catch (error) {
      return handleError(error, 'Failed to get users');
    }
  }

  /**
   * Get a user by ID
   */
  static async getUserById(id: number | string) {
    try {
      const result = await userServiceClientInstance.getById(Number(id));
      return wrapInApiResponse(result);
    } catch (error) {
      return handleError(error, `Failed to get user ${id}`);
    }
  }

  /**
   * Get the current logged-in user
   */
  static async getCurrentUser() {
    try {
      // This method doesn't exist in UserServiceClient, we need to implement it
      const { UserClient } = await import('../clients/UserClient');
      return UserClient.getCurrentUser(); // Already returns API response format
    } catch (error) {
      return handleError(error, 'Failed to get current user');
    }
  }

  /**
   * Create a new user
   */
  static async createUser(data: CreateUserDto) {
    try {
      // Remove confirmPassword field to prevent Prisma errors
      const { confirmPassword, ...cleanData } = data as any;
      
      const result = await userServiceClientInstance.create(cleanData);
      
      // Check if result is null or undefined and handle it properly
      if (!result) {
        return {
          success: false,
          data: null,
          error: 'Failed to create user - no data returned',
          message: 'User creation failed',
          statusCode: 500
        };
      }
      
      return wrapInApiResponse(result, 'User created successfully');
    } catch (error) {
      return handleError(error, 'Failed to create user');
    }
  }

  /**
   * Update a user
   */
  static async updateUser(id: number | string, data: UpdateUserDto) {
    try {
      const result = await userServiceClientInstance.update(Number(id), data);
      return wrapInApiResponse(result, 'User updated successfully');
    } catch (error) {
      return handleError(error, `Failed to update user ${id}`);
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: number | string) {
    try {
      const result = await userServiceClientInstance.delete(Number(id));
      return wrapInApiResponse(result, 'User deleted successfully');
    } catch (error) {
      return handleError(error, `Failed to delete user ${id}`);
    }
  }

  /**
   * Reset a user's password (admin function)
   */
  static async resetUserPassword(id: number | string) {
    try {
      // This method doesn't exist in UserServiceClient, we need to implement it
      const { UserClient } = await import('../clients/UserClient');
      return UserClient.resetUserPassword(Number(id)); // Already returns API response format
    } catch (error) {
      return handleError(error, `Failed to reset password for user ${id}`);
    }
  }
  
  /**
   * Admin reset user password with a specific password
   */
  static async adminResetPassword(id: number | string, password: string) {
    try {
      const result = await userServiceClientInstance.updatePassword(Number(id), password);
      return wrapInApiResponse(result, 'Password reset successfully');
    } catch (error) {
      return handleError(error, `Failed to reset password for user ${id}`);
    }
  }

  /**
   * Update the current user's profile
   */
  static async updateCurrentUser(data: UpdateUserDto) {
    try {
      // This method doesn't exist in UserServiceClient, we need to implement it
      const { UserClient } = await import('../clients/UserClient');
      return UserClient.updateCurrentUser(data); // Already returns API response format
    } catch (error) {
      return handleError(error, 'Failed to update user profile');
    }
  }
  
  /**
   * Change password
   */
  static async changePassword(data: { oldPassword: string; newPassword: string; confirmPassword: string }) {
    try {
      // Import the UserClient first
      const { UserClient } = await import('../clients/UserClient');
      // Then call the changePassword method and await the result
      const response = await UserClient.changePassword(data);
      // Return the response
      return response;
    } catch (error) {
      return handleError(error, 'Failed to change password');
    }
  }

  /**
   * Get a user's permissions
   */
  static async getUserPermissions(userId: number | string) {
    try {
      // This method doesn't exist in UserServiceClient, we need to implement it
      const { UserClient } = await import('../clients/UserClient');
      return UserClient.getUserPermissions(Number(userId)); // Already returns API response format
    } catch (error) {
      return handleError(error, `Failed to get permissions for user ${userId}`);
    }
  }

  /**
   * Update a user's permissions
   */
  static async updateUserPermissions(userId: number | string, permissions: string[]) {
    try {
      // This method doesn't exist in UserServiceClient, we need to implement it
      const { UserClient } = await import('../clients/UserClient');
      return UserClient.updateUserPermissions(Number(userId), permissions); // Already returns API response format
    } catch (error) {
      return handleError(error, `Failed to update permissions for user ${userId}`);
    }
  }

  /**
   * Update a user's status
   */
  static async updateUserStatus(id: number | string, data: UpdateUserStatusDto) {
    try {
      const result = await userServiceClientInstance.updateStatus(Number(id), data);
      return wrapInApiResponse(result, `User status updated to ${data.status}`);
    } catch (error) {
      return handleError(error, `Failed to update status for user ${id}`);
    }
  }

  /**
   * Get user activity logs
   */
  static async getUserActivity(userId: number | string, limit?: number) {
    try {
      const result = await userServiceClientInstance.getUserActivity(Number(userId), limit);
      return wrapInApiResponse(result, 'User activity retrieved');
    } catch (error) {
      return handleError(error, `Failed to get activity for user ${userId}`);
    }
  }

  /**
   * Get total user count
   */
  static async count() {
    try {
      const result = await userServiceClientInstance.count();
      return wrapInApiResponse({ count: result }, 'User count retrieved');
    } catch (error) {
      return handleError(error, 'Failed to get user count');
    }
  }

  /**
   * Get weekly user statistics
   */
  static async getWeeklyStats() {
    try {
      // This method doesn't exist in UserServiceClient, we need to implement it
      const { UserClient } = await import('../clients/UserClient');
      return UserClient.getWeeklyStats(); // Already returns API response format
    } catch (error) {
      return handleError(error, 'Failed to get weekly statistics');
    }
  }
  
  /**
   * Get monthly user statistics
   */
  static async getMonthlyStats() {
    try {
      // This method doesn't exist in UserServiceClient, we need to implement it
      const { UserClient } = await import('../clients/UserClient');
      return UserClient.getMonthlyStats(); // Already returns API response format
    } catch (error) {
      return handleError(error, 'Failed to get monthly statistics');
    }
  }
  
  /**
   * Get yearly user statistics
   */
  static async getYearlyStats() {
    try {
      // This method doesn't exist in UserServiceClient, we need to implement it
      const { UserClient } = await import('../clients/UserClient');
      return UserClient.getYearlyStats(); // Already returns API response format
    } catch (error) {
      return handleError(error, 'Failed to get yearly statistics');
    }
  }
}

// Default export for proper ServiceFactory integration
export default UserService;
