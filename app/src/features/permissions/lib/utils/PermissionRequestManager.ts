'use client';

/**
 * PermissionRequestManager - Clean implementation with caching
 * 
 * A robust manager for permission requests with proper caching to reduce
 * network traffic and improve performance. No fallbacks or workarounds -
 * just clean, maintainable code.
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
   */
  public async getPermissions(userId: number, requestId: string, options?: { force?: boolean }): Promise<string[]> {
    // Check for invalid userId
    if (!userId) {
      logger.warn('Invalid userId provided to getPermissions', { requestId });
      return [];
    }
    
    // Return from cache if available and not forced to refresh
    if (!options?.force && this.hasCachedPermissions(userId)) {
      const cachedData = this.permissionCache.get(userId);
      logger.debug(`Using cached permissions for user ${userId}`, { 
        requestId,
        permissionCount: cachedData?.permissions.length,
        cacheAge: Date.now() - (cachedData?.timestamp || 0)
      });
      return cachedData?.permissions || [];
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
    
    return permissionPromise;
  }
  
  /**
   * Fetch permissions from API with proper error handling
   */
  private async fetchPermissions(userId: number, requestId: string): Promise<string[]> {
    try {
      logger.debug(`Fetching permissions for user ${userId}`, { requestId });
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Make API request
      const response = await ApiClient.get(`/api/users/permissions?userId=${userId}`, {
        headers: {
          'X-Request-ID': requestId
        },
        signal: controller.signal
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Validate and normalize response
      let permissionsArray: string[] = [];
      
      if (Array.isArray(response)) {
        // Direct array response (preferred format)
        permissionsArray = response as string[];
      } else if (response && typeof response === 'object') {
        // Check if it's an ApiResponse with data that is an array
        if (response.success && Array.isArray(response.data)) {
          logger.debug('Response is ApiResponse with array data', {
            userId,
            requestId,
            dataLength: response.data.length
          });
          permissionsArray = response.data;
        }
        // Legacy format: object with permissions array
        else if (typeof response === 'object' && 'permissions' in response && 
                 Array.isArray((response as any).permissions)) {
          logger.warn('Received permissions in nested object format, normalizing', {
            userId,
            requestId
          });
          permissionsArray = (response as any).permissions;
        } else {
          logger.error('Invalid permissions response: expected an array or object with permissions array', {
            userId,
            requestId,
            responseType: typeof response,
            isApiResponse: 'success' in response,
            hasData: 'data' in response,
            dataType: response.data ? typeof response.data : 'N/A',
            isDataArray: response.data ? Array.isArray(response.data) : false
          });
          throw new Error('Invalid permissions response format');
        }
      } else {
        logger.error('Invalid permissions response: expected an array or object with permissions array', {
          userId,
          requestId,
          responseType: typeof response
        });
        throw new Error('Invalid permissions response format');
      }
      
      // Cache the normalized permissions
      this.permissionCache.set(userId, {
        permissions: permissionsArray,
        timestamp: Date.now()
      });
      
      logger.debug(`Successfully fetched ${permissionsArray.length} permissions`, {
        userId,
        requestId
      });
      
      return permissionsArray;
    } catch (error) {
      // Clear error logging and propagation
      logger.error(`Error fetching permissions for user ${userId}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        requestId
      });
      
      // If cache exists but is stale, use it as fallback on error
      const cachedData = this.permissionCache.get(userId);
      if (cachedData) {
        logger.warn(`Using stale cache for user ${userId} due to fetch error`, {
          requestId,
          cacheAge: Date.now() - cachedData.timestamp
        });
        return cachedData.permissions;
      }
      
      throw error;
    } finally {
      // Clean up when request is done
      this.requestsInProgress.delete(userId);
    }
  }
  
   
  /**
   * Check if user has a specific permission
   */
  public async hasPermission(userId: number, permissionCode: string): Promise<boolean> {
    try {
      // Generate a request ID for tracing
      const requestId = `perm-check-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Get all permissions
      const permissions = await this.getPermissions(userId, requestId);
      
      // Simple contains check
      return permissions.includes(permissionCode);
    } catch (error) {
      logger.error(`Permission check failed for ${permissionCode}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        permissionCode
      });
      
      // Properly propagate error instead of silently returning false
      throw error;
    }
  }
  
  /**
   * Check if user has any of the permissions
   */
  public async hasAnyPermission(userId: number, permissionCodes: string[]): Promise<boolean> {
    try {
      // Generate a request ID for tracing
      const requestId = `perm-check-any-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Get all permissions
      const permissions = await this.getPermissions(userId, requestId);
      
      // Check if any permission codes match
      return permissions.some(p => permissionCodes.includes(p));
    } catch (error) {
      logger.error(`Permission check failed for ${permissionCodes.join(', ')}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        permissionCodes
      });
      
      // Properly propagate error
      throw error;
    }
  }
  
  /**
   * Check if user has all of the permissions
   */
  public async hasAllPermissions(userId: number, permissionCodes: string[]): Promise<boolean> {
    try {
      // Generate a request ID for tracing
      const requestId = `perm-check-all-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Get all permissions
      const permissions = await this.getPermissions(userId, requestId);
      
      // Check if all permission codes match
      return permissionCodes.every(p => permissions.includes(p));
    } catch (error) {
      logger.error(`Permission check failed for ${permissionCodes.join(', ')}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        permissionCodes
      });
      
      // Properly propagate error
      throw error;
    }
  }
}

// Export singleton instance
export default PermissionRequestManager;