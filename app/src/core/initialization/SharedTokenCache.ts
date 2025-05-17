'use client';

/**
 * SharedTokenCache.ts
 * 
 * A centralized token caching mechanism to prevent redundant token fetches
 * and ensure consistent token state across the application.
 */

import { getLogger } from '@/core/logging';

const logger = getLogger();

// Storage keys with namespacing for better organization
const STORAGE_KEYS = {
  TOKEN: 'auth.token.cache',
  EXPIRY: 'auth.token.expiry',
  TIMESTAMP: 'auth.token.timestamp',
};

// Token info type
export interface TokenInfo {
  token: string | null;
  expiresAt: Date | null;
  isExpired: boolean;
  remainingTimeMs?: number;
}

export class SharedTokenCache {
  // Memory cache - simple storage with no workarounds
  private static token: string | null = null;
  private static expiresAt: number = 0;
  private static hasBeenInitialized: boolean = false;
  
  /**
   * Initialize the cache from storage
   */
  public static initialize(): boolean {
    try {
      if (typeof window === 'undefined' || this.hasBeenInitialized) return false;
      
      // Mark as initialized to prevent multiple attempts
      this.hasBeenInitialized = true;
      
      // Look for token in session storage
      const storedToken = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedExpiry = sessionStorage.getItem(STORAGE_KEYS.EXPIRY);
      
      if (storedToken && storedExpiry) {
        const expiry = parseInt(storedExpiry, 10);
        const now = Date.now();
        
        // Check if token is still valid
        if (now < expiry) {
          this.token = storedToken;
          this.expiresAt = expiry;
          
          logger.debug('Restored token from storage', {
            expiresIn: Math.round((expiry - now) / 1000) + 's'
          });
          
          return true;
        } else {
          // Clear expired token
          this.clearStorage();
          logger.debug('Cleared expired token from storage');
        }
      }
      
      return false;
    } catch (error) {
      logger.error('Error initializing token cache:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }
  
  /**
   * Set token in cache with proper expiration handling
   */
  public static setToken(token: string, expiresInSeconds: number = 3600): boolean {
    try {
      // Validate input
      if (!token || typeof token !== 'string') {
        logger.warn('Invalid token provided to cache');
        return false;
      }
      
      if (expiresInSeconds <= 0) {
        logger.warn('Invalid expiration time provided to cache');
        return false;
      }
      
      const now = Date.now();
      const expiry = now + (expiresInSeconds * 1000);
      
      // Update memory cache
      this.token = token;
      this.expiresAt = expiry;
      
      // Store in sessionStorage on client-side
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
          sessionStorage.setItem(STORAGE_KEYS.EXPIRY, expiry.toString());
          sessionStorage.setItem(STORAGE_KEYS.TIMESTAMP, now.toString());
          
          logger.debug('Token cached successfully', {
            expiresIn: Math.round(expiresInSeconds) + 's',
            tokenLength: token.length
          });
        } catch (storageError) {
          logger.warn('Error storing token in session storage:', {
            error: storageError instanceof Error ? storageError.message : String(storageError)
          });
          // Continue since memory cache still works
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error setting token in cache:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }
  
  /**
   * Get token from cache with validation
   */
  public static getToken(): string | null {
    try {
      const now = Date.now();
      
      // Check if token exists and is valid
      if (!this.token) {
        // Try to restore from storage if we haven't initialized yet
        if (!this.hasBeenInitialized) {
          this.initialize();
        }
        
        // If still no token, return null
        if (!this.token) {
          return null;
        }
      }
      
      // Simple expiration check - no margin workarounds
      if (now >= this.expiresAt) {
        logger.debug('Token has expired', {
          expiresAt: new Date(this.expiresAt).toISOString(),
          now: new Date(now).toISOString()
        });
        
        // Clear expired token
        this.clearToken();
        return null;
      }
      
      return this.token;
    } catch (error) {
      logger.error('Error getting token from cache:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }
  
  /**
   * Get detailed token information
   */
  public static getTokenInfo(): TokenInfo {
    try {
      // Get token first to ensure it's valid
      const token = this.getToken();
      const now = Date.now();
      
      if (!token) {
        return {
          token: null,
          expiresAt: null,
          isExpired: true
        };
      }
      
      // Calculate expiration details
      const expiresAt = new Date(this.expiresAt);
      const isExpired = now >= this.expiresAt;
      const remainingTimeMs = isExpired ? 0 : this.expiresAt - now;
      
      return {
        token,
        expiresAt,
        isExpired,
        remainingTimeMs
      };
    } catch (error) {
      logger.error('Error getting token info:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        token: null,
        expiresAt: null,
        isExpired: true
      };
    }
  }
  
  /**
   * Check if cache has a valid token
   */
  public static hasValidToken(): boolean {
    try {
      // First ensure we've checked storage if needed
      if (!this.hasBeenInitialized) {
        this.initialize();
      }
      
      const now = Date.now();
      return !!this.token && now < this.expiresAt;
    } catch (error) {
      logger.error('Error checking token validity:', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
  
  /**
   * Clear token from cache
   */
  public static clearToken(): void {
    try {
      // Clear memory cache
      this.token = null;
      this.expiresAt = 0;
      
      // Clear storage
      this.clearStorage();
      
      logger.debug('Token cache cleared');
    } catch (error) {
      logger.error('Error clearing token cache:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Clear token from storage
   */
  private static clearStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.EXPIRY);
        sessionStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
      } catch (error) {
        // Ignore storage errors
      }
    }
  }
}

// Export
export default SharedTokenCache;