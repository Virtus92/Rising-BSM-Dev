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
  private static apiRequest<T>(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    url: string, 
    data?: any,
    customParams?: { maxRetries?: number }
  ): Promise<ApiResponse<T>> {
    const maxRetries = customParams?.maxRetries ?? UserClient.MAX_RETRIES;
    let attempts = 0;

    // Return a new Promise that will handle retries
    return new Promise(async (resolve, reject) => {
      // Implement retry logic for transient errors
      while (attempts <= maxRetries) {
        try {
          let result: Promise<ApiResponse<T>>;
          
          // Use the appropriate method from the API client
          // Important: DO NOT await these calls here!
          if (method === 'get') {
            result = ApiClient.get(url);
          } else if (method === 'post') {
            result = ApiClient.post(url, data);
          } else if (method === 'put') {
            result = ApiClient.put(url, data);
          } else if (method === 'delete') {
            result = ApiClient.delete(url);
          } else if (method === 'patch') {
            result = ApiClient.patch(url, data);
          } else {
            // If we get here, method was invalid (shouldn't happen due to TypeScript)
            reject(new Error(`Invalid API method: ${method}`));
            return;
          }
          
          // Return the promise directly - don't await it here
          // This allows the calling methods to use the two-step await pattern
          resolve(result);
          return;
        } catch (error: unknown) {
          attempts++;
          
          // Only retry for network or server errors (not validation or auth errors)
          const errorObj = error as Record<string, any>;
          const isTransientError = (
            !errorObj?.statusCode || // Network error
            errorObj?.statusCode >= 500 || // Server error
            errorObj?.statusCode === 429 // Rate limiting
          );
          
          if (!isTransientError || attempts > maxRetries) {
            // Don't retry client errors or if we've reached max retries
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`API error (${method.toUpperCase()} ${url}):`, errorMessage);
            resolve({
              success: false,
              error: errorMessage,
              data: null,
            });
            return;
          }
          
          // Exponential backoff: wait longer between each retry
          const delayMs = Math.pow(2, attempts) * 100;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
      
      // If we get here, all retries failed or we had a non-retryable error
      console.error(`All retries failed for ${method.toUpperCase()} ${url}`);
      resolve({
        success: false,
        error: `Failed to ${method} data after ${maxRetries} attempts`,
        message: `Failed to ${method} data after multiple attempts`,
        data: null,
        statusCode: 500
      });
    });
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
  static async getUsers(params: Record<string, any> = {}, headers: Record<string, string> = {}): Promise<ApiResponse<PaginationResult<UserResponseDto>>> {
    try {
      // Process parameters first, before creating any Promises
      const queryString = UserClient.createQueryParams(params);
      const url = `${USERS_API_URL}${queryString}`;
      
      // Create the API request and return it directly without intermediate awaits
      // This prevents Function.prototype.apply errors in the Promise chain
      return ApiClient.get<PaginationResult<UserResponseDto>>(url, { headers });
    } catch (error: unknown) {
      console.error('Error in UserClient.getUsers:', error);
      const errorObj = error as Record<string, any>;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get users',
        message: error instanceof Error ? error.message : 'Failed to get users',
        data: null,
        statusCode: errorObj?.statusCode || 500
      };
    }
  }
  
  /**
   * Gets a user by ID
   * 
   * @param id - User ID
   * @returns API response
   */
  static async getUserById(id: number | string): Promise<ApiResponse<UserResponseDto>> {
    try {
      // Create the API call first, but don't await it yet
      // This prevents the Function.prototype.apply error
      const apiCall = UserClient.apiRequest<UserResponseDto>('get', `${USERS_API_URL}/${id}`);
      
      // Now await the promise
      return await apiCall;
    } catch (error: unknown) {
      console.error(`Error in UserClient.getUserById(${id}):`, error);
      const errorObj = error as Record<string, any>;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user',
        message: error instanceof Error ? error.message : 'Failed to get user',
        data: null,
        statusCode: errorObj?.statusCode || 500
      };
    }
  }
  
  /**
   * Gets the current logged-in user
   * 
   * @returns API response
   */
  static async getCurrentUser(): Promise<ApiResponse<UserResponseDto>> {
    try {
      // Create the API call first, but don't await it yet
      // This prevents the Function.prototype.apply error
      const apiCall = UserClient.apiRequest<UserResponseDto>('get', `${USERS_API_URL}/me`);
      
      // Now await the promise
      return await apiCall;
    } catch (error: unknown) {
      console.error('Error in UserClient.getCurrentUser:', error);
      const errorObj = error as Record<string, any>;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current user',
        message: error instanceof Error ? error.message : 'Failed to get current user',
        data: null,
        statusCode: errorObj?.statusCode || 500
      };
    }
  }
  
  /**
   * Creates a new user
   * 
   * @param data - User data
   * @returns API response
   */
  static async createUser(data: CreateUserDto): Promise<ApiResponse<UserResponseDto>> {
    try {
      // Remove confirmPassword if present to prevent Prisma errors
      const { confirmPassword, ...cleanData } = data as any;
      
      // Make the API request
      const response = await UserClient.apiRequest<UserResponseDto>('post', USERS_API_URL, cleanData);
      
      // Log the complete response for debugging
      console.log('UserClient.createUser response:', JSON.stringify(response));
      
      return response;
    } catch (error) {
      console.error('Error in UserClient.createUser:', error as Error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create user',
        message: 'User creation failed',
        statusCode: 500
      };
    }
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
          
          // Create the API call first, but don't await it yet
          // This prevents the Function.prototype.apply error
          const apiCall = UserClient.apiRequest<UserResponseDto>('put', `${USERS_API_URL}/${id}`, data);
          
          // Now await the promise
          return await apiCall;
        } catch (error) {
          lastError = error;
          console.warn(`Error updating user (attempt ${attempts}/${maxAttempts}):`, error as Error);
          
          // Don't retry on client errors like validation errors
          const errorObj = error as Record<string, any>;
          const statusCode = errorObj?.statusCode || 500;
          if (statusCode < 500 && statusCode !== 429) {
            throw error; // Don't retry on 4xx errors except for rate limiting (429)
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError || new Error('Failed to update user after multiple attempts');
    } catch (error: unknown) {
      console.error('Error in UserClient.updateUser:', error as Error);
      const errorObj = error as Record<string, any>;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
        message: error instanceof Error ? error.message : 'Failed to update user',
        data: null,
        statusCode: errorObj?.statusCode || 500
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
    try {
      return await UserClient.apiRequest<UserResponseDto>('put', `${USERS_API_URL}/me`, data);
    } catch (error: unknown) {
      console.error('Error in UserClient.updateCurrentUser:', error as Error);
      const errorObj = error as Record<string, any>;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user profile',
        message: error instanceof Error ? error.message : 'Failed to update user profile',
        data: null,
        statusCode: errorObj?.statusCode || 500
      };
    }
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
    try {
      const url = `${USERS_API_URL}/find-by-email?email=${encodeURIComponent(email)}`;
      
      // Create the API request and return it directly without intermediate awaits
      // This prevents Function.prototype.apply errors in the Promise chain
      return ApiClient.get<UserResponseDto | null>(url);
    } catch (error: unknown) {
      console.error(`Error in UserClient.findByEmail(${email}):`, error);
      const errorObj = error as Record<string, any>;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find user by email',
        message: error instanceof Error ? error.message : 'Failed to find user by email',
        data: null,
        statusCode: errorObj?.statusCode || 500
      };
    }
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
  static async getUserPermissions(userId: number | string): Promise<ApiResponse<{ permissions: string[], role?: string }>> {
    try {
      // Create the API call first, but don't await it yet
      // This prevents the Function.prototype.apply error
      const apiCall = UserClient.apiRequest<{ permissions: string[], role?: string }>('get', `${USERS_API_URL}/permissions?userId=${userId}`);
      
      // Now await the promise
      return await apiCall;
    } catch (error: unknown) {
      console.error('Error in UserClient.getUserPermissions:', error as Error);
      const errorObj = error as Record<string, any>;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user permissions',
        message: error instanceof Error ? error.message : 'Failed to get user permissions',
        data: null,
        statusCode: errorObj?.statusCode || 500
      };
    }
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
    try {
      const params = limit ? { limit } : {};
      const queryString = UserClient.createQueryParams(params);
      const url = `${USERS_API_URL}/${userId}/activity${queryString}`;
      
      // Create the API call first, but don't await it yet
      // This prevents the Function.prototype.apply error
      const apiCall = UserClient.apiRequest<ActivityLogDto[]>('get', url);
      
      // Now await the promise
      return await apiCall;
    } catch (error: unknown) {
      console.error(`Error in UserClient.getUserActivity(${userId}):`, error);
      const errorObj = error as Record<string, any>;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user activity',
        message: error instanceof Error ? error.message : 'Failed to get user activity',
        data: null,
        statusCode: errorObj?.statusCode || 500
      };
    }
  }

  /**
   * Get total user count
   */
  static async count(): Promise<ApiResponse<{ count: number }>> {
    try {
      // Create the API call first, but don't await it yet
      // This prevents the Function.prototype.apply error
      const apiCall = UserClient.apiRequest<{ count: number }>('get', `${USERS_API_URL}/count`);
      
      // Now await the promise
      return await apiCall;
    } catch (error: unknown) {
      console.error('Error in UserService.count:', error as Error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch user count',
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