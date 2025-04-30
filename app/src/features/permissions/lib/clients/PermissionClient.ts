/**
 * API-Client for Permission Management
 * This implementation removes all fallbacks and exposes errors directly
 */
import { 
  CreatePermissionDto, 
  UpdatePermissionDto, 
  PermissionResponseDto,
  UserPermissionsResponseDto,
  UpdateUserPermissionsDto
} from '@/domain/dtos/PermissionDtos';
import { ApiClient, ApiResponse, apiClient, ApiRequestError } from '@/core/api/ApiClient';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getItem } from '@/shared/utils/storage/cookieStorage';

// API-URL for permissions
const PERMISSIONS_API_URL = '/permissions';
const USER_PERMISSIONS_API_URL = '/users/permissions';

/**
 * Error class for permission-related API failures
 */
export class PermissionClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'PermissionClientError';
    Object.setPrototypeOf(this, PermissionClientError.prototype);
  }
}

/**
 * Client for permission API requests
 * This implementation exposes all errors directly without fallbacks
 */
export class PermissionClient {
  /**
   * Singleton instance of the API client
   */
  private static apiClient = apiClient;

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
   * @throws PermissionClientError for any API or network failures
   */
  static async getPermissions(params: Record<string, any> = {}): Promise<ApiResponse<PaginationResult<PermissionResponseDto>>> {
    try {
      const queryString = PermissionClient.createQueryParams(params);
      const url = `${PERMISSIONS_API_URL}${queryString}`;
      
      return await PermissionClient.apiClient.get<PaginationResult<PermissionResponseDto>>(url);
    } catch (error) {
      // Enhance error with more details
      if (error instanceof ApiRequestError) {
        throw new PermissionClientError(
          `Failed to get permissions: ${error.message}`,
          'GET_PERMISSIONS_FAILED',
          error,
          error.statusCode
        );
      }
      
      throw new PermissionClientError(
        `Failed to get permissions: ${error instanceof Error ? error.message : String(error)}`,
        'GET_PERMISSIONS_FAILED',
        error
      );
    }
  }
  
