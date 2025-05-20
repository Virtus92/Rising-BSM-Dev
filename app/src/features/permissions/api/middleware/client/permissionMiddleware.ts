'use client';

/**
 * Client-side Permission Middleware
 * Handles permission checks for client components and API calls
 */

import { AuthService } from '@/features/auth/core';
import PermissionCache from '@/features/permissions/lib/utils/PermissionCache';
import { getPermissionFromCache, setPermissionInCache, invalidateUserPermissionCache, clearPermissionCache } from '@/features/permissions/lib/utils/permissionCacheUtils';
import { PermissionRequestManager } from '@/features/permissions/lib/utils/PermissionRequestManager';
import { PermissionClient } from '@/features/permissions/lib/clients';
import { getLogger } from '@/core/logging';

const logger = getLogger();

/**
 * Improved client-side permission middleware
 * Uses caching and batch requests for better performance
 */
export class ClientPermissionMiddleware {
  private static instance: ClientPermissionMiddleware;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ClientPermissionMiddleware {
    if (!this.instance) {
      this.instance = new ClientPermissionMiddleware();
    }
    return this.instance;
  }
  
  /**
   * Check if a user has a specific permission
   * Uses caching for better performance
   * 
   * @param userId - User ID
   * @param permissionCode - Permission code
   * @returns Whether the user has the permission
   */
  public async hasPermission(userId: number, permissionCode: string): Promise<boolean> {
    try {
      // Normalize permission code
      const normalizedPermission = permissionCode.toLowerCase().trim();
      
      // Check cache first
      const cachedResult = await getPermissionFromCache(userId, normalizedPermission);
      
      if (cachedResult !== undefined) {
        return cachedResult;
      }
      
      // Get the current user ID for context
      const currentUser = AuthService.getUser();
      if (!currentUser?.id) {
        logger.warn('No authenticated user for permission check', { permissionCode: normalizedPermission });
        return false;
      }
      
      try {
        // Check using individual API call with proper headers
        const result = await PermissionClient.checkUserPermission(userId, normalizedPermission);
        
        if (result.success) {
          // Cache the result
          await setPermissionInCache(userId, normalizedPermission, !!result.data);
          return !!result.data;
        }
        
        return false;
      } catch (error) {
        logger.error(`Error checking permission '${normalizedPermission}':`, error as Error);
        
        // Special case for 'requests.view' permission - grant it by default
        // This is critical for the system to function
        if (normalizedPermission === 'requests.view') {
          logger.warn('Granted critical permission requests.view despite API error');
          return true;
        }
        
        return false;
      }
    } catch (error) {
      logger.error('Error in ClientPermissionMiddleware.hasPermission', error as Error);
      return false;
    }
  }
  
  /**
   * Check if a user has any of the specified permissions
   * 
   * @param userId - User ID
   * @param permissionCodes - Array of permission codes
   * @returns Whether the user has any of the permissions
   */
  public async hasAnyPermission(userId: number, permissionCodes: string[]): Promise<boolean> {
    if (!permissionCodes.length) return true;
    
    try {
      // Try cached checks first for all permissions
      const cachedResults = await Promise.all(permissionCodes.map(async (code) => {
        const normalizedCode = code.toLowerCase().trim();
        return {
          code: normalizedCode,
          result: await getPermissionFromCache(userId, normalizedCode)
        };
      }));
      
      // If any cached result is true, return true immediately
      const cachedTrue = cachedResults.find(item => item.result === true);
      if (cachedTrue) {
        return true;
      }
      
      // Check if all permissions are cached as false
      const allCachedAsFalse = cachedResults.every(item => item.result === false);
      if (allCachedAsFalse) {
        return false;
      }
      
      // Get uncached permissions
      const uncachedPermissions = cachedResults
        .filter(item => item.result === undefined)
        .map(item => item.code);
      
      if (uncachedPermissions.length === 0) {
        return false; // All were cached as false
      }
      
      // Check all uncached permissions with a batch request
      try {
        const result = await PermissionClient.checkUserPermissions(userId, uncachedPermissions);
        
        if (result.success && result.data) {
          // Cache all results
          if (result.data.permissionResults) {
            await Promise.all(result.data.permissionResults.map(perm => 
              setPermissionInCache(userId, perm.permission, perm.hasPermission)
            ));
          }
          
          // If any permission is granted, return true
          return result.data.hasPermission;
        }
        
        // Cache all as false if the request succeeded but returned no permissions
        await Promise.all(uncachedPermissions.map(perm => 
          setPermissionInCache(userId, perm, false)
        ));
        
        return false;
      } catch (error) {
        logger.error('Error checking batch permissions:', error as Error);
        
        // Special handling for critical permissions
        // Check if any of the requested permissions are critical
        const hasCriticalPermission = uncachedPermissions.some(
          perm => perm === 'requests.view'
        );
        
        if (hasCriticalPermission) {
          logger.warn('Granted permissions due to critical permission check failure');
          return true;
        }
        
        return false;
      }
    } catch (error) {
      logger.error('Error in ClientPermissionMiddleware.hasAnyPermission', error as Error);
      return false;
    }
  }
  
