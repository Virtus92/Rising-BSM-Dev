/**
 * AuthRequestManager.ts
 * 
 * Centralized manager for authentication requests to reduce redundant API calls
 * and improve performance.
 */

import { getLogger } from '@/core/logging';

const logger = getLogger();

// Default timing configuration
const DEFAULT_CONFIG = {
  batchInterval: 100, // Batch requests in 100ms windows
  tokenThrottleTime: 2000, // Minimum time between token requests (2 seconds)
  cacheTime: 60000 // Cache tokens for 1 minute
};

// Token response format
interface TokenResponse {
  token: string;
  expiresAt: number;
  userId?: number;
}

// Queue item format
interface QueueItem {
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
  timestamp: number;
}

/**
 * AuthRequestManager - Efficiently manages authentication requests
 * 
 * Key features:
 * 1. Batches multiple token requests within a short time window
 * 2. Caches token responses for configurable durations
 * 3. Throttles excessive requests to prevent server overload
 * 4. Implements request queuing and timeouts
 */
class AuthRequestManager {
  private static instance: AuthRequestManager;
  
  // Configuration
  private config = { ...DEFAULT_CONFIG };
  
  // Token cache and queue
  private tokenCache: TokenResponse | null = null;
  private requestQueue: QueueItem[] = [];
  private processingQueue = false;
  private lastRequestTime = 0;
  private requestScheduled = false;
  
  /**
   * Get singleton instance
   */
  public static getInstance(): AuthRequestManager {
    if (!AuthRequestManager.instance) {
      AuthRequestManager.instance = new AuthRequestManager();
    }
    return AuthRequestManager.instance;
  }
  
  /**
   * Configure the request manager
   * 
   * @param config - Configuration options
   */
  public configure(config: Partial<typeof DEFAULT_CONFIG>): void {
    this.config = {
      ...this.config,
      ...config
    };
    
    logger.debug('AuthRequestManager configured', {
      batchInterval: this.config.batchInterval,
      tokenThrottleTime: this.config.tokenThrottleTime,
      cacheTime: this.config.cacheTime
    });
  }
  
  /**
   * Get authentication token efficiently
   * 
   * @returns Promise with token or null
   */
  public getToken(): Promise<string | null> {
    // Check cache first
    if (this.tokenCache) {
      const now = Date.now();
      
      // If cache is valid and not expired
      if (now < this.tokenCache.expiresAt) {
        logger.debug('Using cached token');
        return Promise.resolve(this.tokenCache.token);
      }
      
      // Clear expired cache
      this.tokenCache = null;
    }
    
    // Check if we should throttle
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.config.tokenThrottleTime) {
      logger.debug('Token request throttled', {
        timeSinceLastRequest,
        throttleTime: this.config.tokenThrottleTime
      });
      
      // Return null for throttled requests
      return Promise.resolve(null);
    }
    
    // Add request to queue
    return new Promise<string | null>((resolve, reject) => {
      this.requestQueue.push({
        resolve,
        reject,
        timestamp: now
      });
      
      // Schedule queue processing if not already scheduled
      if (!this.requestScheduled) {
        this.requestScheduled = true;
        setTimeout(() => this.processQueue(), this.config.batchInterval);
      }
    });
  }
  
  /**
   * Process queued token requests
   */
  private async processQueue(): Promise<void> {
    // Reset scheduling flag
    this.requestScheduled = false;
    
    // Check if already processing
    if (this.processingQueue || this.requestQueue.length === 0) {
      return;
    }
    
    this.processingQueue = true;
    this.lastRequestTime = Date.now();
    
    logger.debug('Processing token request queue', {
      queueLength: this.requestQueue.length
    });
    
    try {
      // Make a single API request for all queued requests
      const token = await this.fetchToken();
      
      // Create a copy of the queue
      const queueCopy = [...this.requestQueue];
      this.requestQueue = [];
      
      // Resolve all requests with the token
      queueCopy.forEach(item => {
        item.resolve(token);
      });
      
      logger.debug('Token request queue processed successfully', {
        processedCount: queueCopy.length,
        hasToken: !!token
      });
    } catch (error) {
      logger.error('Error processing token request queue', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        queueLength: this.requestQueue.length
      });
      
      // Reject all requests with the error
      const queueCopy = [...this.requestQueue];
      this.requestQueue = [];
      
      queueCopy.forEach(item => {
        item.reject(error);
      });
    } finally {
      this.processingQueue = false;
      
      // If there are more requests, schedule another processing
      if (this.requestQueue.length > 0) {
        this.requestScheduled = true;
        setTimeout(() => this.processQueue(), this.config.batchInterval);
      }
    }
  }
  
  /**
   * Fetch authentication token from server
   * 
   * @returns Token or null
   */
  private async fetchToken(): Promise<string | null> {
    try {
      // Make API request with appropriate headers
      const response = await fetch('/api/auth/token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=5',
          'X-Request-Source': 'auth-request-manager',
          'X-Request-ID': crypto.randomUUID().substring(0, 8)
        }
      });
      
      if (!response.ok) {
        logger.warn('Failed to fetch token', {
          status: response.status,
          statusText: response.statusText
        });
        return null;
      }
      
      const data = await response.json();
      
      // Extract token from response
      const token = data.data?.token;
      
      if (!token) {
        logger.debug('No token in response');
        return null;
      }
      
      // Get expiration time
      const expiresIn = data.data?.expiresIn || 3600;
      const expiresAt = Date.now() + (expiresIn * 1000);
      
      // Cache token
      this.tokenCache = {
        token,
        expiresAt,
        userId: data.data?.userId
      };
      
      logger.debug('Token fetched and cached', {
        expiresIn: `${expiresIn}s`,
        cacheTime: `${this.config.cacheTime / 1000}s`
      });
      
      return token;
    } catch (error) {
      logger.error('Error fetching token', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return null;
    }
  }
  
  /**
   * Clear token cache
   */
  public clearCache(): void {
    this.tokenCache = null;
    logger.debug('Token cache cleared');
  }
}

export default AuthRequestManager.getInstance();
