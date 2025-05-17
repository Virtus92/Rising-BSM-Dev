'use client';

/**
 * Permission Compatibility Layer
 * 
 * This file provides compatibility functions to bridge between the old permission cache
 * implementation and the new PermissionProvider. It allows existing code to continue
 * using the old interface, while actually using the new implementation under the hood.
 * 
 * This makes migration smoother and reduces the number of files that need to be changed.
 */

import { getLogger } from '@/core/logging';

// Forward imports (these will be dynamically loaded to avoid circular dependencies)
let permissionProvider: any = null;
let providerPromise: Promise<any> | null = null;

const logger = getLogger();

/**
 * Get the shared instance of PermissionProvider
 * (lazy-loaded to avoid circular dependencies)
 */
async function getPermissionProvider(): Promise<any> {
  if (typeof window === 'undefined') {
    return null; // Server-side: no provider
  }
  
  if (permissionProvider) {
    return permissionProvider;
  }
  
  if (providerPromise) {
    return providerPromise;
  }
  
  // Dynamically import to avoid circular dependencies
  providerPromise = import('@/features/permissions/providers/PermissionProvider')
    .then(module => {
      // Check for the existence of the global permission provider in the window
      if (typeof window !== 'undefined' && (window).__PERMISSION_PROVIDER_DEBUG) {
        permissionProvider = (window).__PERMISSION_PROVIDER_DEBUG;
        return permissionProvider;
      }
      
      // No global provider yet, create a compatibility instance
      logger.warn('No global PermissionProvider found, creating compatibility instance');
      
      // Define a minimal compatibility instance for the old interface
      const compatibilityProvider = {
        hasPermission: (permissionCode: string) => false,
        loadPermissions: async () => false,
        permissions: []
      };
      
      permissionProvider = compatibilityProvider;
      return permissionProvider;
    })
    .catch(error => {
      logger.error('Error loading PermissionProvider:', error as Error);
      return null;
    });
  
  return providerPromise;
}

/**
 * Get a permission from the cache (compatibility function)
 * 
 * @param userId - User ID
 * @param permission - Permission code
 * @returns Promise resolving to the cached permission value (undefined if not found)
 */
export async function getPermissionFromCache(userId: number, permission: string): Promise<boolean | undefined> {
  try {
    // Try to use the new provider
    const provider = await getPermissionProvider();
    
    if (provider) {
      // Normalize permission code
      const normalizedPermission = permission.toLowerCase().trim();
      
      // Check permission using the new provider
      const hasPermission = provider.hasPermission(normalizedPermission);
      
      // Convert to the old API's return format
      return hasPermission;
    }
  } catch (error) {
    logger.error('Error in compatibility getPermissionFromCache:', error as Error);
  }
  
  // Default to undefined (cache miss)
  return undefined;
}

/**
 * Set a permission in the cache (compatibility function)
 * 
 * @param userId - User ID
 * @param permission - Permission code
 * @param value - Permission value (true/false)
 * @param ttlSeconds - Optional TTL in seconds (ignored in new implementation)
 * @returns Promise resolving to whether the operation succeeded
 */
export async function setPermissionInCache(
  userId: number,
  permission: string,
  value: boolean,
  ttlSeconds: number = 300
): Promise<boolean> {
  // In the new implementation, we don't manually set permissions
  // Instead, we reload all permissions from the server
  try {
    const provider = await getPermissionProvider();
    
    if (provider && provider.loadPermissions) {
      // Reload permissions from the server
      await provider.loadPermissions();
      return true;
    }
  } catch (error) {
    logger.error('Error in compatibility setPermissionInCache:', error as Error);
  }
  
  return false;
}

/**
 * Invalidate cache for a user (compatibility function)
 * 
 * @param userId - User ID
 * @returns Promise resolving to whether the operation was successful
 */
export async function invalidateUserPermissionCache(userId: number): Promise<boolean> {
  try {
    const provider = await getPermissionProvider();
    
    if (provider && provider.loadPermissions) {
      // Reload permissions from the server
      await provider.loadPermissions();
      return true;
    }
  } catch (error) {
    logger.error('Error in compatibility invalidateUserPermissionCache:', error as Error);
  }
  
  return false;
}

/**
 * Clears the entire permission cache (compatibility function)
 * 
 * @returns Promise resolving to whether the operation was successful
 */
export async function clearPermissionCache(): Promise<boolean> {
  try {
    const provider = await getPermissionProvider();
    
    if (provider && provider.loadPermissions) {
      // Reload permissions from the server
      await provider.loadPermissions();
      return true;
    }
  } catch (error) {
    logger.error('Error in compatibility clearPermissionCache:', error as Error);
  }
  
  return false;
}

/**
 * Get permission cache statistics (compatibility function)
 * 
 * @returns Cache statistics
 */
export function getPermissionCacheStats(): any {
  // Return minimal stats for compatibility
  return {
    enabled: true,
    size: 0,
    maxSize: 0,
    hitRate: 0,
    missRate: 0,
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    clears: 0,
    uptime: 0,
    lockCount: 0,
    provider: 'PermissionProvider',
    mode: 'compatibility'
  };
}

/**
 * Check if permission caching is enabled (compatibility function)
 * 
 * @returns Whether permission caching is enabled
 */
export function isPermissionCachingEnabled(): boolean {
  return true; // Always enabled in new implementation
}

// Re-export functions for backwards compatibility
export const permissionCacheUtils = {
  getPermissionFromCache,
  setPermissionInCache,
  invalidateUserPermissionCache,
  clearPermissionCache,
  getPermissionCacheStats,
  isPermissionCachingEnabled
};

// Helper function to register the global provider (called from PermissionProvider)
export function registerGlobalPermissionProvider(provider: any): void {
  if (typeof window !== 'undefined') {
    (window).__PERMISSION_PROVIDER_DEBUG = provider;
    permissionProvider = provider;
  }
}

export default permissionCacheUtils;