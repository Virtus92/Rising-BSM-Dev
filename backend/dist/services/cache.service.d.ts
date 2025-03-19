/**
 * Cache Service
 * Provides a centralized caching mechanism for expensive operations
 */
interface CacheStats {
    totalItems: number;
    activeItems: number;
    expiredItems: number;
}
/**
 * Get data from cache or execute function to get fresh data
 * @param key Cache key
 * @param fn Function to execute if cache miss
 * @param ttl Time to live in seconds (default: 5 minutes)
 * @returns Cached or fresh data
 */
export declare const getOrExecute: <T>(key: string, fn: () => Promise<T>, ttl?: number) => Promise<T>;
/**
 * Set data in cache
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time to live in seconds (default: 5 minutes)
 */
export declare const set: <T>(key: string, data: T, ttl?: number) => void;
/**
 * Get data from cache
 * @param key Cache key
 * @returns Cached data or null if not found or expired
 */
export declare const get: <T>(key: string) => T | null;
/**
 * Delete data from cache
 * @param key Cache key
 */
export declare const deleteCache: (key: string) => void;
/**
 * Clear all cache or cache by prefix
 * @param prefix Optional prefix to clear only matching keys
 */
export declare const clear: (prefix?: string) => void;
/**
 * Get cache stats
 * @returns Cache statistics
 */
export declare const getStats: () => CacheStats;
/**
 * Cleanup expired cache entries
 */
export declare const cleanup: () => void;
/**
 * Start the cleanup interval
 * @returns True if interval was started, false if already running
 */
export declare const startCleanupInterval: () => boolean;
/**
 * Stop the cleanup interval
 * @returns True if interval was stopped, false if not running
 */
export declare const stopCleanupInterval: () => boolean;
export declare const cache: {
    getOrExecute: <T>(key: string, fn: () => Promise<T>, ttl?: number) => Promise<T>;
    set: <T>(key: string, data: T, ttl?: number) => void;
    get: <T>(key: string) => T | null;
    delete: (key: string) => void;
    clear: (prefix?: string) => void;
    getStats: () => CacheStats;
    cleanup: () => void;
    startCleanupInterval: () => boolean;
    stopCleanupInterval: () => boolean;
};
export default cache;
