/**
 * API-Client for User Management
 */
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto,
  UpdateUserStatusDto
} from '@/domain/dtos/UserDtos';
import { ActivityLogDto } from '@/domain/dtos/ActivityLogDto';
import { ApiClient, ApiResponse } from '@/core/api/ApiClient';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

// API-URL for Users
const USERS_API_URL = '/users';

/**
 * Client for User API requests
 */
export class UserClient {
  /**
   * Maximum number of retries for API calls
   */
  private static MAX_RETRIES = 2;

  /**
   * Base timeout for API calls in milliseconds
   */
  private static BASE_TIMEOUT = 5000;

  /**
   * Helper method to handle API requests with retry logic
   * 
   * @param method - Request method (get, post, etc.)
   * @param url - API endpoint URL
   * @param data - Optional data for POST/PUT requests
   * @returns API response
   */
  private static async apiRequest<T>(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    url: string, 
    data?: any,
    customParams?: { maxRetries?: number }
  ): Promise<ApiResponse<T>> {
    const maxRetries = customParams?.maxRetries ?? UserClient.MAX_RETRIES;
    let attempts = 0;

    // Implement retry logic for transient errors
    while (attempts <= maxRetries) {
      try {
        // Use the appropriate method from the API client
        if (method === 'get') {
          return await ApiClient.get(url);
        } else if (method === 'post') {
          return await ApiClient.post(url, data);
        } else if (method === 'put') {
          return await ApiClient.put(url, data);
        } else if (method === 'delete') {
          return await ApiClient.delete(url);
        } else if (method === 'patch') {
          return await ApiClient.patch(url, data);
        }

        // If we get here, method was invalid (shouldn't happen due to TypeScript)
        throw new Error(`Invalid API method: ${method}`);
      } catch (error: unknown) {
        attempts++;
        
        // Only retry for network or server errors (not validation or auth errors)
        const isTransientError = (
          !(error as any)?.statusCode || // Network error
          (error as any)?.statusCode >= 500 || // Server error
          (error as any)?.statusCode === 429 // Rate limiting
        );
        
        if (!isTransientError || attempts > maxRetries) {
          // Don't retry client errors or if we've reached max retries
          if ((error as any)?.message) {
            console.error(`API error (${method.toUpperCase()} ${url}):`, (error as any).message);
            return {
              success: false,
              message: (error as any).message,
              data: null,
              statusCode: (error as any)?.statusCode || 500
            };
          }
          break;
        }
        
        // Exponential backoff: wait longer between each retry
        const delayMs = Math.pow(2, attempts) * 100;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    // If we get here, all retries failed or we had a non-retryable error
    console.error(`All retries failed for ${method.toUpperCase()} ${url}`);
    return {
      success: false,
      message: `Failed to ${method} data after multiple attempts`,
      data: null,
      statusCode: 500
    };
  }

  /**
   * Creates query parameters from an object
   */
  private static createQueryParams(params: Record<string, any> = {}): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Gets all users with optional filtering
   * 
   * @param params - Optional filter parameters
   * @returns API response
   */
  static async getUsers(params: Record<string, any> = {}): Promise<ApiResponse<PaginationResult<UserResponseDto>>> {
    const queryString = UserClient.createQueryParams(params);
    const url = `${USERS_API_URL}${queryString}`;
    
    return await UserClient.apiRequest<PaginationResult<UserResponseDto>>('get', url);
  }
  
  /**
   * Gets a user by ID
   * 
   * @param id - User ID
   * @returns API response
   */
  static async getUserById(id: number | string): Promise<ApiResponse<UserResponseDto>> {
    return await UserClient.apiRequest<UserResponseDto>('get', `${USERS_API_URL}/${id}`);
  }
  
  /**
   * Gets the current logged-in user
   * 
   * @returns API response
   */
  static async getCurrentUser(): Promise<ApiResponse<UserResponseDto>> {
    return await UserClient.apiRequest<UserResponseDto>('get', `${USERS_API_URL}/me`);
  }
  
  /**
   * Creates a new user
   * 
   * @param data - User data
   * @returns API response
   */
  static async createUser(data: CreateUserDto): Promise<ApiResponse<UserResponseDto>> {
    return await UserClient.apiRequest<UserResponseDto>('post', USERS_API_URL, data);
  }
  
  /**
   * Updates a user
   * 
   * @param id - User ID
   * @param data - Update data
   * @returns API response
   */
  static async updateUser(id: number | string, data: UpdateUserDto): Promise<ApiResponse<UserResponseDto>> {
    try {
      // Handle profile picture path consistency
      if (data.profilePicture && typeof data.profilePicture === 'string') {
        // Ensure proper path format for profile pictures
        const path = data.profilePicture;
        if (path.includes('/uploads/')) {
          // Fix inconsistent casing in profilePictures path
          if (path.includes('/uploads/profilePictures/')) {
            // Already correct format - keep as is
          } else if (path.toLowerCase().includes('/uploads/profilepictures/')) {
            // Fix casing to ensure consistency
            data.profilePicture = path.replace(
              /\/uploads\/profilepictures\//i, 
              '/uploads/profilePictures/'
            );
          }
        }
      }
      
      // Add retry logic specifically for user updates
      let attempts = 0;
      const maxAttempts = 3;
      let lastError = null;
      
      while (attempts < maxAttempts) {
        try {
          // Wait with exponential backoff before retries
          if (attempts > 0) {
            const delay = Math.pow(2, attempts) * 300; // 600ms, 1200ms
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          attempts++;
          return await UserClient.apiRequest<UserResponseDto>('put', `${USERS_API_URL}/${id}`, data);
        } catch (error) {
          lastError = error;
          console.warn(`Error updating user (attempt ${attempts}/${maxAttempts}):`, error as Error);
          
          // Don't retry on client errors like validation errors
          const statusCode = (error as any).statusCode || 500;
          if (statusCode < 500 && statusCode !== 429) {
            throw error; // Don't retry on 4xx errors except for rate limiting (429)
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError || new Error('Failed to update user after multiple attempts');
    } catch (error: unknown) {
      console.error('Error in UserClient.updateUser:', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user',
        data: null,
        statusCode: (error as any)?.statusCode || 500
      };
    }
  }
  
  /**
   * Updates the current user
   * 
   * @param data - Update data
   * @returns API response
   */
  static async updateCurrentUser(data: UpdateUserDto): Promise<ApiResponse<UserResponseDto>> {
    return await UserClient.apiRequest<UserResponseDto>('put', `${USERS_API_URL}/me`, data);
  }
  
  /**
   * Deletes a user
   * 
   * @param id - User ID
   * @returns API response
   */
  static async deleteUser(id: number | string): Promise<ApiResponse<void>> {
    return await UserClient.apiRequest<void>('delete', `${USERS_API_URL}/${id}`);
  }
  
  /**
   * Initiates a password reset for a user (Admin function)
   * This sends a reset token to the user's email
   * 
   * @param id - User ID
   * @returns API response with success status
   */
  static async initiatePasswordReset(id: number | string): Promise<ApiResponse<{ success: boolean }>> {
    return await UserClient.apiRequest<{ success: boolean }>('post', `${USERS_API_URL}/${id}/reset-password`, {});
  }
  
  /**
   * Completes a password reset using a token
   * 
   * @param token - Reset token
   * @param newPassword - New password
   * @returns API response with success status
   */
  static async completePasswordReset(token: string, newPassword: string): Promise<ApiResponse<{ success: boolean }>> {
    return await UserClient.apiRequest<{ success: boolean }>('post', `${USERS_API_URL}/reset-password`, {
      token,
      newPassword
    });
  }

  /**
   * Resets a user's password (admin function)
   * Returns a new temporary password
   * 
   * @param id - User ID
   * @returns API response with new password
   */
  static async resetUserPassword(id: number | string): Promise<ApiResponse<{ password: string }>> {
    return await UserClient.apiRequest<{ password: string }>('post', `${USERS_API_URL}/${id}/reset-password`, {});
  }
  
  /**
   * Sets a new password for a user (admin function)
   * 
   * @param id - User ID
   * @param password - New password to set
   * @returns API response
   */
  static async adminResetPassword(id: number | string, password: string): Promise<ApiResponse<any>> {
    return await UserClient.apiRequest<any>('post', `${USERS_API_URL}/${id}/reset-password`, { password });
  }

  /**
   * Finds a user by email
   * 
   * @param email - Email address to search for
   * @returns API response with user if found
   */
  static async findByEmail(email: string): Promise<ApiResponse<UserResponseDto | null>> {
    const url = `${USERS_API_URL}/find-by-email?email=${encodeURIComponent(email)}`;
    return await UserClient.apiRequest<UserResponseDto | null>('get', url);
  }

  /**
   * Gets available user roles
   * 
   * @returns API response with user roles
   */
  static async getUserRoles(): Promise<ApiResponse<string[]>> {
    return await UserClient.apiRequest<string[]>('get', `${USERS_API_URL}/roles`);
  }

  /**
   * Change the password of the current user
   * 
   * @param data - Password change data
   * @returns API response
   */
  static async changePassword(data: { oldPassword: string; newPassword: string; confirmPassword: string }): Promise<ApiResponse<void>> {
    // Map oldPassword to currentPassword as expected by the API
    const payload = {
      currentPassword: data.oldPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword
    };
    return await UserClient.apiRequest<void>('post', '/auth/change-password', payload);
  }

  /**
   * Gets permissions for a user
   * 
   * @param userId - User ID
   * @returns API response with permissions
   */
  static async getUserPermissions(userId: number | string): Promise<ApiResponse<{ permissions: string[] }>> {
    return await UserClient.apiRequest<{ permissions: string[] }>('get', `${USERS_API_URL}/permissions?userId=${userId}`);
  }
  
  /**
   * Updates permissions for a user
   * 
   * @param userId - User ID
   * @param permissions - List of permissions
   * @returns API response
   */
  static async updateUserPermissions(userId: number | string, permissions: string[]): Promise<ApiResponse<boolean>> {
    return await UserClient.apiRequest<boolean>('post', `${USERS_API_URL}/permissions`, { userId, permissions });
  }

  /**
   * Updates the status of a user
   * 
   * @param id - User ID
   * @param data - Status update data
   * @returns API response
   */
  static async updateUserStatus(id: number | string, data: UpdateUserStatusDto): Promise<ApiResponse<UserResponseDto>> {
    return await UserClient.apiRequest<UserResponseDto>('patch', `${USERS_API_URL}/${id}/status`, data);
  }

  /**
   * Gets activity logs for a user
   * 
   * @param userId - User ID
   * @param limit - Maximum number of records to return
   * @returns API response with activity logs
   */
  static async getUserActivity(userId: number | string, limit?: number): Promise<ApiResponse<ActivityLogDto[]>> {
    const params = limit ? { limit } : {};
    const queryString = UserClient.createQueryParams(params);
    const url = `${USERS_API_URL}/${userId}/activity${queryString}`;
    
    return await UserClient.apiRequest<ActivityLogDto[]>('get', url);
  }

  /**
   * Get total user count
   */
  static async count(): Promise<ApiResponse<{ count: number }>> {
    try {
      return await UserClient.apiRequest<{ count: number }>('get', `${USERS_API_URL}/count`);
    } catch (error: unknown) {
      console.error('Error in UserService.count:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch user count',
        statusCode: 500
      };
    }
  }

  /**
   * Get weekly user statistics
   */
  static async getWeeklyStats(): Promise<ApiResponse<any>> {
    return UserClient.apiRequest<any>('get', `${USERS_API_URL}/stats/weekly`);
  }
  
  /**
   * Get monthly user statistics
   */
  static async getMonthlyStats(): Promise<ApiResponse<any>> {
    return UserClient.apiRequest<any>('get', `${USERS_API_URL}/stats/monthly`);
  }
  
  /**
   * Get yearly user statistics
   */
  static async getYearlyStats(): Promise<ApiResponse<any>> {
    return UserClient.apiRequest<any>('get', `${USERS_API_URL}/stats/yearly`);
  }
}

export default UserClient;