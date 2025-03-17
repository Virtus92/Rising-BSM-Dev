/**
 * Cache Service
 * Provides a centralized caching mechanism for expensive operations
 */

// In-memory cache storage
const cacheStore = {};

// Store the interval ID so we can clear it
let cleanupIntervalId = null;

/**
 * Get data from cache or execute function to get fresh data
 * @param {string} key - Cache key
 * @param {Function} fn - Function to execute if cache miss
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 * @returns {Promise<any>} - Cached or fresh data
 */
exports.getOrExecute = async (key, fn, ttl = 300) => {
  const now = Date.now();
  
  // Check if cached data exists and is not expired
  if (cacheStore[key] && cacheStore[key].expiry > now) {
    return cacheStore[key].data;
  }
  
  // Execute function to get fresh data
  const data = await fn();
  
  // Store in cache
  cacheStore[key] = {
    data,
    expiry: now + (ttl * 1000)
  };
  
  return data;
};

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 */
exports.set = (key, data, ttl = 300) => {
  cacheStore[key] = {
    data,
    expiry: Date.now() + (ttl * 1000)
  };
};

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if not found or expired
 */
exports.get = (key) => {
  const now = Date.now();
  
  if (cacheStore[key] && cacheStore[key].expiry > now) {
    return cacheStore[key].data;
  }
  
  return null;
};

/**
 * Delete data from cache
 * @param {string} key - Cache key
 */
exports.delete = (key) => {
  delete cacheStore[key];
};

/**
 * Clear all cache or cache by prefix
 * @param {string} [prefix] - Optional prefix to clear only matching keys
 */
exports.clear = (prefix) => {
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
 * @returns {object} - Cache statistics
 */
exports.getStats = () => {
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
exports.cleanup = () => {
  const now = Date.now();
  
  Object.entries(cacheStore).forEach(([key, value]) => {
    if (value.expiry <= now) {
      delete cacheStore[key];
    }
  });
};

// Run cleanup periodically (every 5 minutes)
if (process.env.NODE_ENV !== 'test') {
  cleanupIntervalId = setInterval(exports.cleanup, 5 * 60 * 1000);
} else {
  // console.log('Cache service cleanup interval not started in test environment');
}

// Add a method to start the interval (for testing purposes)
exports.startCleanupInterval = () => {
  if (!cleanupIntervalId) {
    cleanupIntervalId = setInterval(exports.cleanup, 5 * 60 * 1000);
    return true;
  }
  return false;
};

// Add a method to stop the interval (for testing purposes)
exports.stopCleanupInterval = () => {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
    return true;
  }
  return false;
};