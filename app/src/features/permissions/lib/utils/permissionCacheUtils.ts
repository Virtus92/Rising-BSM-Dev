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
export function getPermissionFromCache(userId: number, permission: string): boolean | undefined {
  // Handle invalid inputs gracefully
  if (!userId || !permission) {
    logger.debug('Invalid parameters for getPermissionFromCache', { userId, permission });
    return undefined;
  }
  
  try {
    const cacheKey = `${userId}:${permission}`;
    return permissionCache.get(cacheKey);
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
    const cacheKey = `${userId}:${permission}`;
    permissionCache.set(cacheKey, value, ttlSeconds);
    logger.debug(`Permission cached: ${permission} for user ${userId} = ${value}`, {
      ttlSeconds: ttlSeconds || 'default'
    });
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
    permissionCache.clearForUser(numericUserId);
    logger.debug(`Invalidated permission cache for user ${numericUserId}`);
    return true;
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
