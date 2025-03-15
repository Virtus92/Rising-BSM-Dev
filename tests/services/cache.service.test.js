const cacheService = require('../../services/cache.service');

describe('Cache Service', () => {
  beforeEach(() => {
    // Clear cache before each test
    cacheService.clear();
    
    // Mock Date.now to control time
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getOrExecute', () => {
    test('should execute function on cache miss and store result', async () => {
      // Arrange
      const mockFn = jest.fn().mockResolvedValue({ data: 'test' });
      
      // Act
      const result = await cacheService.getOrExecute('test-key', mockFn);
      
      // Assert
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: 'test' });
      
      // Should be stored in cache
      expect(cacheService.get('test-key')).toEqual({ data: 'test' });
    });
    
    test('should return cached result on cache hit', async () => {
      // Arrange
      const mockFn = jest.fn().mockResolvedValue({ data: 'test' });
      cacheService.set('test-key', { data: 'cached' });
      
      // Act
      const result = await cacheService.getOrExecute('test-key', mockFn);
      
      // Assert
      expect(mockFn).not.toHaveBeenCalled();
      expect(result).toEqual({ data: 'cached' });
    });
    
    test('should execute function when cache is expired', async () => {
      // Arrange
      const mockFn = jest.fn().mockResolvedValue({ data: 'fresh' });
      cacheService.set('test-key', { data: 'expired' }, 1); // 1 second TTL
      
      // Move time forward
      Date.now.mockReturnValue(3000); // 2 seconds later
      
      // Act
      const result = await cacheService.getOrExecute('test-key', mockFn);
      
      // Assert
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: 'fresh' });
    });
    
    test('should use provided TTL', async () => {
      // Arrange
      const mockFn = jest.fn().mockResolvedValue({ data: 'test' });
      
      // Act
      await cacheService.getOrExecute('test-key', mockFn, 600);
      
      // Assert - check that entry was created with correct TTL
      expect(cacheService.get('test-key')).not.toBeNull();
      expect(cacheService.getStats().totalItems).toBe(1);
    });
  });
  
  describe('set and get', () => {
    test('should set and get value from cache', () => {
      // Act
      cacheService.set('test-key', { data: 'test' });
      const result = cacheService.get('test-key');
      
      // Assert
      expect(result).toEqual({ data: 'test' });
    });
    
    test('should return null for non-existent key', () => {
      // Act
      const result = cacheService.get('non-existent');
      
      // Assert
      expect(result).toBeNull();
    });
    
    test('should return null for expired entry', () => {
      // Arrange
      cacheService.set('test-key', { data: 'test' }, 1); // 1 second TTL
      
      // Move time forward
      Date.now.mockReturnValue(3000); // 2 seconds later
      
      // Act
      const result = cacheService.get('test-key');
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('delete', () => {
    test('should delete entry from cache', () => {
      // Arrange
      cacheService.set('test-key', { data: 'test' });
      expect(cacheService.get('test-key')).not.toBeNull();
      
      // Act
      cacheService.delete('test-key');
      
      // Assert
      expect(cacheService.get('test-key')).toBeNull();
    });
    
    test('should not affect other cache entries', () => {
      // Arrange
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      
      // Act
      cacheService.delete('key1');
      
      // Assert
      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key2')).toBe('value2');
    });
  });
  
  describe('clear', () => {
    test('should clear all entries from cache', () => {
      // Arrange
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('prefix-key', 'value3');
      
      // Act
      cacheService.clear();
      
      // Assert
      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key2')).toBeNull();
      expect(cacheService.get('prefix-key')).toBeNull();
      expect(cacheService.getStats().totalItems).toBe(0);
    });
    
    test('should clear only entries with specific prefix', () => {
      // Arrange
      cacheService.set('prefix-key1', 'value1');
      cacheService.set('prefix-key2', 'value2');
      cacheService.set('other-key', 'value3');
      
      // Act
      cacheService.clear('prefix-');
      
      // Assert
      expect(cacheService.get('prefix-key1')).toBeNull();
      expect(cacheService.get('prefix-key2')).toBeNull();
      expect(cacheService.get('other-key')).toBe('value3');
    });
  });
  
  describe('getStats', () => {
    test('should return correct stats', () => {
      // Arrange
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2', 1); // Short TTL
      
      // Act & Assert - all items active
      let stats = cacheService.getStats();
      expect(stats.totalItems).toBe(2);
      expect(stats.activeItems).toBe(2);
      expect(stats.expiredItems).toBe(0);
      
      // Move time forward to expire one item
      Date.now.mockReturnValue(3000); // 2 seconds later
      
      // Act & Assert - one item expired
      stats = cacheService.getStats();
      expect(stats.totalItems).toBe(2);
      expect(stats.activeItems).toBe(1);
      expect(stats.expiredItems).toBe(1);
    });
  });
  
  describe('cleanup', () => {
    test('should remove expired items', () => {
      // Arrange
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2', 1); // Will expire
      cacheService.set('key3', 'value3', 1); // Will expire
      
      // Move time forward
      Date.now.mockReturnValue(3000); // 2 seconds later
      
      // Act
      cacheService.cleanup();
      
      // Assert
      expect(cacheService.get('key1')).not.toBeNull(); // Still valid
      expect(cacheService.get('key2')).toBeNull(); // Removed by cleanup
      expect(cacheService.get('key3')).toBeNull(); // Removed by cleanup
      
      const stats = cacheService.getStats();
      expect(stats.totalItems).toBe(1); // Only key1 remains
    });
  });
  
  describe('memory management', () => {
    test('should enforce max items limit', () => {
      // Assuming cache service has a maxItems configuration
      const originalMaxItems = cacheService.maxItems;
      cacheService.maxItems = 3;
      
      // Add more items than the max
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('key3', 'value3');
      cacheService.set('key4', 'value4'); // This should evict the oldest entry
      
      // Assert
      expect(cacheService.get('key1')).toBeNull(); // Oldest item should be evicted
      expect(cacheService.get('key2')).toBe('value2');
      expect(cacheService.get('key3')).toBe('value3');
      expect(cacheService.get('key4')).toBe('value4');
      expect(cacheService.getStats().totalItems).toBe(3);
      
      // Restore the original maxItems value
      cacheService.maxItems = originalMaxItems;
    });
  });
});
