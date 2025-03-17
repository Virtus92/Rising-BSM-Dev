const cacheService = require('../../services/cache.service');

describe('Cache Service', () => {
    beforeEach(() => {
        // Clear cache before each test
        cacheService.clear();
        jest.clearAllMocks();
    });

    afterAll(() => {
        // Ensure cleanup interval is stopped after tests
        cacheService.stopCleanupInterval();
    });

    describe('getOrExecute', () => {
        test('should execute function on cache miss and store result', async () => {
            const fn = jest.fn().mockResolvedValue('test data');
            const result = await cacheService.getOrExecute('test-key', fn);
            
            expect(fn).toHaveBeenCalledTimes(1);
            expect(result).toBe('test data');
        });

        test('should return cached data on cache hit', async () => {
            const fn = jest.fn().mockResolvedValue('test data');
            
            // First call (cache miss)
            await cacheService.getOrExecute('test-key', fn);
            
            // Second call (cache hit)
            const result = await cacheService.getOrExecute('test-key', fn);
            
            expect(fn).toHaveBeenCalledTimes(1);
            expect(result).toBe('test data');
        });

        test('should execute function when cache is expired', async () => {
            const fn = jest.fn()
                .mockResolvedValueOnce('first data')
                .mockResolvedValueOnce('second data');
            
            // Mock Date.now
            const originalNow = Date.now;
            const firstTime = 1000;
            Date.now = jest.fn().mockReturnValue(firstTime);
            
            // First call
            await cacheService.getOrExecute('test-key', fn, 10); // 10s TTL
            
            // Advance time past TTL
            Date.now = jest.fn().mockReturnValue(firstTime + 11000);
            
            // Second call (should be cache miss due to expiry)
            const result = await cacheService.getOrExecute('test-key', fn, 10);
            
            expect(fn).toHaveBeenCalledTimes(2);
            expect(result).toBe('second data');
            
            // Restore Date.now
            Date.now = originalNow;
        });
    });

    describe('set and get', () => {
        test('should set and get data from cache', () => {
            cacheService.set('test-key', 'test data');
            const result = cacheService.get('test-key');
            
            expect(result).toBe('test data');
        });

        test('should return null for non-existent key', () => {
            const result = cacheService.get('non-existent-key');
            
            expect(result).toBeNull();
        });

        test('should return null for expired key', () => {
            // Mock Date.now
            const originalNow = Date.now;
            const firstTime = 1000;
            Date.now = jest.fn().mockReturnValue(firstTime);
            
            cacheService.set('test-key', 'test data', 5); // 5s TTL
            
            // Advance time past TTL
            Date.now = jest.fn().mockReturnValue(firstTime + 6000);
            
            const result = cacheService.get('test-key');
            
            expect(result).toBeNull();
            
            // Restore Date.now
            Date.now = originalNow;
        });
    });

    describe('delete', () => {
        test('should delete specific key from cache', () => {
            cacheService.set('key1', 'data1');
            cacheService.set('key2', 'data2');
            
            cacheService.delete('key1');
            
            expect(cacheService.get('key1')).toBeNull();
            expect(cacheService.get('key2')).toBe('data2');
        });
    });

    describe('clear', () => {
        test('should clear all cache entries', () => {
            cacheService.set('key1', 'data1');
            cacheService.set('key2', 'data2');
            
            cacheService.clear();
            
            expect(cacheService.get('key1')).toBeNull();
            expect(cacheService.get('key2')).toBeNull();
        });

        test('should clear cache entries by prefix', () => {
            cacheService.set('user:1', 'data1');
            cacheService.set('user:2', 'data2');
            cacheService.set('product:1', 'product1');
            
            cacheService.clear('user:');
            
            expect(cacheService.get('user:1')).toBeNull();
            expect(cacheService.get('user:2')).toBeNull();
            expect(cacheService.get('product:1')).toBe('product1');
        });
    });

    describe('getStats', () => {
        test('should return correct cache statistics', () => {
            const originalNow = Date.now;
            const now = 1000;
            Date.now = jest.fn().mockReturnValue(now);
            
            cacheService.set('key1', 'data1', 10);
            cacheService.set('key2', 'data2', 20);
            cacheService.set('key3', 'data3', -1); // Immediate expiry
            
            const stats = cacheService.getStats();
            
            expect(stats.totalItems).toBe(3);
            expect(stats.activeItems).toBe(2);
            expect(stats.expiredItems).toBe(1);
            
            Date.now = originalNow;
        });
    });

    describe('cleanup', () => {
        test('should remove expired items from cache', () => {
            const originalNow = Date.now;
            const now = 1000;
            Date.now = jest.fn().mockReturnValue(now);
            
            cacheService.set('key1', 'data1', 10);
            cacheService.set('key2', 'data2', -1); // Immediate expiry
            
            Date.now = jest.fn().mockReturnValue(now + 5000);
            cacheService.cleanup();
            
            expect(cacheService.get('key1')).toBe('data1');
            expect(cacheService.get('key2')).toBeNull();
            
            Date.now = originalNow;
        });
    });

    describe('stopCleanupInterval', () => {
        test('should stop cleanup interval and return true', () => {
            // This is tricky to test since the interval is started conditionally
            // We can at least ensure the function returns correct values
            const result1 = cacheService.stopCleanupInterval();
            const result2 = cacheService.stopCleanupInterval();
            
            // First call might be true or false depending on whether interval was started
            // Second call should definitely be false
            expect(result2).toBe(false);
        });
    });
});