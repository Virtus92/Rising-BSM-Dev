/**
 * Permission Cache
 * Provides efficient caching for permission checks
 */

/**
 * Cache entry with expiration
 */
interface CacheEntry<T> {
  value: T;
  expires: number;
}

/**
 * LRU Cache for permissions with TTL
 */
export class PermissionCache {
  private cache: Map<string, CacheEntry<boolean>> = new Map();
  private readonly maxSize: number;
  private readonly defaultTtl: number;
  
  /**
   * Create a new permission cache
   * 
   * @param maxSize Maximum cache size
   * @param defaultTtlSeconds Default TTL in seconds
   */
  constructor(maxSize: number = 1000, defaultTtlSeconds: number = 300) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtlSeconds * 1000;
  }
  
  /**
   * Get a value from the cache
   * 
   * @param key Cache key
   * @returns Cached value or undefined if not found
   */
  get(key: string): boolean | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if entry has expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Move entry to the end of the cache (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }
  
  /**
   * Set a value in the cache
   * 
   * @param key Cache key
   * @param value Cache value
   * @param ttlSeconds TTL in seconds
   */
  set(key: string, value: boolean, ttlSeconds?: number): void {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    
    // Set new entry
    const ttl = ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTtl;
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }
  
  /**
   * Delete an entry from the cache
   * 
   * @param key Cache key
   * @returns Whether the entry was deleted
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get all keys in the cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Clear entries for a specific user
   * 
   * @param userId User ID
   */
  clearForUser(userId: number | string): void {
    if (!userId) {
      console.warn('Invalid user ID provided to clearForUser');
      return;
    }
    
    // Ensure userId is converted to string
    const userIdStr = String(userId);
    const userPrefix = `${userIdStr}:`;
    
    // Convert cache keys to an array before iterating to avoid modification during iteration
    const keys = Array.from(this.cache.keys());
    
    for (const key of keys) {
      if (key.startsWith(userPrefix)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
    missRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// Export singleton instance
export const permissionCache = new PermissionCache();
export default permissionCache;
