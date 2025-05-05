/**
 * Permission Cache
 * Provides efficient caching for permission checks with thread-safety mechanisms
 * for high concurrency environments
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
/**
 * Cache stats tracking
 */
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  clears: number;
  lastReset: number;
}

export class PermissionCache {
  private cache: Map<string, CacheEntry<boolean>> = new Map();
  private readonly maxSize: number;
  private readonly defaultTtl: number;
  private readonly stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    clears: 0,
    lastReset: Date.now()
  };
  
  // Mutex mechanism for thread safety in concurrent environments
  private readonly mutex: Map<string, boolean> = new Map();
  
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
   * Lock a key for thread-safe operations
   * 
   * @param key Cache key to lock
   * @returns Whether the lock was acquired
   */
  private tryLock(key: string): boolean {
    if (this.mutex.has(key)) {
      return false;
    }
    this.mutex.set(key, true);
    return true;
  }
  
  /**
   * Release a lock on a key
   * 
   * @param key Cache key to unlock
   */
  private unlock(key: string): void {
    this.mutex.delete(key);
  }
  
  /**
   * Get a value from the cache
   * 
   * @param key Cache key
   * @returns Cached value or undefined if not found
   */
  get(key: string): boolean | undefined {
    // Try to acquire lock for this operation
    if (!this.tryLock(`get:${key}`)) {
      return undefined; // Return undefined if lock can't be acquired
    }
    
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.stats.misses++;
        return undefined;
      }
      
      // Check if entry has expired
      if (Date.now() > entry.expires) {
        this.cache.delete(key);
        this.stats.misses++;
        this.stats.deletes++;
        return undefined;
      }
      
      // Move entry to the end of the cache (most recently used)
      this.cache.delete(key);
      this.cache.set(key, entry);
      
      this.stats.hits++;
      return entry.value;
    } finally {
      // Always release the lock
      this.unlock(`get:${key}`);
    }
  }
  
  /**
   * Set a value in the cache
   * 
   * @param key Cache key
   * @param value Cache value
   * @param ttlSeconds TTL in seconds
   */
  set(key: string, value: boolean, ttlSeconds?: number): void {
    // Try to acquire lock for this operation
    if (!this.tryLock(`set:${key}`)) {
      return; // Skip if lock can't be acquired
    }
    
    try {
      // If cache is full, remove oldest entry
      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey !== undefined) {
          this.cache.delete(oldestKey);
          this.stats.deletes++;
        }
      }
      
      // Set new entry
      const ttl = ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTtl;
      this.cache.set(key, {
        value,
        expires: Date.now() + ttl
      });
      
      this.stats.sets++;
    } finally {
      // Always release the lock
      this.unlock(`set:${key}`);
    }
  }
  
  /**
   * Delete an entry from the cache
   * 
   * @param key Cache key
   * @returns Whether the entry was deleted
   */
  delete(key: string): boolean {
    // Try to acquire lock for this operation
    if (!this.tryLock(`delete:${key}`)) {
      return false; // Skip if lock can't be acquired
    }
    
    try {
      const result = this.cache.delete(key);
      if (result) {
        this.stats.deletes++;
      }
      return result;
    } finally {
      // Always release the lock
      this.unlock(`delete:${key}`);
    }
  }
  
  /**
   * Clear all entries from the cache
   */
  clear(): void {
    // Try to acquire lock for this operation
    if (!this.tryLock('clear')) {
      return; // Skip if lock can't be acquired
    }
    
    try {
      this.cache.clear();
      this.stats.clears++;
    } finally {
      // Always release the lock
      this.unlock('clear');
    }
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
    // Try to acquire lock for this operation
    if (!this.tryLock(`clearForUser:${userId}`)) {
      return; // Skip if lock can't be acquired
    }
    
    try {
      if (!userId) {
        console.warn('Invalid user ID provided to clearForUser');
        return;
      }
      
      // Ensure userId is converted to string
      const userIdStr = String(userId);
      const userPrefix = `${userIdStr}:`;
      
      // Convert cache keys to an array before iterating to avoid modification during iteration
      const keys = Array.from(this.cache.keys());
      let deletedCount = 0;
      
      for (const key of keys) {
        if (key.startsWith(userPrefix)) {
          this.cache.delete(key);
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        this.stats.deletes += deletedCount;
      }
    } finally {
      // Always release the lock
      this.unlock(`clearForUser:${userId}`);
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
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    clears: number;
    uptime: number;
  } {
    const totalLookups = this.stats.hits + this.stats.misses;
    const hitRate = totalLookups > 0 ? this.stats.hits / totalLookups : undefined;
    const missRate = totalLookups > 0 ? this.stats.misses / totalLookups : undefined;
    const uptime = Date.now() - this.stats.lastReset;
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
      missRate,
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      clears: this.stats.clears,
      uptime
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.sets = 0;
    this.stats.deletes = 0;
    this.stats.clears = 0;
    this.stats.lastReset = Date.now();
  }
}

// Export singleton instance
export const permissionCache = new PermissionCache();
export default permissionCache;
