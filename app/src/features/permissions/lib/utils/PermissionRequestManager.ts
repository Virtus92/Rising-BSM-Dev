'use client';

/**
 * PermissionRequestManager
 * 
 * A streamlined manager for permission requests with proper caching
 * to reduce network traffic and improve performance. Implements a clean
 * approach with consistent behavior and proper error handling.
 */

import { getLogger } from '@/core/logging';
import { ApiClient } from '@/core/api';

const logger = getLogger();

/**
 * Clean implementation of permission management
 */
export class PermissionRequestManager {
  private static instance: PermissionRequestManager;
  
  // Separate caches for role-based and user-specific permissions
  private rolePermissionCache: Map<string, { permissions: string[], timestamp: number }>;
  private userPermissionCache: Map<number, { permissions: string[], timestamp: number }>;
  
  // Track in-progress requests to prevent duplicates
  private roleRequestsInProgress: Map<string, Promise<string[]>>;
  private userRequestsInProgress: Map<number, Promise<string[]>>;
  
  // Cache TTLs
  private readonly roleCacheTTL: number = 600000; // 10 minutes for role permissions
  private readonly userCacheTTL: number = 300000; // 5 minutes for user-specific permissions
  
  private constructor() {
    this.rolePermissionCache = new Map();
    this.userPermissionCache = new Map();
    this.roleRequestsInProgress = new Map();
    this.userRequestsInProgress = new Map();
  }
  
  // Singleton access
  public static getInstance(): PermissionRequestManager {
    if (!this.instance) {
      this.instance = new PermissionRequestManager();
    }
    return this.instance;
  }
  
  /**
   * Check if the role permissions are cached
   */
  public hasRolePermissionsCached(role: string): boolean {
    if (!role) return false;
    
    const normalizedRole = role.toLowerCase();
    const cacheEntry = this.rolePermissionCache.get(normalizedRole);
    if (!cacheEntry) return false;
    
    // Check if cache is still valid
    const now = Date.now();
    return (now - cacheEntry.timestamp) < this.roleCacheTTL;
  }
  
  /**
   * Check if the user-specific permissions are cached
   */
  public hasUserPermissionsCached(userId: number): boolean {
    if (!userId) return false;
    
    const cacheEntry = this.userPermissionCache.get(userId);
    if (!cacheEntry) return false;
    
    // Check if cache is still valid
    const now = Date.now();
    return (now - cacheEntry.timestamp) < this.userCacheTTL;
  }
  
  /**
   * Clear all permission caches
   */
  public clearAllCaches(): void {
    this.rolePermissionCache.clear();
    this.userPermissionCache.clear();
    this.roleRequestsInProgress.clear();
    this.userRequestsInProgress.clear();
    logger.debug('All permission caches cleared');
  }
  
  /**
   * Clear the cache for a specific user
   */
  public clearUserCache(userId: number): void {
    if (userId) {
      this.userPermissionCache.delete(userId);
      logger.debug(`Cleared user permission cache for user ${userId}`);
    }
  }
  
  /**
   * Clear the cache for a specific role
   */
  public clearRoleCache(role: string): void {
    if (role) {
      const normalizedRole = role.toLowerCase();
      this.rolePermissionCache.delete(normalizedRole);
      logger.debug(`Cleared role permission cache for role ${normalizedRole}`);
    }
  }
  
  /**
   * Get role-based permissions with proper caching
   */
  public async getRolePermissions(role: string, requestId: string, options?: { force?: boolean }): Promise<string[]> {
    // Validate role
    if (!role) {
      logger.error('Invalid role provided to getRolePermissions', { requestId });
      throw new Error('Invalid role provided to getRolePermissions');
    }
    
    const normalizedRole = role.toLowerCase();
    
    // Return from cache if available and not forced to refresh
    if (!options?.force && this.hasRolePermissionsCached(normalizedRole)) {
      const cachedData = this.rolePermissionCache.get(normalizedRole);
      
      if (cachedData && Array.isArray(cachedData.permissions)) {
        logger.debug(`Using cached permissions for role ${normalizedRole}`, { 
          requestId,
          permissionCount: cachedData.permissions.length,
          cacheAge: Date.now() - (cachedData.timestamp || 0)
        });
        return cachedData.permissions;
      }
    }
    
    // Check if there's already a request in progress for this role
    const existingRequest = this.roleRequestsInProgress.get(normalizedRole);
    if (existingRequest && !options?.force) {
      logger.debug(`Request for role ${normalizedRole} permissions already in progress, reusing promise`, { requestId });
      return existingRequest;
    }
    
    // Create new request promise
    const permissionPromise = this.fetchRolePermissions(normalizedRole, requestId);
    
    // Store the promise to prevent duplicate requests
    this.roleRequestsInProgress.set(normalizedRole, permissionPromise);
    
    try {
      // Await the promise to handle errors properly
      const permissions = await permissionPromise;
      return permissions;
    } catch (error) {
      // Log error but don't swallow it
      logger.error(`Error getting permissions for role ${normalizedRole}`, {
        error: error instanceof Error ? error.message : String(error),
        requestId
      });
      
      // Remove from in-progress map on error
      this.roleRequestsInProgress.delete(normalizedRole);
      
      // Rethrow so calling code can handle
      throw error;
    }
  }
  
