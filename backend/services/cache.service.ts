/**
 * Cache Service
 * Provides a centralized caching mechanism for expensive operations
 */

// Cache item structure
interface CacheItem<T = any> {
    data: T;
    expiry: number;
  }
  
  // Cache statistics
  interface CacheStats {
    totalItems: number;
    activeItems: number;
    expiredItems: number;
  }
  
  // In-memory cache storage
  const cacheStore: Record<string, CacheItem> = {};
  
  // Store the interval ID so we can clear it
  let cleanupIntervalId: NodeJS.Timeout | null = null;
  
  /**
   * Get data from cache or execute function to get fresh data
   * @param key Cache key
   * @param fn Function to execute if cache miss
   * @param ttl Time to live in seconds (default: 5 minutes)
   * @returns Cached or fresh data
   */
  export const getOrExecute = async <T>(
    key: string, 
    fn: () => Promise<T>,
    ttl = 300
  ): Promise<T> => {
    const now = Date.now();
    
    // Check if cached data exists and is not expired
    if (cacheStore[key] && cacheStore[key].expiry > now) {
      return cacheStore[key].data as T;
    }
    
    // Execute function to get fresh data
    let data: T;
    try {
      data = await fn();
    } catch (error) {
      console.error(`Error executing cache callback for key "${key}":`, error);
      throw error; // Propagate the error to the caller
    }
    
    // Store in cache
    cacheStore[key] = {
      data,
      expiry: now + (ttl * 1000)
    };
    
    return data;
  };
  
  /**
   * Set data in cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in seconds (default: 5 minutes)
   */
  export const set = <T>(key: string, data: T, ttl = 300): void => {
    cacheStore[key] = {
      data,
      expiry: Date.now() + (ttl * 1000)
    };
  };
  
  /**
   * Get data from cache
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  export const get = <T>(key: string): T | null => {
    const now = Date.now();
    
    if (cacheStore[key] && cacheStore[key].expiry > now) {
      return cacheStore[key].data as T;
    }
    
    return null;
  };
  
  /**
   * Delete data from cache
   * @param key Cache key
   */
  export const deleteCache = (key: string): void => {
    delete cacheStore[key];
  };
  
  /**
   * Clear all cache or cache by prefix
   * @param prefix Optional prefix to clear only matching keys
   */
  export const clear = (prefix?: string): void => {
    if (prefix) {
      Object.keys(cacheStore).forEach(key => {
        if (key.startsWith(prefix)) {
          delete cacheStore[key];
        }
      });
    } else {
      Object.keys(cacheStore).forEach(key => {
        delete cacheStore[key];
      });
    }
  };
  
  /**
   * Get cache stats
   * @returns Cache statistics
   */
  export const getStats = (): CacheStats => {
    const now = Date.now();
    let totalItems = 0;
    let expiredItems = 0;
    
    Object.values(cacheStore).forEach(item => {
      totalItems++;
      if (item.expiry <= now) {
        expiredItems++;
      }
    });
    
    return {
      totalItems,
      activeItems: totalItems - expiredItems,
      expiredItems
    };
  };
  
  /**
   * Cleanup expired cache entries
   */
  export const cleanup = (): void => {
    const now = Date.now();
    
    Object.entries(cacheStore).forEach(([key, value]) => {
      if (value.expiry <= now) {
        delete cacheStore[key];
      }
    });
  };
  
  /**
   * Start the cleanup interval
   * @returns True if interval was started, false if already running
   */
  export const startCleanupInterval = (): boolean => {
    if (!cleanupIntervalId) {
      cleanupIntervalId = setInterval(cleanup, 5 * 60 * 1000); // Run every 5 minutes
      return true;
    }
    return false;
  };
  
  /**
   * Stop the cleanup interval
   * @returns True if interval was stopped, false if not running
   */
  export const stopCleanupInterval = (): boolean => {
    if (cleanupIntervalId) {
      clearInterval(cleanupIntervalId);
      cleanupIntervalId = null;
      return true;
    }
    return false;
  };
  
  // Run cleanup periodically (every 5 minutes)
  if (process.env.NODE_ENV !== 'test') {
    startCleanupInterval();
  }
  
  // Singleton export pattern
  export const cache = {
    getOrExecute,
    set,
    get,
    delete: deleteCache, // Renamed to avoid JS reserved keyword
    clear,
    getStats,
    cleanup,
    startCleanupInterval,
    stopCleanupInterval
  };
  
  export default cache;