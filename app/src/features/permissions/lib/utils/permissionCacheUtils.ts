/**
 * Direct Permission Cache Utilities Implementation
 * 
 * Clean implementation for permission caching without compatibility layers.
 * Work properly or throw errors - no fallbacks.
 */

import { getLogger } from '@/core/logging';

const logger = getLogger();

// Cache implementation
interface PermissionCacheEntry {
  value: boolean;
  expiry: number;
}

// Use a proper class-based approach for the cache
class PermissionCache {
  private cache: Map<string, PermissionCacheEntry> = new Map();
  private readonly DEFAULT_TTL_SECONDS = 300; // 5 minutes
  
  /**
   * Get a permission value from cache
   * 
   * @param userId User ID
   * @param permission Permission code 
   * @returns The cached value or undefined if not found
   * @throws Error if parameters are invalid
   */
  public get(userId: number, permission: string): boolean | undefined {
    // Validate inputs
    if (!userId || isNaN(userId)) {
      throw new Error(`Invalid userId provided to permission cache: ${userId}`);
    }
    
    if (!permission || typeof permission !== 'string') {
      throw new Error(`Invalid permission provided to permission cache: ${permission}`);
    }
    
    // Normalize permission code
    const normalizedPermission = permission.trim().toLowerCase();
    const key = this.createCacheKey(userId, normalizedPermission);
    
    // Check if entry exists and is not expired
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }
    
    // Check if entry has expired
    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  /**
   * Set a permission value in cache
   * 
   * @param userId User ID
   * @param permission Permission code
   * @param value Permission value
   * @param ttlSeconds Optional TTL in seconds
   * @throws Error if parameters are invalid
   */
  public set(userId: number, permission: string, value: boolean, ttlSeconds?: number): void {
    // Validate inputs
    if (!userId || isNaN(userId)) {
      throw new Error(`Invalid userId provided to permission cache: ${userId}`);
    }
    
    if (!permission || typeof permission !== 'string') {
      throw new Error(`Invalid permission provided to permission cache: ${permission}`);
    }
    
    // Normalize permission code
    const normalizedPermission = permission.trim().toLowerCase();
    const key = this.createCacheKey(userId, normalizedPermission);
    
    // Calculate expiry
    const ttl = ttlSeconds || this.DEFAULT_TTL_SECONDS;
    const expiry = Date.now() + (ttl * 1000);
    
    // Store in cache
    this.cache.set(key, {
      value,
      expiry
    });
  }
  
  /**
   * Invalidate cache for a user
   * 
   * @param userId User ID
   * @throws Error if userId is invalid
   */
  public invalidateUser(userId: number): void {
    // Validate userId
    if (!userId || isNaN(userId)) {
      throw new Error(`Invalid userId provided to invalidateUser: ${userId}`);
    }
    
    // Find and delete all entries for this user
    const prefix = `user:${userId}:`;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Clear the entire cache
   */
  public clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  public getStats(): Record<string, any> {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Count active vs expired entries
    const activeEntries = entries.filter(([_, entry]) => entry.expiry >= now);
    const expiredEntries = entries.filter(([_, entry]) => entry.expiry < now);
    
    // Group permissions by user
    const userPermissionCounts: Record<string, number> = {};
    for (const [key, _] of activeEntries) {
      const userId = key.split(':')[1];
      userPermissionCounts[userId] = (userPermissionCounts[userId] || 0) + 1;
    }
    
    return {
      totalEntries: this.cache.size,
      activeEntries: activeEntries.length,
      expiredEntries: expiredEntries.length,
      userPermissionCounts
    };
  }
  
  /**
   * Create a cache key
   */
  private createCacheKey(userId: number, permission: string): string {
    return `user:${userId}:perm:${permission}`;
  }
}

// Singleton instance
const permissionCache = new PermissionCache();

/**
 * Get a permission from the cache
 * 
 * @param userId User ID
 * @param permission Permission code
 * @returns Promise resolving to the permission value or undefined if not in cache
 * @throws Error if inputs are invalid
 */
export async function getPermissionFromCache(userId: number, permission: string): Promise<boolean | undefined> {
  try {
    return permissionCache.get(userId, permission);
  } catch (error) {
    logger.error('Error in getPermissionFromCache:', error as Error);
    throw error; // Re-throw so caller can handle
  }
}

/**
 * Set a permission in the cache
 * 
 * @param userId User ID
 * @param permission Permission code
 * @param value Permission value
 * @param ttlSeconds TTL in seconds (optional)
 * @returns Promise resolving to true if successful
 * @throws Error if inputs are invalid or operation fails
 */
export async function setPermissionInCache(
  userId: number,
  permission: string,
  value: boolean,
  ttlSeconds?: number
): Promise<boolean> {
  try {
    permissionCache.set(userId, permission, value, ttlSeconds);
    return true;
  } catch (error) {
    logger.error('Error in setPermissionInCache:', error as Error);
    throw error; // Re-throw so caller can handle
  }
}

/**
 * Invalidate cache for a user
 * 
 * @param userId User ID
 * @returns Promise resolving to true if successful
 * @throws Error if userId is invalid or operation fails
 */
export async function invalidateUserPermissionCache(userId: number): Promise<boolean> {
  try {
    permissionCache.invalidateUser(userId);
    return true;
  } catch (error) {
    logger.error('Error in invalidateUserPermissionCache:', error as Error);
    throw error; // Re-throw so caller can handle
  }
}

/**
 * Clear the entire permission cache
 * 
 * @returns Promise resolving to true if successful
 * @throws Error if operation fails
 */
export async function clearPermissionCache(): Promise<boolean> {
  try {
    permissionCache.clear();
    return true;
  } catch (error) {
    logger.error('Error in clearPermissionCache:', error as Error);
    throw error; // Re-throw so caller can handle
  }
}

/**
 * Get permission cache statistics
 * 
 * @returns Cache statistics
 */
export function getPermissionCacheStats(): Record<string, any> {
  try {
    return permissionCache.getStats();
  } catch (error) {
    logger.error('Error in getPermissionCacheStats:', error as Error);
    throw error; // Re-throw so caller can handle
  }
}

/**
 * Check if permission caching is enabled
 * Always enabled in this implementation
 * 
 * @returns true
 */
export function isPermissionCachingEnabled(): boolean {
  return true;
}

// Export all functions directly
export default {
  getPermissionFromCache,
  setPermissionInCache,
  invalidateUserPermissionCache,
  clearPermissionCache,
  getPermissionCacheStats,
  isPermissionCachingEnabled
};