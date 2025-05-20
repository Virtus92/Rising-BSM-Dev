/**
 * Permission Cache Service
 * 
 * A robust implementation for caching permission check results
 * to improve performance and reduce database load.
 */

import { getLogger } from '@/core/logging';

const logger = getLogger();

interface CacheEntry {
  value: boolean;
  expiry: number;
}

/**
 * Permission cache implementation using a class-based approach
 * for better maintainability and encapsulation
 */
class PermissionCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private permissionsCache: Map<number, string[]> = new Map();
  private readonly DEFAULT_TTL_SECONDS = 300; // 5 minutes
  
  /**
   * Cache a single permission check result
   * 
   * @param key Cache key (userId:permission format)
   * @param value Permission check result
   * @param ttlSeconds Optional TTL in seconds
   */
  public cachePermissionResult(key: string, value: boolean, ttlSeconds?: number): void {
    if (!key) {
      throw new Error('Invalid key provided to permission cache');
    }
    
    const ttl = ttlSeconds || this.DEFAULT_TTL_SECONDS;
    const expiry = Date.now() + (ttl * 1000);
    
    this.cache.set(key, { value, expiry });
    
    logger.debug(`Permission result cached: ${key} = ${value}`, {
      key,
      value,
      expiryTime: new Date(expiry).toISOString(),
      ttlSeconds: ttl
    });
  }
  
  /**
   * Get a cached permission check result
   * 
   * @param key Cache key (userId:permission format)
   * @returns The cached value or undefined if not found or expired
   */
  public getPermissionResult(key: string): boolean | undefined {
    if (!key) {
      return undefined;
    }
    
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
   * Cache all permissions for a user
   * 
   * @param userId User ID
   * @param permissions Array of permission codes
   */
  public cachePermissions(userId: number, permissions: string[]): void {
    if (!userId || isNaN(userId) || userId <= 0) {
      throw new Error(`Invalid userId provided to permission cache: ${userId}`);
    }
    
    // Store the permissions array
    this.permissionsCache.set(userId, [...permissions]);
    
    // Also cache individual permission results for fast lookups
    for (const permission of permissions) {
      const normalizedPermission = permission.toLowerCase().trim();
      const key = `${userId}:${normalizedPermission}`;
      this.cachePermissionResult(key, true);
    }
    
    logger.debug(`Cached ${permissions.length} permissions for user ${userId}`);
  }
  
  /**
   * Get all cached permissions for a user
   * 
   * @param userId User ID
   * @returns Array of permission codes or undefined if not cached
   */
  public getPermissions(userId: number): string[] | undefined {
    if (!userId || isNaN(userId) || userId <= 0) {
      return undefined;
    }
    
    return this.permissionsCache.get(userId);
  }
  
  /**
   * Invalidate cache for a specific user
   * 
   * @param userId User ID
   */
  public invalidateCache(userId: number): void {
    if (!userId || isNaN(userId) || userId <= 0) {
      return;
    }
    
    // Remove from permissions cache
    this.permissionsCache.delete(userId);
    
    // Find and delete all permission entries for this user
    const prefix = `${userId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
    
    logger.debug(`Permission cache invalidated for user ${userId}`);
  }
  
  /**
   * Clear all cache entries
   */
  public clearCache(): void {
    this.cache.clear();
    this.permissionsCache.clear();
    logger.debug('Permission cache cleared');
  }
  
  /**
   * Get cache statistics for monitoring
   */
  public getStats(): Record<string, any> {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Count active vs expired entries
    const activeEntries = entries.filter(([_, entry]) => entry.expiry >= now);
    const expiredEntries = entries.filter(([_, entry]) => entry.expiry < now);
    
    // Group by user
    const userStats: Record<string, { permissions: number, ttlRemaining: number }> = {};
    for (const [key, entry] of activeEntries) {
      const userId = key.split(':')[0];
      if (!userStats[userId]) {
        userStats[userId] = { permissions: 0, ttlRemaining: 0 };
      }
      userStats[userId].permissions++;
      
      // Track the minimum TTL remaining for this user
      const ttlRemaining = Math.floor((entry.expiry - now) / 1000);
      if (userStats[userId].ttlRemaining === 0 || ttlRemaining < userStats[userId].ttlRemaining) {
        userStats[userId].ttlRemaining = ttlRemaining;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      totalUserCaches: this.permissionsCache.size,
      activeEntries: activeEntries.length,
      expiredEntries: expiredEntries.length,
      userStats,
      defaultTtlSeconds: this.DEFAULT_TTL_SECONDS
    };
  }
}

// Create singleton instance
const permissionCache = new PermissionCacheService();

// Export default for importing
export default permissionCache;