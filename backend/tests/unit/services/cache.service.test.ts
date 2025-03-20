import { 
    getOrExecute, 
    set, 
    get, 
    deleteCache, 
    clear, 
    getStats, 
    cleanup,
    startCleanupInterval,
    stopCleanupInterval,
    cache
  } from '../../../services/cache.service';
  import { describe, test, expect, beforeEach, jest } from '@jest/globals';
  
  describe('Cache Service', () => {
    beforeEach(() => {
      // Clear cache between tests
      clear();
    });
    
    describe('get and set', () => {
      test('should store and retrieve cached data', () => {
        const testData = { id: 1, name: 'Test' };
        
        // Store in cache
        set('test-key', testData);
        
        // Retrieve from cache
        const cachedData = get('test-key');
        
        expect(cachedData).toEqual(testData);
      });
      
      test('should return null for non-existent cache key', () => {
        const cachedData = get('non-existent-key');
        
        expect(cachedData).toBeNull();
      });
      
      test('should return null for expired cache entry', async () => {
        const testData = { id: 1, name: 'Test' };
        
        // Store with short TTL
        set('expired-key', testData, 0.001); // 1ms TTL
        
        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const cachedData = get('expired-key');
        expect(cachedData).toBeNull();
      });
    });
    
    describe('getOrExecute', () => {
      test('should execute function and cache result when key not found', async () => {
        const testData = { id: 1, name: 'Test' };
        const mockFn = jest.fn().mockResolvedValue(testData);
        
        const result = await getOrExecute('test-key', mockFn);
        
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(result).toEqual(testData);
        
        // Should be cached now
        const cachedData = get('test-key');
        expect(cachedData).toEqual(testData);
      });
      
      test('should return cached data without executing function when available', async () => {
        const testData = { id: 1, name: 'Test' };
        set('cached-key', testData);
        
        const mockFn = jest.fn();
        
        const result = await getOrExecute('cached-key', mockFn);
        
        expect(mockFn).not.toHaveBeenCalled();
        expect(result).toEqual(testData);
      });
      
      test('should propagate errors from executed function', async () => {
        const mockError = new Error('Test error');
        const mockFn = jest.fn().mockRejectedValue(mockError);
        
        await expect(getOrExecute('error-key', mockFn)).rejects.toThrow(mockError);
      });
    });
    
    describe('deleteCache', () => {
      test('should remove specific cache entry', () => {
        set('key1', 'value1');
        set('key2', 'value2');
        
        deleteCache('key1');
        
        expect(get('key1')).toBeNull();
        expect(get('key2')).toBe('value2');
      });
    });
    
    describe('clear', () => {
      test('should remove all cache entries', () => {
        set('key1', 'value1');
        set('key2', 'value2');
        
        clear();
        
        expect(get('key1')).toBeNull();
        expect(get('key2')).toBeNull();
      });
      
      test('should remove only entries with matching prefix', () => {
        set('user:1', 'User 1');
        set('user:2', 'User 2');
        set('post:1', 'Post 1');
        
        clear('user:');
        
        expect(get('user:1')).toBeNull();
        expect(get('user:2')).toBeNull();
        expect(get('post:1')).toBe('Post 1');
      });
    });
    
    describe('getStats', () => {
      test('should return correct cache statistics', async () => {
        set('key1', 'value1');
        set('key2', 'value2');
        
        // Add expired item
        set('expired', 'value', 0.001); // 1ms TTL
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const stats = getStats();
        
        expect(stats.totalItems).toBe(3);
        expect(stats.expiredItems).toBe(1);
        expect(stats.activeItems).toBe(2);
      });
    });
    
    describe('cleanup', () => {
      test('should remove expired cache entries', async () => {
        set('active', 'value1', 60); // 60s TTL
        set('expired', 'value2', 0.001); // 1ms TTL
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Pre-cleanup check
        expect(get('active')).toBe('value1');
        expect(get('expired')).toBeNull(); // Already expired but still in store
        
        // Run cleanup
        cleanup();
        
        // Get stats after cleanup
        const stats = getStats();
        expect(stats.totalItems).toBe(1); // Only active item remains
        expect(stats.expiredItems).toBe(0);
      });
    });
    
  describe('cleanup interval', () => {
    test('should start and stop cleanup interval', () => {
      // Mock setInterval and clearInterval
      const originalSetInterval = global.setInterval;
      const originalClearInterval = global.clearInterval;
      
      global.setInterval = jest.fn().mockReturnValue(123);
      global.clearInterval = jest.fn();
      
      // Start interval
      const startResult = startCleanupInterval();
      expect(startResult).toBe(true);
      expect(global.setInterval).toHaveBeenCalled();
      
      // Try to start again (should return false)
      const startAgainResult = startCleanupInterval();
      expect(startAgainResult).toBe(false);
      
      // Stop interval
      const stopResult = stopCleanupInterval();
      expect(stopResult).toBe(true);
      expect(global.clearInterval).toHaveBeenCalledWith(123);
      
      // Try to stop again (should return false)
      const stopAgainResult = stopCleanupInterval();
      expect(stopAgainResult).toBe(false);
      
      // Restore original functions
      global.setInterval = originalSetInterval;
      global.clearInterval = originalClearInterval;
    });
  });
  
  describe('cache object export', () => {
    test('should export all methods in cache object', () => {
      expect(cache.getOrExecute).toBe(getOrExecute);
      expect(cache.set).toBe(set);
      expect(cache.get).toBe(get);
      expect(cache.delete).toBe(deleteCache);
      expect(cache.clear).toBe(clear);
      expect(cache.getStats).toBe(getStats);
      expect(cache.cleanup).toBe(cleanup);
      expect(cache.startCleanupInterval).toBe(startCleanupInterval);
      expect(cache.stopCleanupInterval).toBe(stopCleanupInterval);
    });
  });
});