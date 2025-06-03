import 'server-only';

import { getLogger } from '@/core/logging';
import { AppError } from '@/core/errors';

const logger = getLogger();

/**
 * Rate limiting configuration for API keys
 */
export interface ApiKeyRateLimit {
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  
  /**
   * Maximum requests per window
   */
  maxRequests: number;
  
  /**
   * API key ID for tracking
   */
  keyId: number;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /**
   * Whether the rate limit is exceeded
   */
  exceeded: boolean;
  
  /**
   * Remaining requests in current window
   */
  remainingRequests: number;
  
  /**
   * Time when the current window resets
   */
  resetTime: Date;
  
  /**
   * Current request count in window
   */
  currentRequests: number;
  
  /**
   * Window start time
   */
  windowStart: Date;
}

/**
 * Rate limit storage interface
 */
interface RateLimitStorage {
  requests: number[];
  windowStart: number;
}

/**
 * API Key Rate Limiter
 * 
 * Implements sliding window rate limiting for API keys.
 * Uses in-memory storage with automatic cleanup.
 */
export class ApiKeyRateLimiter {
  private static instance: ApiKeyRateLimiter;
  private storage = new Map<string, RateLimitStorage>();
  private cleanupInterval: NodeJS.Timeout;
  
  /**
   * Default rate limits by API key type
   */
  private static readonly DEFAULT_RATE_LIMITS = {
    admin: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 1000    // 1000 requests per minute
    },
    standard: {
      windowMs: 60 * 1000, // 1 minute  
      maxRequests: 100     // 100 requests per minute
    }
  };
  
  /**
   * Cleanup interval in milliseconds
   */
  private static readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, ApiKeyRateLimiter.CLEANUP_INTERVAL_MS);
    
    logger.debug('ApiKeyRateLimiter initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ApiKeyRateLimiter {
    if (!ApiKeyRateLimiter.instance) {
      ApiKeyRateLimiter.instance = new ApiKeyRateLimiter();
    }
    return ApiKeyRateLimiter.instance;
  }

  /**
   * Check if API key has exceeded rate limits
   * 
   * @param apiKeyId - API key ID
   * @param config - Rate limit configuration
   * @returns Rate limit result
   */
  public async checkRateLimit(
    apiKeyId: number,
    config: ApiKeyRateLimit
  ): Promise<RateLimitResult> {
    try {
      const key = `apikey:${apiKeyId}`;
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Get or create storage for this key
      let storage = this.storage.get(key);
      if (!storage) {
        storage = {
          requests: [],
          windowStart: now
        };
        this.storage.set(key, storage);
      }

      // Clean old requests outside the window
      storage.requests = storage.requests.filter(requestTime => requestTime > windowStart);

      // Check if rate limit exceeded
      const currentRequests = storage.requests.length;
      const exceeded = currentRequests >= config.maxRequests;

      // If not exceeded, record this request
      if (!exceeded) {
        storage.requests.push(now);
      }

      // Calculate reset time (end of current window)
      const oldestRequest = storage.requests[0] || now;
      const resetTime = new Date(oldestRequest + config.windowMs);

      const result: RateLimitResult = {
        exceeded,
        remainingRequests: Math.max(0, config.maxRequests - currentRequests - (exceeded ? 0 : 1)),
        resetTime,
        currentRequests: currentRequests + (exceeded ? 0 : 1),
        windowStart: new Date(windowStart)
      };

      // Log rate limiting events
      if (exceeded) {
        logger.warn('API key rate limit exceeded', {
          apiKeyId,
          currentRequests: result.currentRequests,
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
          resetTime: result.resetTime
        });
      } else {
        logger.debug('API key rate limit check passed', {
          apiKeyId,
          currentRequests: result.currentRequests,
          maxRequests: config.maxRequests,
          remainingRequests: result.remainingRequests
        });
      }

      return result;
    } catch (error) {
      logger.error('Error checking API key rate limit', { error, apiKeyId, config });
      
      // On error, allow the request but log the issue
      return {
        exceeded: false,
        remainingRequests: config.maxRequests,
        resetTime: new Date(Date.now() + config.windowMs),
        currentRequests: 0,
        windowStart: new Date(Date.now() - config.windowMs)
      };
    }
  }

  /**
   * Get default rate limit configuration for API key type
   * 
   * @param keyType - API key type ('admin' or 'standard')
   * @param customLimits - Optional custom limits to override defaults
   * @returns Rate limit configuration
   */
  public getDefaultRateLimit(
    keyType: 'admin' | 'standard',
    customLimits?: Partial<{ windowMs: number; maxRequests: number }>
  ): Omit<ApiKeyRateLimit, 'keyId'> {
    const defaults = ApiKeyRateLimiter.DEFAULT_RATE_LIMITS[keyType];
    
    return {
      windowMs: customLimits?.windowMs || defaults.windowMs,
      maxRequests: customLimits?.maxRequests || defaults.maxRequests
    };
  }

  /**
   * Reset rate limit for a specific API key
   * 
   * @param apiKeyId - API key ID to reset
   */
  public resetRateLimit(apiKeyId: number): void {
    const key = `apikey:${apiKeyId}`;
    this.storage.delete(key);
    
    logger.info('API key rate limit reset', { apiKeyId });
  }

  /**
   * Get current rate limit status for an API key
   * 
   * @param apiKeyId - API key ID
   * @param config - Rate limit configuration
   * @returns Current status without incrementing counter
   */
  public getRateLimitStatus(
    apiKeyId: number,
    config: ApiKeyRateLimit
  ): Omit<RateLimitResult, 'exceeded'> & { wouldExceed: boolean } {
    const key = `apikey:${apiKeyId}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const storage = this.storage.get(key);
    if (!storage) {
      return {
        wouldExceed: false,
        remainingRequests: config.maxRequests - 1,
        resetTime: new Date(now + config.windowMs),
        currentRequests: 0,
        windowStart: new Date(windowStart)
      };
    }

    // Filter requests in current window
    const validRequests = storage.requests.filter(requestTime => requestTime > windowStart);
    const currentRequests = validRequests.length;
    const wouldExceed = currentRequests >= config.maxRequests;

    const oldestRequest = validRequests[0] || now;
    const resetTime = new Date(oldestRequest + config.windowMs);

    return {
      wouldExceed,
      remainingRequests: Math.max(0, config.maxRequests - currentRequests - 1),
      resetTime,
      currentRequests,
      windowStart: new Date(windowStart)
    };
  }

  /**
   * Get rate limit statistics for monitoring
   * 
   * @returns Statistics about current rate limiting state
   */
  public getStatistics(): {
    totalTrackedKeys: number;
    totalRequests: number;
    oldestWindow: Date | null;
    newestWindow: Date | null;
  } {
    let totalRequests = 0;
    let oldestWindow: Date | null = null;
    let newestWindow: Date | null = null;

    for (const storage of this.storage.values()) {
      totalRequests += storage.requests.length;
      
      if (storage.requests.length > 0) {
        const oldest = new Date(storage.requests[0]);
        const newest = new Date(storage.requests[storage.requests.length - 1]);
        
        if (!oldestWindow || oldest < oldestWindow) {
          oldestWindow = oldest;
        }
        
        if (!newestWindow || newest > newestWindow) {
          newestWindow = newest;
        }
      }
    }

    return {
      totalTrackedKeys: this.storage.size,
      totalRequests,
      oldestWindow,
      newestWindow
    };
  }

  /**
   * Cleanup old entries from storage
   * 
   * @private
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    let cleanedKeys = 0;
    let cleanedRequests = 0;

    for (const [key, storage] of this.storage.entries()) {
      // Remove requests older than 24 hours
      const originalCount = storage.requests.length;
      storage.requests = storage.requests.filter(requestTime => (now - requestTime) < maxAge);
      cleanedRequests += originalCount - storage.requests.length;

      // Remove keys with no recent requests
      if (storage.requests.length === 0 && (now - storage.windowStart) > maxAge) {
        this.storage.delete(key);
        cleanedKeys++;
      }
    }

    if (cleanedKeys > 0 || cleanedRequests > 0) {
      logger.debug('Rate limiter cleanup completed', {
        cleanedKeys,
        cleanedRequests,
        remainingKeys: this.storage.size
      });
    }
  }

  /**
   * Shutdown the rate limiter and cleanup resources
   */
  public shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.storage.clear();
    logger.info('ApiKeyRateLimiter shutdown completed');
  }
}

/**
 * Rate limiter middleware for API routes
 * 
 * @param apiKeyId - API key ID
 * @param keyType - API key type for default limits
 * @param customLimits - Optional custom limits
 * @returns Rate limit result
 */
export async function checkApiKeyRateLimit(
  apiKeyId: number,
  keyType: 'admin' | 'standard',
  customLimits?: Partial<{ windowMs: number; maxRequests: number }>
): Promise<RateLimitResult> {
  const rateLimiter = ApiKeyRateLimiter.getInstance();
  const limits = rateLimiter.getDefaultRateLimit(keyType, customLimits);
  
  return rateLimiter.checkRateLimit(apiKeyId, {
    ...limits,
    keyId: apiKeyId
  });
}

/**
 * Express-style middleware function for rate limiting
 * 
 * @param options - Rate limiting options
 * @returns Middleware function
 */
export function createApiKeyRateLimitMiddleware(options: {
  adminLimits?: Partial<{ windowMs: number; maxRequests: number }>;
  standardLimits?: Partial<{ windowMs: number; maxRequests: number }>;
  onLimitReached?: (apiKeyId: number, result: RateLimitResult) => void;
}) {
  return async function rateLimitMiddleware(
    apiKeyId: number,
    keyType: 'admin' | 'standard'
  ): Promise<{ passed: boolean; result: RateLimitResult }> {
    const limits = keyType === 'admin' ? options.adminLimits : options.standardLimits;
    const result = await checkApiKeyRateLimit(apiKeyId, keyType, limits);
    
    if (result.exceeded && options.onLimitReached) {
      options.onLimitReached(apiKeyId, result);
    }
    
    return {
      passed: !result.exceeded,
      result
    };
  };
}

/**
 * Get rate limiter instance for manual usage
 */
export function getRateLimiter(): ApiKeyRateLimiter {
  return ApiKeyRateLimiter.getInstance();
}
