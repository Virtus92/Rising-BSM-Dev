/**
 * PermissionCache - Compatibility file
 * 
 * This file maintains the same interface as the original PermissionCache
 * but delegates to the new PermissionProvider system.
 * 
 * It serves as a compatibility layer to make migration easier.
 */

import { getLogger } from '@/core/logging';
import {
  getPermissionFromCache,
  setPermissionInCache,
  invalidateUserPermissionCache,
  clearPermissionCache,
  getPermissionCacheStats,
  isPermissionCachingEnabled
} from './permissionCompatibility';

const logger = getLogger();

logger.info('Using new PermissionProvider through compatibility layer');

/**
 * Dummy PermissionCache implementation that delegates to the new system
 */
export class PermissionCache {
  /**
   * Create a new permission cache
   */
  constructor(maxSize: number = 1000, defaultTtlSeconds: number = 300) {
    logger.info('PermissionCache created (compatibility mode)');
  }
  
  /**
   * Dispose the cache
   */
  dispose(): void {
    // No-op in compatibility mode
  }
  
  /**
   * Get a value from the cache
   */
  async get(key: string): Promise<boolean | undefined> {
    // Extract userId and permission from key
    const parts = key.split(':');
    if (parts.length !== 2) {
      return undefined;
    }
    
    const userId = parseInt(parts[0], 10);
    const permission = parts[1];
    
    if (isNaN(userId)) {
      return undefined;
    }
    
    return getPermissionFromCache(userId, permission);
  }
  
  /**
   * Set a value in the cache
   */
  async set(key: string, value: boolean, ttlSeconds?: number): Promise<boolean> {
    // Extract userId and permission from key
    const parts = key.split(':');
    if (parts.length !== 2) {
      return false;
    }
    
    const userId = parseInt(parts[0], 10);
    const permission = parts[1];
    
    if (isNaN(userId)) {
      return false;
    }
    
    return setPermissionInCache(userId, permission, value, ttlSeconds);
  }
  
  /**
   * Delete an entry from the cache
   */
  async delete(key: string): Promise<boolean> {
    // In compatibility mode, we can't delete individual entries
    return false;
  }
  
  /**
   * Clear all entries from the cache
   */
  async clear(): Promise<void> {
    await clearPermissionCache();
  }
  
  /**
   * Clear entries for a specific user
   */
  async clearForUser(userId: number | string): Promise<void> {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(numericUserId)) {
      return;
    }
    
    await invalidateUserPermissionCache(numericUserId);
  }
  
  /**
   * Get cache statistics
   */
  getStats(): any {
    return getPermissionCacheStats();
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    // No-op in compatibility mode
  }
  
  /**
   * Get all keys in the cache
   */
  keys(): string[] {
    return []; // Empty in compatibility mode
  }
}

// Export singleton instance
export const permissionCache = new PermissionCache(2000, 300);

// Default export for backwards compatibility
export default permissionCache;