  /**
   * Gets a permission by ID
   * 
   * @param id - Permission ID
   * @returns API response
   * @throws PermissionClientError for any API or network failures
   */
  static async getPermissionById(id: number | string): Promise<ApiResponse<PermissionResponseDto>> {
    try {
      return await PermissionClient.apiClient.get<PermissionResponseDto>(`${PERMISSIONS_API_URL}/${id}`);
    } catch (error) {
      // Enhance error with more details
      if (error instanceof ApiRequestError) {
        throw new PermissionClientError(
          `Failed to get permission by ID ${id}: ${error.message}`,
          'GET_PERMISSION_BY_ID_FAILED',
          error,
          error.statusCode
        );
      }
      
      throw new PermissionClientError(
        `Failed to get permission by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
        'GET_PERMISSION_BY_ID_FAILED',
        error
      );
    }
  }
  
  /**
   * Gets a permission by code
   * 
   * @param code - Permission code
   * @returns API response
   * @throws PermissionClientError for any API or network failures
   */
  static async getPermissionByCode(code: string): Promise<ApiResponse<PermissionResponseDto>> {
    try {
      return await PermissionClient.apiClient.get<PermissionResponseDto>(`${PERMISSIONS_API_URL}/by-code/${code}`);
    } catch (error) {
      // Enhance error with more details
      if (error instanceof ApiRequestError) {
        throw new PermissionClientError(
          `Failed to get permission by code '${code}': ${error.message}`,
          'GET_PERMISSION_BY_CODE_FAILED',
          error,
          error.statusCode
        );
      }
      
      throw new PermissionClientError(
        `Failed to get permission by code '${code}': ${error instanceof Error ? error.message : String(error)}`,
        'GET_PERMISSION_BY_CODE_FAILED',
        error
      );
    }
  }
  
  /**
   * Creates a new permission
   * 
   * @param data - Permission data
   * @returns API response
   * @throws PermissionClientError for any API or network failures
   */
  static async createPermission(data: CreatePermissionDto): Promise<ApiResponse<PermissionResponseDto>> {
    try {
      return await PermissionClient.apiClient.post<PermissionResponseDto>(PERMISSIONS_API_URL, data);
    } catch (error) {
      // Enhance error with more details
      if (error instanceof ApiRequestError) {
        throw new PermissionClientError(
          `Failed to create permission: ${error.message}`,
          'CREATE_PERMISSION_FAILED',
          error,
          error.statusCode
        );
      }
      
      throw new PermissionClientError(
        `Failed to create permission: ${error instanceof Error ? error.message : String(error)}`,
        'CREATE_PERMISSION_FAILED',
        error
      );
    }
  }
  
  /**
   * Updates a permission
   * 
   * @param id - Permission ID
   * @param data - Permission update data
   * @returns API response
   * @throws PermissionClientError for any API or network failures
   */
  static async updatePermission(id: number | string, data: UpdatePermissionDto): Promise<ApiResponse<PermissionResponseDto>> {
    try {
      return await PermissionClient.apiClient.put<PermissionResponseDto>(`${PERMISSIONS_API_URL}/${id}`, data);
    } catch (error) {
      // Enhance error with more details
      if (error instanceof ApiRequestError) {
        throw new PermissionClientError(
          `Failed to update permission ${id}: ${error.message}`,
          'UPDATE_PERMISSION_FAILED',
          error,
          error.statusCode
        );
      }
      
      throw new PermissionClientError(
        `Failed to update permission ${id}: ${error instanceof Error ? error.message : String(error)}`,
        'UPDATE_PERMISSION_FAILED',
        error
      );
    }
  }
  
  /**
   * Deletes a permission
   * 
   * @param id - Permission ID
   * @returns API response
   * @throws PermissionClientError for any API or network failures
   */
  static async deletePermission(id: number | string): Promise<ApiResponse<void>> {
    try {
      return await PermissionClient.apiClient.delete<void>(`${PERMISSIONS_API_URL}/${id}`);
    } catch (error) {
      // Enhance error with more details
      if (error instanceof ApiRequestError) {
        throw new PermissionClientError(
          `Failed to delete permission ${id}: ${error.message}`,
          'DELETE_PERMISSION_FAILED',
          error,
          error.statusCode
        );
      }
      
      throw new PermissionClientError(
        `Failed to delete permission ${id}: ${error instanceof Error ? error.message : String(error)}`,
        'DELETE_PERMISSION_FAILED',
        error
      );
    }
  }
  
  /**
   * Ongoing permission requests cache by userId to prevent duplicates
   * This is for tracking purposes only - we don't use it for caching results
   */
  private static permissionRequestsInProgress = new Map<string, Promise<ApiResponse<UserPermissionsResponseDto>>>();

  /**
   * Gets permissions for a user with request tracking
   * 
   * @param userId - User ID
   * @returns API response
   * @throws PermissionClientError for any API or network failures
   */
  static async getUserPermissions(userId: number | string): Promise<ApiResponse<UserPermissionsResponseDto>> {
    // Validate userId at API boundary - throw clear error instead of returning error object
    if (!userId) {
      throw new PermissionClientError(
        'getUserPermissions called with invalid or missing userId',
        'INVALID_USER_ID',
        { userId }
      );
    }
      
    const cacheKey = `permissions_${userId}`;
    
    try {
      // Make the API call without error handling or caching
      console.log(`Fetching permissions for user ID: ${userId}`);
      
      // Get auth token from localStorage to include explicitly
      let authToken = null;
      try {
        authToken = getItem('auth_token_backup') || getItem('auth_token');
      } catch (tokenError) {
        console.warn('Error getting token from localStorage:', tokenError);
      }
      
      // Create custom headers for better auth handling
      const customHeaders: Record<string, string> = {};
      if (authToken) {
        customHeaders['Authorization'] = `Bearer ${authToken}`;
        customHeaders['X-Auth-Token'] = authToken;
      }
      
      // Create the API call with explicit auth token and custom headers
      const requestPromise = PermissionClient.apiClient.get<UserPermissionsResponseDto>(
        `${USER_PERMISSIONS_API_URL}?userId=${userId}`,
        {
          includeAuthToken: true, // Explicitly include auth token
          requestId: `permissions-${userId}-${Date.now()}`, // Add request ID for tracking
          headers: customHeaders,
          skipCache: true // Don't use cache for permission requests
        }
      );
      
      // Store for tracking only
      PermissionClient.permissionRequestsInProgress.set(cacheKey, requestPromise);
      
      // Wait for API response
      const response = await requestPromise;
      
      // Check response for common problems
      if (!response) {
        throw new PermissionClientError(
          `Empty response from permissions API for user ${userId}`,
          'EMPTY_RESPONSE',
          { userId }
        );
      }
      
      if (!response.success && response.statusCode === 401) {
        throw new PermissionClientError(
          `Authentication required to fetch permissions for user ${userId}`,
          'AUTHENTICATION_REQUIRED',
          response,
          401
        );
      }
      
      // Return the raw response - no error handling
      return response;
    } catch (error) {
      // Log the full error to help with debugging
      console.error(`Error fetching permissions for user ${userId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        statusCode: error instanceof ApiRequestError ? error.statusCode : undefined
      });
      
      // Enhance error with more details
      if (error instanceof ApiRequestError) {
        throw new PermissionClientError(
          `Failed to get user permissions for user ${userId}: ${error.message}`,
          'GET_USER_PERMISSIONS_FAILED',
          error,
          error.statusCode
        );
      }
      
      throw new PermissionClientError(
        `Failed to get user permissions for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
        'GET_USER_PERMISSIONS_FAILED',
        error
      );
    } finally {
      // Cleanup
      setTimeout(() => {
        PermissionClient.permissionRequestsInProgress.delete(cacheKey);
      }, 300);
    }
  }
  
  /**
   * Updates permissions for a user
   * 
   * @param data - Update data
   * @returns API response
   * @throws PermissionClientError for any API or network failures
   */
  static async updateUserPermissions(data: UpdateUserPermissionsDto): Promise<ApiResponse<boolean>> {
    try {
      if (!data.userId || !Array.isArray(data.permissions)) {
        throw new PermissionClientError(
          'Invalid data: userId and permissions array are required',
          'INVALID_UPDATE_DATA',
          data
        );
      }
      
      return await PermissionClient.apiClient.post<boolean>(USER_PERMISSIONS_API_URL, data, {
        includeAuthToken: true, // Explicitly include auth token
        requestId: `update-permissions-${data.userId}-${Date.now()}` // Add request ID for tracking
      });
    } catch (error) {
      // Enhance error with more details
      if (error instanceof ApiRequestError) {
        throw new PermissionClientError(
          `Failed to update user permissions for user ${data.userId}: ${error.message}`,
          'UPDATE_USER_PERMISSIONS_FAILED',
          error,
          error.statusCode
        );
      }
      
      // If it's already our error type, just rethrow
      if (error instanceof PermissionClientError) {
        throw error;
      }
      
      throw new PermissionClientError(
        `Failed to update user permissions for user ${data.userId}: ${error instanceof Error ? error.message : String(error)}`,
        'UPDATE_USER_PERMISSIONS_FAILED',
        error
      );
    }
  }
  
  /**
   * Gets default permissions for a role
   * 
   * @param role - User role
   * @returns API response
   * @throws PermissionClientError for any API or network failures
   */
  static async getDefaultPermissionsForRole(role: string): Promise<ApiResponse<string[]>> {
    try {
      return await PermissionClient.apiClient.get<string[]>(`${PERMISSIONS_API_URL}/role-defaults/${role}`);
    } catch (error) {
      // Enhance error with more details
      if (error instanceof ApiRequestError) {
        throw new PermissionClientError(
          `Failed to get default permissions for role '${role}': ${error.message}`,
          'GET_DEFAULT_PERMISSIONS_FAILED',
          error,
          error.statusCode
        );
      }
      
      throw new PermissionClientError(
        `Failed to get default permissions for role '${role}': ${error instanceof Error ? error.message : String(error)}`,
        'GET_DEFAULT_PERMISSIONS_FAILED',
        error
      );
    }
  }

  /**
   * Checks if a user has a specific permission
   * Enhanced implementation with better error handling and authentication
   * 
   * @param userId - User ID
   * @param permission - Permission to check
   * @returns API response indicating whether user has the permission
   * @throws PermissionClientError for any API or network failures
   */
  static async hasPermission(userId: number | string, permission: SystemPermission | string): Promise<ApiResponse<boolean>> {
    // Validate inputs
    if (!userId) {
      throw new PermissionClientError(
        'hasPermission called with invalid or missing userId',
        'INVALID_USER_ID',
        { userId }
      );
    }

    if (!permission) {
      throw new PermissionClientError(
        'hasPermission called with invalid or missing permission',
        'INVALID_PERMISSION',
        { permission }
      );
    }

    try {
      // Get auth token from localStorage to include explicitly
      let authToken = null;
      try {
        authToken = getItem('auth_token_backup') || getItem('auth_token');
      } catch (tokenError) {
        console.warn('Error getting token from localStorage:', tokenError);
      }
      
      // Create custom headers for better auth handling
      const customHeaders: Record<string, string> = {};
      if (authToken) {
        customHeaders['Authorization'] = `Bearer ${authToken}`;
        customHeaders['X-Auth-Token'] = authToken;
      }
      
      console.log(`Checking permission '${permission}' for user ${userId}`);
      
      // Use the dedicated check endpoint - no fallbacks
      const response = await PermissionClient.apiClient.get<boolean>(
        `/users/permissions/check?userId=${userId}&permission=${encodeURIComponent(permission as string)}`,
        {
          includeAuthToken: true, // Explicitly include auth token
          requestId: `permission-check-${userId}-${Date.now()}`, // Add request ID for tracking
          headers: customHeaders,
          skipCache: true // Don't use cache for permission checks
        }
      );
      
      // Check for authentication issues
      if (!response.success && response.statusCode === 401) {
        throw new PermissionClientError(
          `Authentication required to check permission '${permission}' for user ${userId}`,
          'AUTHENTICATION_REQUIRED',
          response,
          401
        );
      }
      
      return response;
    } catch (error) {
      // Log the full error to help with debugging
      console.error(`Error checking permission '${permission}' for user ${userId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        statusCode: error instanceof ApiRequestError ? error.statusCode : undefined
      });
      
      // Enhance error with more details
      if (error instanceof ApiRequestError) {
        throw new PermissionClientError(
          `Failed to check permission '${permission}' for user ${userId}: ${error.message}`,
          'PERMISSION_CHECK_FAILED',
          error,
          error.statusCode
        );
      }
      
      throw new PermissionClientError(
        `Failed to check permission '${permission}' for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
        'PERMISSION_CHECK_FAILED',
        error
      );
    }
  }
}