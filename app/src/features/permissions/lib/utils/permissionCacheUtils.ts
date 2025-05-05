/**
 * Permission Cache Utilities
 * This module provides utilities for permission cache management without circular dependencies
 * Updated for better error handling and proper module structure
 */
import { getLogger } from '@/core/logging';
import { permissionCache } from './PermissionCache';

const logger = getLogger();

/**
 * Get a permission from the cache
 * 
 * @param userId - User ID
 * @param permission - Permission code
 * @returns Boolean from cache or undefined if not found
 */
/**
 * Lock mechanism to prevent race conditions
 */
const cacheLocks = new Map<string, boolean>();

/**
 * Get lock for a specific cache operation
 * @param key - Cache operation key
 * @returns Whether the lock was acquired
 */
function acquireLock(key: string): boolean {
  if (cacheLocks.has(key)) {
    return false;
  }
  cacheLocks.set(key, true);
  return true;
}

/**
 * Release lock for a specific cache operation
 * @param key - Cache operation key
 */
function releaseLock(key: string): void {
  cacheLocks.delete(key);
}

export function getPermissionFromCache(userId: number, permission: string): boolean | undefined {
  // Handle invalid inputs gracefully
  if (!userId || !permission) {
    logger.debug('Invalid parameters for getPermissionFromCache', { userId, permission });
    return undefined;
  }
  
  try {
    // Create a cache key that uniquely identifies this permission check
    const cacheKey = `${userId}:${permission}`;
    
    // Use lock to prevent race conditions when checking cache
    const lockKey = `get:${cacheKey}`;
    if (!acquireLock(lockKey)) {
      // Another operation is already accessing this cache entry
      logger.debug('Cache access already in progress for key', { cacheKey });
      return undefined;
    }
    
    try {
      return permissionCache.get(cacheKey);
    } finally {
      // Always release the lock
      releaseLock(lockKey);
    }
  } catch (error) {
    logger.error('Error getting permission from cache', {
      userId,
      permission,
      error: error instanceof Error ? error.message : String(error)
    });
    return undefined;
  }
}

/**
 * Set a permission in the cache
 * 
 * @param userId - User ID
 * @param permission - Permission code
 * @param value - Permission value (true/false)
 * @param ttlSeconds - Optional TTL in seconds
 */
export function setPermissionInCache(
  userId: number, 
  permission: string, 
  value: boolean,
  ttlSeconds?: number
): void {
  // Handle invalid inputs gracefully
  if (!userId || !permission) {
    logger.debug('Invalid parameters for setPermissionInCache', { userId, permission, value });
    return;
  }
  
  try {
    // Create a cache key that uniquely identifies this permission check
    const cacheKey = `${userId}:${permission}`;
    
    // Use lock to prevent race conditions
    const lockKey = `set:${cacheKey}`;
    if (!acquireLock(lockKey)) {
      // Another operation is already updating this cache entry
      logger.debug('Cache update already in progress for key', { cacheKey });
      return;
    }
    
    try {
      permissionCache.set(cacheKey, value, ttlSeconds);
      logger.debug(`Permission cached: ${permission} for user ${userId} = ${value}`, {
        ttlSeconds: ttlSeconds || 'default'
      });
    } finally {
      // Always release the lock
      releaseLock(lockKey);
    }
  } catch (error) {
    logger.error('Error setting permission in cache', {
      userId,
      permission,
      value,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Invalidate cache for a user
 * 
 * @param userId - User ID
 * @returns Whether the operation was successful
 */
export function invalidateUserPermissionCache(userId: number): boolean {
  if (!userId || isNaN(userId)) {
    logger.warn('Invalid user ID provided to invalidateUserPermissionCache', { userId });
    return false;
  }
  
  try {
    // Ensure userId is numeric
    const numericUserId = Number(userId);
    
    // Use lock to prevent race conditions
    const lockKey = `invalidate:${numericUserId}`;
    if (!acquireLock(lockKey)) {
      // Another operation is already invalidating cache for this user
      logger.debug('Cache invalidation already in progress for user', { userId });
      return false;
    }
    
    try {
      permissionCache.clearForUser(numericUserId);
      logger.debug(`Invalidated permission cache for user ${numericUserId}`);
      return true;
    } finally {
      // Always release the lock
      releaseLock(lockKey);
    }
  } catch (error) {
    logger.error('Error invalidating user permission cache', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Clears the entire permission cache
 */
export function clearPermissionCache(): void {
  try {
    permissionCache.clear();
    logger.debug('Cleared entire permission cache');
  } catch (error) {
    logger.error('Error clearing permission cache', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Allow importing as a namespace
const permissionCacheUtils = {
  getPermissionFromCache,
  setPermissionInCache,
  invalidateUserPermissionCache,
  clearPermissionCache
};

export { permissionCacheUtils };
export default permissionCacheUtils;
