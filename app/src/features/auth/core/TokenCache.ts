'use client';

/**
 * TokenCache.ts
 * 
 * Implements a centralized cache for authentication tokens to reduce
 * the number of API calls to the token endpoint.
 */

import { getLogger } from '@/core/logging';

const logger = getLogger();

// Token cache structure
interface CachedToken {
  token: string;
  expiresAt: number;
  timestamp: number;
}

// Single global instance to avoid redundant caching
let instance: TokenCache | null = null;

/**
 * TokenCache - Manages caching of auth tokens to reduce API calls
 */
export class TokenCache {
  // In-memory cache storage
  private tokenCache: CachedToken | null = null;
  // Throttle timeframe in milliseconds (default 2 seconds)
  private throttleMs: number = 2000;
  // Last request timestamp
  private lastRequestTime: number = 0;
  
  /**
   * Gets the singleton instance of TokenCache
   */
  public static getInstance(): TokenCache {
    if (!instance) {
      instance = new TokenCache();
    }
    return instance;
  }
  
  /**
   * Set throttle time for token requests
   * 
   * @param ms - Throttle time in milliseconds
   */
  public setThrottleTime(ms: number): void {
    if (ms > 0) {
      this.throttleMs = ms;
    }
  }
  
  /**
   * Stores a token in the cache
   * 
   * @param token - Token to cache
   * @param expiresAt - Expiration time in milliseconds since epoch
   */
  public cacheToken(token: string, expiresAt: number): void {
    if (!token || !expiresAt) {
      return;
    }
    
    this.tokenCache = {
      token,
      expiresAt,
      timestamp: Date.now()
    };
    
    logger.debug('Token cached successfully', {
      expiresIn: Math.round((expiresAt - Date.now()) / 1000) + 's'
    });
  }
  
  /**
   * Gets a token from the cache if it's valid
   * 
   * @returns Cached token or null if not available/valid
   */
  public getCachedToken(): string | null {
    // Check if we have a cached token
    if (!this.tokenCache) {
      logger.debug('No token in cache');
      return null;
    }
    
    const now = Date.now();
    
    // Check if token is expired
    if (now >= this.tokenCache.expiresAt) {
      logger.debug('Cached token is expired, removing from cache');
      this.tokenCache = null;
      return null;
    }
    
    // Return valid token
    return this.tokenCache.token;
  }
  
  /**
   * Checks if token request should be throttled
   * 
   * @returns Boolean indicating if request should be throttled
   */
  public shouldThrottleRequest(): boolean {
    const now = Date.now();
    
    // Check if we need to throttle
    if (now - this.lastRequestTime < this.throttleMs) {
      logger.debug('Token request throttled', {
        timeSinceLastRequest: now - this.lastRequestTime,
        throttleMs: this.throttleMs
      });
      return true;
    }
    
    // Update last request time
    this.lastRequestTime = now;
    return false;
  }
  
  /**
   * Clears the token cache
   */
  public clearCache(): void {
    this.tokenCache = null;
    logger.debug('Token cache cleared');
  }
}

export default TokenCache.getInstance();