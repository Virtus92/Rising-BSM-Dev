'use client';

/**
 * PermissionRequestManager
 * 
 * A robust manager for permission requests with proper caching to reduce
 * network traffic and improve performance. No fallbacks or workarounds -
 * focuses on consistent behavior and proper error propagation.
 */

import { getLogger } from '@/core/logging';
import { ApiClient } from '@/core/api';

const logger = getLogger();

/**
 * Clean implementation of permission management
 */
export class PermissionRequestManager {
  private static instance: PermissionRequestManager;
  private permissionCache: Map<number, { permissions: string[], timestamp: number }>;
  private requestsInProgress: Map<number, Promise<string[]>>;
  private readonly cacheTTL: number = 300000; // 5 minutes
  
  private constructor() {
    this.permissionCache = new Map();
    this.requestsInProgress = new Map();
  }
  
  // Singleton access
  public static getInstance(): PermissionRequestManager {
    if (!this.instance) {
      this.instance = new PermissionRequestManager();
    }
    return this.instance;
  }
  
  /**
   * Check if the permissions for a user are cached
   */
  public hasCachedPermissions(userId: number): boolean {
    if (!userId) return false;
    
    const cacheEntry = this.permissionCache.get(userId);
    if (!cacheEntry) return false;
    
    // Check if cache is still valid
    const now = Date.now();
    return (now - cacheEntry.timestamp) < this.cacheTTL;
  }
  
  /**
   * Clear the cache for a specific user
   */
  public clearCache(userId: number): void {
    if (userId) {
      this.permissionCache.delete(userId);
      logger.debug(`Cleared permission cache for user ${userId}`);
    }
  }
  
  /**
   * Get permissions for a user with proper caching
   * No fallbacks - errors are propagated
   */
  public async getPermissions(userId: number, requestId: string, options?: { force?: boolean }): Promise<string[]> {
    // Validate userId
    if (!userId) {
      logger.error('Invalid userId provided to getPermissions', { requestId });
      throw new Error('Invalid user ID provided to getPermissions');
    }
    
    // Return from cache if available and not forced to refresh
    if (!options?.force && this.hasCachedPermissions(userId)) {
      const cachedData = this.permissionCache.get(userId);
      
      if (cachedData && Array.isArray(cachedData.permissions)) {
        logger.debug(`Using cached permissions for user ${userId}`, { 
          requestId,
          permissionCount: cachedData.permissions.length,
          cacheAge: Date.now() - (cachedData.timestamp || 0)
        });
        return cachedData.permissions;
      }
    }
    
    // Check if there's already a request in progress for this user
    const existingRequest = this.requestsInProgress.get(userId);
    if (existingRequest && !options?.force) {
      logger.debug(`Request for user ${userId} permissions already in progress, reusing promise`, { requestId });
      return existingRequest;
    }
    
    // Create new request promise
    const permissionPromise = this.fetchPermissions(userId, requestId);
    
    // Store the promise to prevent duplicate requests
    this.requestsInProgress.set(userId, permissionPromise);
    
    try {
      // Await the promise to handle errors properly
      const permissions = await permissionPromise;
      return permissions;
    } catch (error) {
      // Log error but don't swallow it
      logger.error(`Error getting permissions for user ${userId}`, {
        error: error instanceof Error ? error.message : String(error),
        requestId
      });
      
      // Remove from in-progress map on error
      this.requestsInProgress.delete(userId);
      
      // Rethrow so calling code can handle
      throw error;
    }
  }
  