  /**
   * Get user-specific permissions with proper caching
   */
  public async getUserPermissions(userId: number, requestId: string, options?: { force?: boolean }): Promise<string[]> {
    // Validate userId
    if (!userId) {
      logger.error('Invalid userId provided to getUserPermissions', { requestId });
      throw new Error('Invalid user ID provided to getUserPermissions');
    }
    
    // Return from cache if available and not forced to refresh
    if (!options?.force && this.hasUserPermissionsCached(userId)) {
      const cachedData = this.userPermissionCache.get(userId);
      
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
    const existingRequest = this.userRequestsInProgress.get(userId);
    if (existingRequest && !options?.force) {
      logger.debug(`Request for user ${userId} permissions already in progress, reusing promise`, { requestId });
      return existingRequest;
    }
    
    // Create new request promise
    const permissionPromise = this.fetchUserPermissions(userId, requestId);
    
    // Store the promise to prevent duplicate requests
    this.userRequestsInProgress.set(userId, permissionPromise);
    
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
      this.userRequestsInProgress.delete(userId);
      
      // Rethrow so calling code can handle
      throw error;
    }
  }
  
  /**
   * Fetch role permissions from API
   */
  private async fetchRolePermissions(role: string, requestId: string): Promise<string[]> {
    try {
      logger.debug(`Fetching permissions for role ${role}`, { requestId });
      
      // Ensure ApiClient is initialized
      if (!ApiClient.isInitialized()) {
        logger.debug('ApiClient not initialized, initializing now', { requestId });
        await ApiClient.initialize();
      }
      
      // Make API request with auth headers
      const headers: Record<string, string> = {
        'X-Request-ID': requestId,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      };
      
      const response = await ApiClient.get(`/api/permissions/role-defaults/${role}`, {
        headers,
        withAuth: true,
        cache: 'no-store' as RequestCache
      });
      
      // Process response
      const permissions = this.normalizePermissionsResponse(response, role, requestId);
      
      // Cache the permissions
      if (permissions.length > 0) {
        this.rolePermissionCache.set(role.toLowerCase(), {
          permissions,
          timestamp: Date.now()
        });
      }
      
      return permissions;
    } catch (error) {
      // Detailed error logging
      logger.error(`Error fetching permissions for role ${role}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        role,
        requestId
      });
      
      // Propagate the error - no fallbacks
      throw error;
    } finally {
      // Clean up when request is done
      this.roleRequestsInProgress.delete(role.toLowerCase());
    }
  }
  
  /**
   * Fetch user permissions from API
   */
  private async fetchUserPermissions(userId: number, requestId: string): Promise<string[]> {
    try {
      logger.debug(`Fetching permissions for user ${userId}`, { requestId });
      
      // Ensure ApiClient is initialized
      if (!ApiClient.isInitialized()) {
        logger.debug('ApiClient not initialized, initializing now', { requestId });
        await ApiClient.initialize();
      }
      
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
      
      // Process response
      const permissions = this.normalizePermissionsResponse(response, userId, requestId);
      
      // Cache the permissions
      this.userPermissionCache.set(userId, {
        permissions,
        timestamp: Date.now()
      });
      
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
      this.userRequestsInProgress.delete(userId);
    }
  }
  
  /**
   * Normalize permissions response to standard string array format
   * Consistent processing with proper error handling
   */
  private normalizePermissionsResponse(response: any, idOrRole: number | string, requestId: string): string[] {
    // Log the raw response for debugging
    logger.debug(`Normalizing permissions response:`, {
      requestId,
      responseType: typeof response,
      isArray: Array.isArray(response),
      hasSuccess: response && typeof response === 'object' && 'success' in response,
      hasData: response && typeof response === 'object' && 'data' in response
    });
    
    try {
      // Check for error response
      if (response && typeof response === 'object' && 'success' in response && response.success === false) {
        logger.error('API returned error response for permissions', {
          idOrRole,
          requestId,
          error: response.error || response.message,
          statusCode: response.statusCode
        });
        throw new Error(`API error: ${response.error || response.message || 'Unknown error'}`);
      }
      
      // Handle different response formats in order of preference
      
      // Case 1: Standard API response format with success and data
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        const data = response.data;
        
        // Case 1.1: data is array of strings
        if (Array.isArray(data)) {
          logger.debug('Response data is an array', { dataLength: data.length });
          return this.sanitizePermissions(data, requestId);
        }
        
        // Case 1.2: data contains permissions array
        if (data && typeof data === 'object' && 'permissions' in data && Array.isArray(data.permissions)) {
          logger.debug('Response data has permissions array', {
            permissionsLength: data.permissions.length,
            role: data.role || 'unknown'
          });
          return this.sanitizePermissions(data.permissions, requestId);
        }
      }
      
      // Case 2: Direct array response
      if (Array.isArray(response)) {
        logger.debug('Response is a direct array', { responseLength: response.length });
        return this.sanitizePermissions(response, requestId);
      }
      
      // Case 3: Object with direct permissions property
      if (response && typeof response === 'object' && 'permissions' in response && Array.isArray(response.permissions)) {
        logger.debug('Response has direct permissions property', {
          permissionsLength: response.permissions.length
        });
        return this.sanitizePermissions(response.permissions, requestId);
      }
      
      // We couldn't find permissions in a standard format
      logger.error('Unable to extract permissions from response in standard format', {
        idOrRole,
        requestId,
        responseType: typeof response,
        responseKeys: response && typeof response === 'object' ? Object.keys(response) : 'N/A'
      });
      
      // Return empty array instead of throwing
      logger.warn('Returning empty permissions array due to unrecognized response format', { 
        idOrRole, 
        requestId 
      });
      return [];
    } catch (error) {
      // Log error and propagate
      logger.error('Error normalizing permissions response:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        idOrRole,
        requestId
      });
      
      throw error;
    }
  }
  
  /**
   * Sanitize and validate permissions
   * Ensures we only work with valid string permissions
   */
  private sanitizePermissions(permissionsArray: any[], requestId: string): string[] {
    // Validate and sanitize permissions
    const validPermissions = permissionsArray
      .filter(Boolean) // Remove any null/undefined values
      .filter(p => typeof p === 'string' || (typeof p === 'object' && p !== null && 'code' in p)) // Ensure all are strings or have code property
      .map(p => typeof p === 'string' ? p.trim().toLowerCase() : p.code.trim().toLowerCase()) // Extract codes and normalize
      .filter(p => p.length > 0); // Remove empty strings
    
    if (validPermissions.length === 0 && permissionsArray.length > 0) {
      // We had input but nothing valid came out
      logger.warn('No valid string permissions found in array', {
        requestId,
        inputLength: permissionsArray.length,
        inputTypes: permissionsArray.map(p => typeof p).join(', ')
      });
    } else {
      logger.debug(`Successfully extracted ${validPermissions.length} permissions`, {
        requestId
      });
    }
    
    return validPermissions;
  }
  
  /**
   * Get all permissions for a user by combining role and user-specific permissions
   */
  public async getAllPermissions(userId: number, role: string): Promise<string[]> {
    if (!userId || !role) {
      throw new Error('User ID and role are required');
    }
    
    // Generate request IDs
    const roleRequestId = `role-perms-${role}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const userRequestId = `user-perms-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    try {
      // Fetch both sets of permissions in parallel
      const [rolePermissions, userPermissions] = await Promise.all([
        this.getRolePermissions(role, roleRequestId),
        this.getUserPermissions(userId, userRequestId)
      ]);
      
      // Combine and deduplicate
      const combinedPermissions = new Set([...rolePermissions, ...userPermissions]);
      
      // Convert back to array
      return Array.from(combinedPermissions);
    } catch (error) {
      logger.error('Error getting combined permissions', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        role
      });
      throw error;
    }
  }
}

// Export singleton instance
export default PermissionRequestManager;