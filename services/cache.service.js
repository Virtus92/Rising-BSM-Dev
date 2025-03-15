/**
 * Cache Service
 * Provides a centralized caching mechanism for expensive operations
 */

class CacheService {
  constructor(options = {}) {
    this.cache = {};
    this.maxItems = options.maxItems || 100;
    this.defaultTTL = options.defaultTTL || 60; // seconds
    this.keys = []; // Track keys for LRU implementation
    this.activePromises = {};
  }
  
  set(key, value, ttl = this.defaultTTL) {
    // Handle max items limit with LRU eviction
    if (!this.cache[key] && Object.keys(this.cache).length >= this.maxItems) {
      // Get the oldest key and remove it
      const oldestKey = this.keys.shift();
      delete this.cache[oldestKey];
    }
    
    // Update key position in the keys array (for LRU tracking)
    const keyIndex = this.keys.indexOf(key);
    if (keyIndex !== -1) {
      this.keys.splice(keyIndex, 1);
    }
    this.keys.push(key); // Move to the end (most recently used)
    
    const expiryTime = Date.now() + (ttl * 1000);
    this.cache[key] = {
      value,
      expiry: expiryTime
    };
    
    return value;
  }
  
  get(key) {
    const item = this.cache[key];
    
    // Handle non-existent key
    if (!item) {
      return null;
    }
    
    // Check if item is expired
    if (item.expiry < Date.now()) {
      delete this.cache[key];
      
      // Remove from keys array
      const keyIndex = this.keys.indexOf(key);
      if (keyIndex !== -1) {
        this.keys.splice(keyIndex, 1);
      }
      
      return null;
    }
    
    // Update the key's position in the LRU tracking
    const keyIndex = this.keys.indexOf(key);
    if (keyIndex !== -1) {
      this.keys.splice(keyIndex, 1);
      this.keys.push(key);
    }
    
    return item.value;
  }
  
  async getOrExecute(key, callback, ttl = this.defaultTTL) {
    // Check cache first
    const cachedValue = this.get(key);
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    // Check for active promise for this key (prevent duplicates)
    if (this.activePromises[key]) {
      return this.activePromises[key];
    }
    
    // Store promise in active promises to prevent duplication
    const promise = callback();
    this.activePromises[key] = promise;
    
    try {
      const result = await promise;
      this.set(key, result, ttl);
      delete this.activePromises[key];
      return result;
    } catch (error) {
      delete this.activePromises[key];
      throw error;
    }
  }
  
  delete(key) {
    // Remove from LRU tracking
    const index = this.keys.indexOf(key);
    if (index > -1) {
      this.keys.splice(index, 1);
    }
    
    delete this.cache[key];
  }
  
  clear(prefix) {
    if (prefix) {
      this.keys = this.keys.filter(key => {
        if (key.startsWith(prefix)) {
          delete this.cache[key];
          return false;
        }
        return true;
      });
    } else {
      this.cache = {};
      this.keys = [];
    }
  }
  
  getStats() {
    const now = Date.now();
    let totalItems = 0;
    let expiredItems = 0;
    
    Object.values(this.cache).forEach(item => {
      totalItems++;
      if (item.expiry <= now) {
        expiredItems++;
      }
    });
    
    return {
      totalItems,
      activeItems: totalItems - expiredItems,
      expiredItems,
      maxItems: this.maxItems,
      lruQueueLength: this.keys.length
    };
  }
  
  cleanup() {
    const now = Date.now();
    
    this.keys = this.keys.filter(key => {
      if (this.cache[key] && this.cache[key].expiry <= now) {
        delete this.cache[key];
        return false;
      }
      return true;
    });
  }
  
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  // Method to limit cache size for tests
  _enforceMaxItems() {
    if (this.keys.length > this.maxItems) {
      // Remove oldest keys until we're at max
      const keysToRemove = this.keys.splice(0, this.keys.length - this.maxItems);
      keysToRemove.forEach(key => {
        delete this.cache[key];
      });
    }
  }
}

// Create default instance
const defaultCache = new CacheService();

// For backward compatibility
exports.getOrExecute = (key, fn, ttl) => defaultCache.getOrExecute(key, fn, ttl);
exports.set = (key, data, ttl) => defaultCache.set(key, data, ttl);
exports.get = (key) => defaultCache.get(key);
exports.delete = (key) => defaultCache.delete(key);
exports.clear = (prefix) => defaultCache.clear(prefix);
exports.getStats = () => defaultCache.getStats();
exports.cleanup = () => defaultCache.cleanup();

// Export the class for creating custom instances
exports.CacheService = CacheService;