  /**
   * Fetch permissions from API with robust error handling and response normalization
   * No fallbacks or workarounds - errors are propagated properly
   */
  private async fetchPermissions(userId: number, requestId: string): Promise<string[]> {
    try {
      logger.debug(`Fetching permissions for user ${userId}`, { requestId });
      
      // Ensure ApiClient is initialized
      if (!ApiClient.isInitialized()) {
        logger.debug('ApiClient not initialized, initializing now', { requestId });
        await ApiClient.initialize();
      }
      
      // Use the token manager to ensure we have a valid token
      const { default: TokenManager } = await import('@/core/initialization/TokenManager');
      
      // Make API request with auth headers
      const headers: Record<string, string> = {
        'X-Request-ID': requestId,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'X-Auth-User-ID': userId.toString()
      };
      
      const response = await ApiClient.get(`/api/users/permissions?userId=${userId}`, {
        headers,
        withAuth: true,
        cache: 'no-store' as RequestCache
      });
      
      // Check for auth errors
      if (response && typeof response === 'object' && response.statusCode !== undefined) {
        if (response.statusCode === 401 || response.statusCode === 403) {
          logger.warn(`Authentication error when fetching permissions: ${response.statusCode}`, {
            userId,
            requestId,
            statusCode: response.statusCode,
            error: response.error || response.message
          });
          
          // Try to refresh token and retry exactly once
          const refreshed = await TokenManager.refreshToken({ force: true });
          
          if (refreshed) {
            // Retry with fresh token
            logger.debug('Token refreshed, retrying permission request', { requestId });
            
            const retryResponse = await ApiClient.get(`/api/users/permissions?userId=${userId}`, {
              headers: {
                'X-Request-ID': `${requestId}-retry`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'X-Auth-User-ID': userId.toString()
              },
              withAuth: true
            });
            
            // If retry fails with auth error, throw proper error
            if (retryResponse.statusCode === 401 || retryResponse.statusCode === 403) {
              logger.error('Authentication failed after token refresh', {
                userId,
                requestId: `${requestId}-retry`,
                statusCode: retryResponse.statusCode
              });
              throw new Error('Authentication required to fetch permissions');
            }
            
            // Process retry response
            const permissions = this.normalizePermissionsResponse(retryResponse, userId, `${requestId}-retry`);
            
            // Cache the permissions
            if (permissions.length > 0) {
              this.permissionCache.set(userId, {
                permissions,
                timestamp: Date.now()
              });
            }
            
            return permissions;
          } else {
            // Token refresh failed
            logger.error('Token refresh failed when fetching permissions', { userId, requestId });
            throw new Error('Authentication required to fetch permissions');
          }
        } else if (response.statusCode >= 400) {
          // Other error status codes
          logger.error(`API error when fetching permissions: ${response.statusCode}`, {
            userId,
            requestId,
            statusCode: response.statusCode,
            error: response.error || response.message
          });
          throw new Error(`Failed to fetch permissions: ${response.error || response.message || 'Unknown error'}`);
        }
      }
      
      // Process response normally
      const permissions = this.normalizePermissionsResponse(response, userId, requestId);
      
      // Cache the permissions
      if (permissions.length > 0) {
        this.permissionCache.set(userId, {
          permissions,
          timestamp: Date.now()
        });
      }
      
      return permissions;
    } catch (error) {
      // Detailed error logging
      logger.error(`Error fetching permissions for user ${userId}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        requestId
      });
      
      // Propagate the error - no fallbacks
      throw error;
    } finally {
      // Clean up when request is done
      this.requestsInProgress.delete(userId);
    }
  }
  
  /**
   * Normalize permissions response to standard string array format
   * Consistent processing with proper error handling
   */
  private normalizePermissionsResponse(response: any, userId: number, requestId: string): string[] {
    // Log the raw response for debugging
    logger.debug(`Normalizing permissions response for user ${userId}:`, {
      requestId,
      responseType: typeof response,
      isArray: Array.isArray(response),
      hasSuccess: response && typeof response === 'object' && 'success' in response,
      hasData: response && typeof response === 'object' && 'data' in response
    });
    
    try {
      // Handle different response formats in order of preference
      
      // Case 1: Standard API response format with success and data
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        // Check for error response
        if (response.success === false) {
          logger.error('API returned error response for permissions', {
            userId,
            requestId,
            error: response.error || response.message,
            statusCode: response.statusCode
          });
          throw new Error(`API error: ${response.error || response.message || 'Unknown error'}`);
        }
        
        const data = response.data;
        
        // Case 1.1: data is array of strings
        if (Array.isArray(data)) {
          logger.debug('Response data is an array', { dataLength: data.length });
          return this.sanitizePermissions(data, userId, requestId);
        }
        
        // Case 1.2: data contains permissions array
        if (data && typeof data === 'object' && 'permissions' in data && Array.isArray(data.permissions)) {
          logger.debug('Response data has permissions array', {
            permissionsLength: data.permissions.length,
            role: data.role || 'unknown'
          });
          return this.sanitizePermissions(data.permissions, userId, requestId);
        }
      }
      
      // Case 2: Direct array response
      if (Array.isArray(response)) {
        logger.debug('Response is a direct array', { responseLength: response.length });
        return this.sanitizePermissions(response, userId, requestId);
      }
      
      // Case 3: Object with direct permissions property
      if (response && typeof response === 'object' && 'permissions' in response && Array.isArray(response.permissions)) {
        logger.debug('Response has direct permissions property', {
          permissionsLength: response.permissions.length
        });
        return this.sanitizePermissions(response.permissions, userId, requestId);
      }
      
      // We couldn't find permissions in a standard format
      // Log the error with detailed information
      logger.error('Unable to extract permissions from response in standard format', {
        userId,
        requestId,
        responseType: typeof response,
        responseKeys: response && typeof response === 'object' ? Object.keys(response) : 'N/A',
        dataType: response && typeof response === 'object' && response.data ? typeof response.data : 'N/A',
        dataKeys: response && typeof response === 'object' && response.data && typeof response.data === 'object' ? 
          Object.keys(response.data) : 'N/A'
      });
      
      // Throw an error to propagate the problem
      throw new Error('Invalid permission response format - could not extract permissions');
    } catch (error) {
      // Log error and propagate
      logger.error('Error normalizing permissions response:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        requestId
      });
      
      throw error;
    }
  }
  
  /**
   * Sanitize and validate permissions
   * Ensures we only work with valid string permissions
   */
  private sanitizePermissions(permissionsArray: any[], userId: number, requestId: string): string[] {
    // Validate and sanitize permissions
    const validPermissions = permissionsArray
      .filter(Boolean) // Remove any null/undefined values
      .filter(p => typeof p === 'string') // Ensure all are strings
      .map(p => p.trim().toLowerCase()) // Trim whitespace and lowercase for consistency
      .filter(p => p.length > 0); // Remove empty strings
    
    if (validPermissions.length === 0 && permissionsArray.length > 0) {
      // We had input but nothing valid came out
      logger.warn('No valid string permissions found in array', {
        userId,
        requestId,
        inputLength: permissionsArray.length,
        inputTypes: permissionsArray.map(p => typeof p).join(', ')
      });
    } else {
      logger.debug(`Successfully extracted ${validPermissions.length} permissions`, {
        userId,
        requestId
      });
    }
    
    return validPermissions;
  }
  
  /**
   * Check if user has a specific permission with proper error handling
   */
  public async hasPermission(userId: number, permissionCode: string): Promise<boolean> {
    try {
      // Input validation
      if (!userId) {
        throw new Error('Invalid user ID provided to hasPermission');
      }
      
      if (!permissionCode) {
        throw new Error('Invalid permission code provided to hasPermission');
      }
      
      // Normalize permission code
      const normalizedPermission = permissionCode.trim().toLowerCase();
      
      // Generate a request ID for tracing
      const requestId = `perm-check-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Get all permissions
      const permissions = await this.getPermissions(userId, requestId);
      
      // Check if the permission exists
      return permissions.includes(normalizedPermission);
    } catch (error) {
      logger.error(`Permission check failed for ${permissionCode}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        permissionCode
      });
      
      // Propagate the error
      throw error;
    }
  }
  
  /**
   * Check if user has any of the permissions
   */
  public async hasAnyPermission(userId: number, permissionCodes: string[]): Promise<boolean> {
    try {
      // Input validation
      if (!userId) {
        throw new Error('Invalid user ID provided to hasAnyPermission');
      }
      
      if (!permissionCodes || !Array.isArray(permissionCodes) || permissionCodes.length === 0) {
        throw new Error('Invalid permission codes provided to hasAnyPermission');
      }
      
      // Normalize permission codes
      const normalizedPermissions = permissionCodes.map(code => code.trim().toLowerCase());
      
      // Generate a request ID for tracing
      const requestId = `perm-check-any-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Get all permissions
      const permissions = await this.getPermissions(userId, requestId);
      
      // Check if any permission codes match
      return normalizedPermissions.some(code => permissions.includes(code));
    } catch (error) {
      logger.error(`hasAnyPermission check failed`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        permissionCodes
      });
      
      // Propagate the error
      throw error;
    }
  }
  
  /**
   * Check if user has all of the permissions
   */
  public async hasAllPermissions(userId: number, permissionCodes: string[]): Promise<boolean> {
    try {
      // Input validation
      if (!userId) {
        throw new Error('Invalid user ID provided to hasAllPermissions');
      }
      
      if (!permissionCodes || !Array.isArray(permissionCodes) || permissionCodes.length === 0) {
        throw new Error('Invalid permission codes provided to hasAllPermissions');
      }
      
      // Normalize permission codes
      const normalizedPermissions = permissionCodes.map(code => code.trim().toLowerCase());
      
      // Generate a request ID for tracing
      const requestId = `perm-check-all-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Get all permissions
      const permissions = await this.getPermissions(userId, requestId);
      
      // Check if all permission codes match
      return normalizedPermissions.every(code => permissions.includes(code));
    } catch (error) {
      logger.error(`hasAllPermissions check failed`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        permissionCodes
      });
      
      // Propagate the error
      throw error;
    }
  }
}

// Export singleton instance
export default PermissionRequestManager;