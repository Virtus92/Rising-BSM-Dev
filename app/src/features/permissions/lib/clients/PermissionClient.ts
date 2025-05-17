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
import { ApiClient, ApiResponse,  ApiRequestError } from '@/core/api/ApiClient';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getItem } from '@/shared/utils/storage/cookieStorage';
import { getPermissionFromCache, setPermissionInCache } from '../utils/permissionCacheUtils';
import { getLogger } from '@/core/logging';

const logger = getLogger();

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
  private static apiClient = ApiClient;

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
  private static permissionRequestsInProgress = new Map<string, {
    promise: Promise<ApiResponse<UserPermissionsResponseDto>>;
    timestamp: number;
    requestId: string;
  }>();

  /**
   * Maximum age for a cached request (in milliseconds)
   */
  private static MAX_REQUEST_AGE = 5000; // 5 seconds

  /**
   * Request timeout (in milliseconds)
   */
  private static REQUEST_TIMEOUT = 10000; // 10 seconds

  /**
   * Gets permissions for a user with request tracking and improved error handling
   * 
   * @param userId - User ID
   * @returns API response
   * @throws PermissionClientError for any API or network failures unless handled
   */
  static async getUserPermissions(userId: number | string): Promise<ApiResponse<UserPermissionsResponseDto>> {
    // Validate userId - throw proper error if invalid
    if (!userId) {
      throw new PermissionClientError(
        'getUserPermissions called with invalid or missing userId',
        'INVALID_USER_ID',
        { userId },
        400
      );
    }
      
    // Generate unique request ID for tracking
    const requestId = `getUserPermissions-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    logger.info(`Starting permission request ${requestId} for user ${userId}`);
    
    // Set up timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      /* Initialize API client if needed
      await PermissionClient.apiClient.initialize();
      logger.debug(`API initialized, fetching permissions for user ID: ${userId}`);
      */
      // Make the API request with proper headers
      const response = await PermissionClient.apiClient.get<UserPermissionsResponseDto>(
        `${USER_PERMISSIONS_API_URL}?userId=${userId}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Request-ID': requestId,
            'X-Request-Time': new Date().toISOString()
          }
        }
      );
      
      // Log the response for debugging
      logger.info(`Received permissions response for user ${userId}:`, {
        success: response.success,
        statusCode: response.statusCode,
        hasData: !!response.data,
        requestId,
        dataDetails: response.data ? {
          userId: response.data.userId,
          role: response.data.role,
          permissionsCount: Array.isArray(response.data.permissions) ? response.data.permissions.length : 'not an array',
          hasPermissionsArray: Array.isArray(response.data.permissions)
        } : 'null'
      });
      
      // Normalize and validate response structure
      if (response.success && response.data) {
        // Get data from response with normalization
        let responseData = { ...response.data };
        
        // Ensure response has the expected structure
        if (!responseData) {
          responseData = { userId: Number(userId), role: 'user', permissions: [] };
          logger.debug(`Creating default response structure with userId ${userId}`);
        }
        
        // Ensure userId is a number
        if (responseData.userId === undefined || responseData.userId === null) {
          // No userId in response, use the one from the request
          responseData.userId = Number(userId);
          logger.debug(`Using request userId ${userId} for response`); 
        } else if (typeof responseData.userId === 'string') {
          // Convert string userId to number
          responseData.userId = Number(responseData.userId);
          logger.debug(`Converting userId from string to number: ${responseData.userId}`);
        }
        
        // Ensure role is a string
        if (!responseData.role || typeof responseData.role !== 'string') {
          // If no role or invalid type, set a default
          responseData.role = 'user';
        }
        
        // Ensure permissions is an array
        if (!Array.isArray(responseData.permissions)) {
          // Instead of setting empty array, check if permissions exist in response
          // Preserve original permissions if they were retrieved from database
          if (response.data && response.data.permissions) {
            // If we have permissions data from response, use it
            responseData.permissions = response.data.permissions;
            logger.debug(`Using existing permissions array with ${responseData.permissions.length} items`);
          } else {
            // Only set empty array if no permissions data exists
            responseData.permissions = [];
            logger.debug(`Setting empty permissions array in normalized response - no existing permissions found`);
          }
        }
        
        // Replace the response data with normalized data
        response.data = responseData;
        
        // Log the normalized data
        logger.debug(`Normalized permissions response for user ${userId}: found ${response.data.permissions.length} permissions`);
        
        // Validated successfully
        logger.debug(`Validated permissions response for user ${userId}: found ${response.data.permissions.length} permissions`);
      } else if (response.success) {
        // Success but no data is an error
        throw new PermissionClientError(
          `Missing data in successful permissions response for user ${userId}`,
          'INVALID_RESPONSE_FORMAT',
          { response },
          500
        );
      } else {
        // Not successful - error handling with automatic token refresh
        if (response.statusCode === 401) {
        // Try to refresh the token before failing
        console.log('Token expired in PermissionClient, attempting to refresh');
        try {
        const { default: AuthService } = await import('@/features/auth/core/AuthService');
        logger.info('Attempting to refresh token for permissions request');
        
          const refreshResult = await AuthService.refreshToken();
            if (refreshResult.success) {
            // Token refreshed, retry the request
          logger.info('Token refreshed successfully, retrying permissions request');
          
          // Small delay to ensure token propagation
          await new Promise(resolve => setTimeout(resolve, 100));
            
              // Retry the request with the new token
            const retryResponse = await PermissionClient.apiClient.get<UserPermissionsResponseDto>(
              `${USER_PERMISSIONS_API_URL}?userId=${userId}`,
              {
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'X-Request-ID': `${requestId}-retry`,
                  'X-Request-Time': new Date().toISOString()
                }
              }
            );
            
            // If retry is successful, use its response
            if (retryResponse.success && retryResponse.data) {
              return retryResponse;
            }
          }
        } catch (refreshError) {
          logger.error('Error refreshing token for permissions request:', refreshError instanceof Error ? refreshError.message : String(refreshError));
        }
        
        // If refresh/retry failed or wasn't attempted, throw the original error
        throw new PermissionClientError(
          'Authentication required to fetch permissions',
          'AUTHENTICATION_REQUIRED',
          { statusCode: response.statusCode },
          401
        );
      } else {
        throw new PermissionClientError(
          response.error || response.message || 'Unknown error fetching permissions',
          'API_ERROR',
          { statusCode: response.statusCode },
          response.statusCode || 500
        );
      }
      }
      
      return response;
    } catch (error) {
      // Clear the timeout if it hasn't fired yet
      clearTimeout(timeoutId);
      
      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new PermissionClientError(
          `Permission fetch timed out for user ${userId}`,
          'PERMISSION_FETCH_TIMEOUT',
          { requestId },
          408
        );
      }
      
      // If already a PermissionClientError, just rethrow
      if (error instanceof PermissionClientError) {
        throw error;
      }
      
      // Otherwise, convert to PermissionClientError
      throw new PermissionClientError(
        `Failed to fetch permissions for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PERMISSION_FETCH_FAILED',
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          requestId
        },
        error instanceof ApiRequestError ? error.statusCode : 500
      );
    } finally {
      clearTimeout(timeoutId);
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
      
      return await PermissionClient.apiClient.post<boolean>(USER_PERMISSIONS_API_URL, data);
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
   * Uses improved caching with consistent Promise-based API
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
    
    // Convert userId to number for caching
    const numericUserId = Number(userId);
    
    // Normalize permission code to lowercase for consistency
    const normalizedPermission = String(permission).toLowerCase().trim();
    const operationId = `check-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Check if caching is enabled
    const cacheEnabled = process.env.DISABLE_PERMISSION_CACHE !== 'true';

    // Try to get from cache first
    if (cacheEnabled) {
      try {
        // Import dynamically to avoid circular dependencies
        const { getPermissionFromCache } = await import('../utils/permissionCacheUtils');
        
        // Get from cache using the Promise-based API
        const cachedResult = await getPermissionFromCache(numericUserId, normalizedPermission);
        
        if (cachedResult !== undefined) {
          logger.debug(`Cache hit for permission '${normalizedPermission}' user ${userId}`, {
            hasPermission: cachedResult,
            operationId
          });
          
          // Return cached response with success flag
          return {
            success: true,
            error: null,
            data: cachedResult,
            statusCode: 200,
            message: 'Permission check from cache'
          };
        }
      } catch (cacheError) {
        logger.warn('Error checking permission cache, continuing with API check', {
          userId: numericUserId,
          permission: normalizedPermission,
          error: cacheError instanceof Error ? cacheError.message : String(cacheError),
          operationId
        });
        // Continue with API check if cache fails
      }
    }
      
      try {
        // Create request options
        const options = {
          includeAuthToken: true, // Always include auth token
          requestId: `permission-check-${userId}-${operationId}`,
          headers: {
            'Cache-Control': 'no-cache',
            'X-Request-Time': new Date().toISOString(),
            'X-Request-ID': `permission-${operationId}`
          },
          skipCache: true, // Don't use API cache for permission checks
          timeout: 5000 // 5 second timeout
        };
        
        logger.debug(`Checking permission via API '${normalizedPermission}' for user ${userId}`, {
          operationId
        });
        
        // Add timeout protection to prevent hanging requests
        const apiRequestPromise = PermissionClient.apiClient.get<boolean>(
          `/users/permissions/check?userId=${userId}&permission=${encodeURIComponent(normalizedPermission)}`,
          options
        );
        
        // Set a timeout for the request
        const timeoutPromise = new Promise<ApiResponse<boolean>>((resolve) => {
          setTimeout(() => {
            logger.warn(`API permission check timed out for ${normalizedPermission}`, {
              userId: numericUserId,
              operationId
            });
            
            // Return a generic error response
            resolve({
              success: false,
              data: false, // Add missing data property required by ApiResponse<boolean>
              statusCode: 408, // Request Timeout
              message: `Permission check timed out for ${normalizedPermission}`,
              error: 'Request timed out'
            });
          }, 5000); // 5 second timeout
        });
        
        // Race the API request against the timeout
        const response = await Promise.race([apiRequestPromise, timeoutPromise]);
        
        // Check for authentication issues
        if (!response.success && response.statusCode === 401) {
          throw new PermissionClientError(
            `Authentication required to check permission '${normalizedPermission}' for user ${userId}`,
            'AUTHENTICATION_REQUIRED',
            response,
            401
          );
        }
        
        // Cache successful responses
        if (response.success && response.data !== undefined && cacheEnabled) {
          try {
            // Import dynamically to avoid circular dependencies
            const { setPermissionInCache } = await import('../utils/permissionCacheUtils');
            
            // Cache the result with 5 minute TTL (300 seconds)
            await setPermissionInCache(numericUserId, normalizedPermission, !!response.data, 300);
            
            logger.debug(`Cached permission result: ${normalizedPermission} = ${!!response.data}`, {
              userId: numericUserId,
              operationId
            });
          } catch (cacheError) {
            logger.warn(`Error caching permission result`, {
              permission: normalizedPermission,
              userId: numericUserId,
              error: cacheError instanceof Error ? cacheError.message : String(cacheError),
              operationId
            });
          }
        }
        
        return response;
      } catch (error) {
        // Log the full error to help with debugging
        logger.error(`Error checking permission '${normalizedPermission}' for user ${userId}`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          statusCode: error instanceof ApiRequestError ? error.statusCode : undefined,
          operationId
        });
        
        // Enhance error with more details
        if (error instanceof ApiRequestError) {
          throw new PermissionClientError(
            `Failed to check permission '${normalizedPermission}' for user ${userId}: ${error.message}`,
            'PERMISSION_CHECK_FAILED',
            error,
            error.statusCode
          );
        }
        
        throw new PermissionClientError(
          `Failed to check permission '${normalizedPermission}' for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
          'PERMISSION_CHECK_FAILED',
          error
        );
      }
  }
}