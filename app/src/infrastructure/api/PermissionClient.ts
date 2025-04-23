/**
 * API-Client for Permission Management
 */
import { 
  CreatePermissionDto, 
  UpdatePermissionDto, 
  PermissionResponseDto,
  UserPermissionsResponseDto,
  UpdateUserPermissionsDto
} from '@/domain/dtos/PermissionDtos';
import { ApiClient, ApiResponse, apiClient } from '@/infrastructure/clients/ApiClient';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

// API-URL for permissions
const PERMISSIONS_API_URL = '/permissions';
const USER_PERMISSIONS_API_URL = '/users/permissions';

/**
 * Client for permission API requests
 */
export class PermissionClient {
  /**
   * Singleton instance of the API client
   */
  private static apiClient = apiClient;

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
    const maxRetries = customParams?.maxRetries ?? PermissionClient.MAX_RETRIES;
    let attempts = 0;

    // Implement retry logic for transient errors
    while (attempts <= maxRetries) {
      try {
        // Use the appropriate method from the API client
        if (method === 'get') {
          return await PermissionClient.apiClient.get(url);
        } else if (method === 'post') {
          return await PermissionClient.apiClient.post(url, data);
        } else if (method === 'put') {
          return await PermissionClient.apiClient.put(url, data);
        } else if (method === 'delete') {
          return await PermissionClient.apiClient.delete(url);
        } else if (method === 'patch') {
          return await PermissionClient.apiClient.patch(url, data);
        }

        // If we get here, method was invalid (shouldn't happen due to TypeScript)
        throw new Error(`Invalid API method: ${method}`);
      } catch (error: any) {
        attempts++;
        
        // Only retry for network or server errors (not validation or auth errors)
        const isTransientError = (
          !error.statusCode || // Network error
          error.statusCode >= 500 || // Server error
          error.statusCode === 429 // Rate limiting
        );
        
        if (!isTransientError || attempts > maxRetries) {
          // Don't retry client errors or if we've reached max retries
          if (error.message) {
            console.error(`API error (${method.toUpperCase()} ${url}):`, error.message);
            return {
              success: false,
              message: error.message,
              data: null,
              statusCode: error.statusCode || 500
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
   * Gets all permissions with optional filtering
   * 
   * @param params - Optional filter parameters
   * @returns API response
   */
  static async getPermissions(params: Record<string, any> = {}): Promise<ApiResponse<PaginationResult<PermissionResponseDto>>> {
    const queryString = PermissionClient.createQueryParams(params);
    const url = `${PERMISSIONS_API_URL}${queryString}`;
    
    return await PermissionClient.apiRequest<PaginationResult<PermissionResponseDto>>('get', url);
  }
  
  /**
   * Gets a permission by ID
   * 
   * @param id - Permission ID
   * @returns API response
   */
  static async getPermissionById(id: number | string): Promise<ApiResponse<PermissionResponseDto>> {
    return await PermissionClient.apiRequest<PermissionResponseDto>('get', `${PERMISSIONS_API_URL}/${id}`);
  }
  
  /**
   * Gets a permission by code
   * 
   * @param code - Permission code
   * @returns API response
   */
  static async getPermissionByCode(code: string): Promise<ApiResponse<PermissionResponseDto>> {
    return await PermissionClient.apiRequest<PermissionResponseDto>('get', `${PERMISSIONS_API_URL}/by-code/${code}`);
  }
  
  /**
   * Creates a new permission
   * 
   * @param data - Permission data
   * @returns API response
   */
  static async createPermission(data: CreatePermissionDto): Promise<ApiResponse<PermissionResponseDto>> {
    return await PermissionClient.apiRequest<PermissionResponseDto>('post', PERMISSIONS_API_URL, data);
  }
  
  /**
   * Updates a permission
   * 
   * @param id - Permission ID
   * @param data - Permission update data
   * @returns API response
   */
  static async updatePermission(id: number | string, data: UpdatePermissionDto): Promise<ApiResponse<PermissionResponseDto>> {
    return await PermissionClient.apiRequest<PermissionResponseDto>('put', `${PERMISSIONS_API_URL}/${id}`, data);
  }
  
  /**
   * Deletes a permission
   * 
   * @param id - Permission ID
   * @returns API response
   */
  static async deletePermission(id: number | string): Promise<ApiResponse<void>> {
    return await PermissionClient.apiRequest<void>('delete', `${PERMISSIONS_API_URL}/${id}`);
  }
  
  /**
   * Ongoing permission requests cache by userId to prevent duplicates
   */
  private static permissionRequestsInProgress = new Map<string, Promise<ApiResponse<UserPermissionsResponseDto>>>();

  /**
   * Gets permissions for a user with request deduplication
   * 
   * @param userId - User ID
   * @returns API response
   */
  static async getUserPermissions(userId: number | string): Promise<ApiResponse<UserPermissionsResponseDto>> {
    try {
      if (!userId) {
        return {
          success: false,
          message: 'Invalid user ID provided',
          data: null,
          statusCode: 400
        };
      }
      
      const cacheKey = `permissions_${userId}`;
      
      // Check if a request for this user is already in progress
      if (PermissionClient.permissionRequestsInProgress.has(cacheKey)) {
        console.debug(`Using existing permissions request for user ID: ${userId}`);
        return await PermissionClient.permissionRequestsInProgress.get(cacheKey)!;
      }
      
      // Create a new request and add it to the in-progress map
      const requestPromise = PermissionClient.apiRequest<UserPermissionsResponseDto>(
        'get', 
        `${USER_PERMISSIONS_API_URL}?userId=${userId}`,
        undefined,
        { maxRetries: 2 } // Use 2 retries for permission requests
      );
      
      // Store the promise in the in-progress map
      PermissionClient.permissionRequestsInProgress.set(cacheKey, requestPromise);
      
      // Clean up the cache after the request completes
      requestPromise.finally(() => {
        setTimeout(() => {
          PermissionClient.permissionRequestsInProgress.delete(cacheKey);
        }, 300); // Short delay to prevent rapid successive calls
      });
      
      return await requestPromise;
    } catch (error) {
      console.error('Error fetching user permissions:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: 'Failed to fetch user permissions',
        data: null,
        statusCode: 500
      };
    }
  }
  
  /**
   * Updates permissions for a user
   * 
   * @param data - Update data
   * @returns API response
   */
  static async updateUserPermissions(data: UpdateUserPermissionsDto): Promise<ApiResponse<boolean>> {
    try {
      if (!data.userId || !Array.isArray(data.permissions)) {
        return {
          success: false,
          message: 'Invalid data: userId and permissions array are required',
          data: null,
          statusCode: 400
        };
      }
      
      const response = await PermissionClient.apiRequest<boolean>('post', USER_PERMISSIONS_API_URL, data);
      
      // Log update for debugging purposes
      if (response.success) {
        console.debug(`Successfully updated permissions for user ${data.userId}: ${data.permissions.length} permissions`);
      } else {
        console.error(`Failed to update permissions for user ${data.userId}:`, response.message);
      }
      
      return response;
    } catch (error) {
      console.error('Error updating user permissions:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: 'Failed to update user permissions',
        data: null,
        statusCode: 500
      };
    }
  }
  
  /**
   * Gets default permissions for a role
   * 
   * @param role - User role
   * @returns API response
   */
  static async getDefaultPermissionsForRole(role: string): Promise<ApiResponse<string[]>> {
    return await PermissionClient.apiRequest<string[]>('get', `${PERMISSIONS_API_URL}/role-defaults/${role}`);
  }
  
  /**
   * Checks if a user has a specific permission
   * 
   * @param userId - User ID
   * @param permission - Permission to check
   * @returns API response indicating whether user has the permission
   */
  static async hasPermission(userId: number | string, permission: SystemPermission | string): Promise<ApiResponse<boolean>> {
    return await PermissionClient.apiRequest<boolean>(
      'get',
      `${USER_PERMISSIONS_API_URL}/check?userId=${userId}&permission=${encodeURIComponent(permission)}`
    );
  }
}