  /**
   * Check if a user has all of the specified permissions
   * 
   * @param userId - User ID
   * @param permissionCodes - Array of permission codes
   * @returns Whether the user has all of the permissions
   */
  public async hasAllPermissions(userId: number, permissionCodes: string[]): Promise<boolean> {
    if (!permissionCodes.length) return true;
    
    try {
      // Try cached checks first for all permissions
      const cachedResults = await Promise.all(permissionCodes.map(async (code) => {
        const normalizedCode = code.toLowerCase().trim();
        return {
          code: normalizedCode,
          result: await getPermissionFromCache(userId, normalizedCode)
        };
      }));
      
      // If any cached result is false, return false immediately
      const cachedFalse = cachedResults.find(item => item.result === false);
      if (cachedFalse) {
        return false;
      }
      
      // Check if all permissions are cached as true
      const allCachedAsTrue = cachedResults.every(item => item.result === true);
      if (allCachedAsTrue) {
        return true;
      }
      
      // Get uncached permissions
      const uncachedPermissions = cachedResults
        .filter(item => item.result === undefined)
        .map(item => item.code);
      
      if (uncachedPermissions.length === 0) {
        return true; // All were cached as true
      }
      
      // Check all uncached permissions individually for more reliable results
      for (const permission of uncachedPermissions) {
        const hasPermission = await this.hasPermission(userId, permission);
        
        // If any permission check fails, return false immediately
        if (!hasPermission) {
          return false;
        }
      }
      
      // All permission checks passed
      return true;
    } catch (error) {
      logger.error('Error in ClientPermissionMiddleware.hasAllPermissions', error as Error);
      return false;
    }
  }
  
  /**
   * Clear permission cache for a user or all users
   * 
   * @param userId - Optional user ID to clear cache for specific user
   */
  public async clearCache(userId?: number): Promise<void> {
    if (userId) {
      await invalidateUserPermissionCache(userId);
    } else {
      await clearPermissionCache();
    }
  }
}

// Export singleton instance
export const permissionMiddleware = ClientPermissionMiddleware.getInstance();

// Export permission constants
export const API_PERMISSIONS = {
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_MANAGE: 'customers.manage',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_EDIT: 'customers.edit',
  CUSTOMERS_DELETE: 'customers.delete',
  
  REQUESTS_VIEW: 'requests.view',
  REQUESTS_MANAGE: 'requests.manage',
  REQUESTS_CREATE: 'requests.create',
  REQUESTS_EDIT: 'requests.edit',
  REQUESTS_DELETE: 'requests.delete',
  
  APPOINTMENTS_VIEW: 'appointments.view',
  APPOINTMENTS_MANAGE: 'appointments.manage',
  APPOINTMENTS_CREATE: 'appointments.create',
  APPOINTMENTS_EDIT: 'appointments.edit',
  APPOINTMENTS_DELETE: 'appointments.delete',
  
  PERMISSIONS_MANAGE: 'permissions.manage',
  
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',
};

// Default export
export default permissionMiddleware;