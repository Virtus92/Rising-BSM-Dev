"use strict";
/**
 * Cache Service
 * Provides a centralized caching mechanism for expensive operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = exports.stopCleanupInterval = exports.startCleanupInterval = exports.cleanup = exports.getStats = exports.clear = exports.deleteCache = exports.get = exports.set = exports.getOrExecute = void 0;
// In-memory cache storage
const cacheStore = {};
// Store the interval ID so we can clear it
let cleanupIntervalId = null;
/**
 * Get data from cache or execute function to get fresh data
 * @param key Cache key
 * @param fn Function to execute if cache miss
 * @param ttl Time to live in seconds (default: 5 minutes)
 * @returns Cached or fresh data
 */
const getOrExecute = async (key, fn, ttl = 300) => {
    const now = Date.now();
    // Check if cached data exists and is not expired
    if (cacheStore[key] && cacheStore[key].expiry > now) {
        return cacheStore[key].data;
    }
    // Execute function to get fresh data
    let data;
    try {
        data = await fn();
    }
    catch (error) {
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
exports.getOrExecute = getOrExecute;
/**
 * Set data in cache
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time to live in seconds (default: 5 minutes)
 */
const set = (key, data, ttl = 300) => {
    cacheStore[key] = {
        data,
        expiry: Date.now() + (ttl * 1000)
    };
};
exports.set = set;
/**
 * Get data from cache
 * @param key Cache key
 * @returns Cached data or null if not found or expired
 */
const get = (key) => {
    const now = Date.now();
    if (cacheStore[key] && cacheStore[key].expiry > now) {
        return cacheStore[key].data;
    }
    return null;
};
exports.get = get;
/**
 * Delete data from cache
 * @param key Cache key
 */
const deleteCache = (key) => {
    delete cacheStore[key];
};
exports.deleteCache = deleteCache;
/**
 * Clear all cache or cache by prefix
 * @param prefix Optional prefix to clear only matching keys
 */
const clear = (prefix) => {
    if (prefix) {
        Object.keys(cacheStore).forEach(key => {
            if (key.startsWith(prefix)) {
                delete cacheStore[key];
            }
        });
    }
    else {
        Object.keys(cacheStore).forEach(key => {
            delete cacheStore[key];
        });
    }
};
exports.clear = clear;
/**
 * Get cache stats
 * @returns Cache statistics
 */
const getStats = () => {
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
exports.getStats = getStats;
/**
 * Cleanup expired cache entries
 */
const cleanup = () => {
    const now = Date.now();
    Object.entries(cacheStore).forEach(([key, value]) => {
        if (value.expiry <= now) {
            delete cacheStore[key];
        }
    });
};
exports.cleanup = cleanup;
/**
 * Start the cleanup interval
 * @returns True if interval was started, false if already running
 */
const startCleanupInterval = () => {
    if (!cleanupIntervalId) {
        cleanupIntervalId = setInterval(exports.cleanup, 5 * 60 * 1000); // Run every 5 minutes
        return true;
    }
    return false;
};
exports.startCleanupInterval = startCleanupInterval;
/**
 * Stop the cleanup interval
 * @returns True if interval was stopped, false if not running
 */
const stopCleanupInterval = () => {
    if (cleanupIntervalId) {
        clearInterval(cleanupIntervalId);
        cleanupIntervalId = null;
        return true;
    }
    return false;
};
exports.stopCleanupInterval = stopCleanupInterval;
// Run cleanup periodically (every 5 minutes)
if (process.env.NODE_ENV !== 'test') {
    (0, exports.startCleanupInterval)();
}
// Singleton export pattern
exports.cache = {
    getOrExecute: exports.getOrExecute,
    set: exports.set,
    get: exports.get,
    delete: exports.deleteCache, // Renamed to avoid JS reserved keyword
    clear: // Renamed to avoid JS reserved keyword
    exports.clear,
    getStats: exports.getStats,
    cleanup: exports.cleanup,
    startCleanupInterval: exports.startCleanupInterval,
    stopCleanupInterval: exports.stopCleanupInterval
};
exports.default = exports.cache;
//# sourceMappingURL=cache.service.js.map