/**
 * Permission Cache Utility
 * 
 * Provides efficient caching of user permissions to reduce database load
 * and improve API response times. Implements proper invalidation and TTL.
 */

import { getLogger } from '@/core/logging';

const logger = getLogger();

// Cache structure
interface PermissionCacheEntry {
  permissions: string[];
  timestamp: number;
}

// Cache settings
const CACHE_TTL = 300000; // 5 minutes
const CACHE_CLEANUP_INTERVAL = 600000; // 10 minutes

// In-memory permission cache
const permissionCache = new Map<number, PermissionCacheEntry>();

// Last cleanup timestamp
let lastCleanup = Date.now();

/**
 * Get permissions from cache
 */
export function getCachedPermissions(userId: number): string[] | null {
  try {
    // Run cache cleanup check if needed
    maybeCleanupCache();
    
    // Check if cache has the permissions
    const cacheEntry = permissionCache.get(userId);
    
    // If no cache entry or entry expired, return null
    if (!cacheEntry) {
      return null;
    }
    
    // Check if entry has expired
    const now = Date.now();
    if (now - cacheEntry.timestamp > CACHE_TTL) {
      // Remove expired entry
      permissionCache.delete(userId);
      return null;
    }
    
    // Return cached permissions
    return [...cacheEntry.permissions]; // Return a copy to prevent mutation
  } catch (error) {
    // Don't fail the application on cache errors
    logger.error('Error reading from permission cache', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return null;
  }
}

/**
 * Store permissions in cache
 */
export function cachePermissions(userId: number, permissions: string[]): void {
  try {
    // Create a cache entry
    const cacheEntry: PermissionCacheEntry = {
      permissions: [...permissions], // Store a copy to prevent mutation
      timestamp: Date.now()
    };
    
    // Store in cache
    permissionCache.set(userId, cacheEntry);
    
    logger.debug('Permissions cached for user', {
      userId,
      permissionCount: permissions.length
    });
  } catch (error) {
    // Don't fail the application on cache errors
    logger.error('Error writing to permission cache', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Invalidate cache for user
 */
export function invalidatePermissionCache(userId: number): void {
  try {
    // Remove from cache
    permissionCache.delete(userId);
    
    logger.debug('Permission cache invalidated for user', { userId });
  } catch (error) {
    // Don't fail the application on cache errors
    logger.error('Error invalidating permission cache', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Clear entire permission cache
 */
export function clearPermissionCache(): void {
  try {
    // Clear all entries
    permissionCache.clear();
    
    logger.debug('Permission cache cleared');
  } catch (error) {
    // Don't fail the application on cache errors
    logger.error('Error clearing permission cache', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Clean up expired cache entries
 */
function cleanupCache(): void {
  try {
    const now = Date.now();
    let expiredCount = 0;
    
    // Iterate through all cache entries
    for (const [userId, entry] of permissionCache.entries()) {
      // Check if entry has expired
      if (now - entry.timestamp > CACHE_TTL) {
        // Remove expired entry
        permissionCache.delete(userId);
        expiredCount++;
      }
    }
    
    // Update last cleanup timestamp
    lastCleanup = now;
    
    if (expiredCount > 0) {
      logger.debug('Cleaned up expired permission cache entries', {
        expiredCount,
        remainingEntries: permissionCache.size
      });
    }
  } catch (error) {
    // Don't fail the application on cache errors
    logger.error('Error cleaning up permission cache', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Run cache cleanup if it's time
 */
function maybeCleanupCache(): void {
  const now = Date.now();
  if (now - lastCleanup > CACHE_CLEANUP_INTERVAL) {
    cleanupCache();
  }
}

// Export the cache utilities
export default {
  getPermissions: getCachedPermissions,
  cachePermissions,
  invalidateCache: invalidatePermissionCache,
  clearCache: clearPermissionCache
};