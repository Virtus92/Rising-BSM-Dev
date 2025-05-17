'use client';

/**
 * TokenManager.ts
 * 
 * Responsible for token operations - getting, validating, refreshing, and scheduling refreshes.
 * Internal implementation used by AuthService, not exposed directly to other components.
 */

import { jwtDecode } from 'jwt-decode';
import { getLogger } from '@/core/logging';
import { EventEmitter } from './EventEmitter';

// Logger instance
const logger = getLogger();

// Token-related types
interface DecodedToken {
  sub: string | number;
  exp: number;
  iat: number;
  name?: string;
  email?: string;
  role?: string;
}

interface TokenInfo {
  token: string | null;
  expiresAt: Date | null;
  isExpired: boolean;
}

// Constants
const TOKEN_EXPIRY_MARGIN_MS = 5 * 60 * 1000; // 5 minutes before expiry
const REFRESH_COOLDOWN_MS = 5000; // Minimum time between refresh attempts
const MAX_REFRESH_ATTEMPTS = 3; // Maximum number of refresh attempts

/**
 * TokenManager class
 * 
 * Internal implementation for token management
 */
export class TokenManager {
  // Token state
  private tokenExpiryTime: number | null = null;
  private refreshTimeoutId: NodeJS.Timeout | null = null;
  private refreshScheduled = false;
  private events: EventEmitter;
  
  // Refresh state management
  private refreshInProgress = false;
  private refreshPromise: Promise<boolean> | null = null;
  private refreshAttempts = 0;
  private lastRefreshTime = 0;
  
  constructor() {
    this.events = new EventEmitter();
  }
  
  /**
   * Initialize the token manager
   */
  async initialize(): Promise<void> {
    try {
      logger.debug('Initializing TokenManager');
      
      // Validate token and set up refresh timer if valid
      const isValid = await this.validateToken();
      
      if (isValid) {
        logger.debug('Token is valid, setting up refresh timer');
        this.setupRefreshTimer();
      }
    } catch (error) {
      logger.error('Error initializing TokenManager:', error as Error);
    }
  }
  
  /**
   * Get the current access token
   */
  async getToken(): Promise<string | null> {
    try {
      // Add timeout to prevent hanging when getting token
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 3000);
      
      try {
        // For HTTP-only cookies, we need to check with the server
        const response = await fetch('/api/auth/token', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'X-Request-Time': Date.now().toString()
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          logger.debug('Failed to get token from server:', { status: response.status });
          return null;
        }
        
        try {
          const data = await response.json();
          return data.token || null;
        } catch (parseError) {
          logger.error('Error parsing token response:', parseError as Error);
          return null;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // If this was an abort error, it was just a timeout
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          logger.warn('Token fetch timed out');
          return null;
        }
        
        throw fetchError;
      }
    } catch (error) {
      logger.error('Error getting token:', error as Error);
      return null;
    }
  }
  
  /**
   * Get token information including expiration
   */
  async getTokenInfo(): Promise<TokenInfo> {
    try {
      const token = await this.getToken();
      
      if (!token) {
        logger.debug('No token available for getTokenInfo');
        return {
          token: null,
          expiresAt: null,
          isExpired: true
        };
      }
      
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const expiresAt = new Date(decoded.exp * 1000);
        const isExpired = Date.now() >= expiresAt.getTime();
        
        return {
          token,
          expiresAt,
          isExpired
        };
      } catch (decodeError) {
        logger.error('Error decoding token in getTokenInfo:', decodeError as Error);
        return {
          token,
          expiresAt: null,
          isExpired: true
        };
      }
    } catch (error) {
      logger.error('Error in getTokenInfo:', error as Error);
      return {
        token: null,
        expiresAt: null,
        isExpired: true
      };
    }
  }
  
  /**
   * Validates the current token with the server
   */
  async validateToken(): Promise<boolean> {
    try {
      // Add timeout to prevent hanging validation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000);
      
      try {
        const response = await fetch('/api/auth/validate', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'X-Request-Time': Date.now().toString()
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          logger.debug('Token validation failed with status:', { status: response.status });
          return false;
        }
        
        try {
          const data = await response.json();
          return data.success === true;
        } catch (parseError) {
          logger.error('Error parsing validation response:', parseError as Error);
          return false;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // If this was an abort error, it was just a timeout
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          logger.warn('Token validation timed out');
          return false;
        }
        
        throw fetchError;
      }
    } catch (error) {
      logger.error('Token validation error:', error as Error);
      return false;
    }
  }
  
  /**
   * Refresh the access token
   */
  async refreshToken(): Promise<boolean> {
    // If a refresh is already in progress, wait for the existing promise
    if (this.refreshInProgress && this.refreshPromise) {
      logger.debug('Token refresh already in progress, waiting for completion');
      return this.refreshPromise;
    }
    
    // Check cooldown period
    const now = Date.now();
    const timeSinceLastRefresh = now - this.lastRefreshTime;
    
    if (timeSinceLastRefresh < REFRESH_COOLDOWN_MS) {
      logger.debug(`Token refresh attempted too soon (${Math.round(timeSinceLastRefresh/1000)}s since last refresh)`);
      
      // If token was recently refreshed, just validate it
      const isValid = await this.validateToken();
      if (isValid) {
        return true;
      }
    }
    
    // Check max refresh attempts
    if (this.refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      // Reset counter if it's been a while since our last attempt
      if (timeSinceLastRefresh > 60000) { // 1 minute
        this.refreshAttempts = 0;
      } else {
        logger.warn(`Maximum refresh attempts (${MAX_REFRESH_ATTEMPTS}) reached`);
        return false;
      }
    }
    
    // Lock refresh state and create a shared promise
    this.refreshInProgress = true;
    this.refreshAttempts++;
    
    // Create a promise for all callers
    this.refreshPromise = this.performTokenRefresh();
    
    try {
      return await this.refreshPromise;
    } finally {
      // Always clean up
      this.refreshInProgress = false;
      this.refreshPromise = null;
    }
  }
  
  /**
   * Actual token refresh implementation
   */
  private async performTokenRefresh(): Promise<boolean> {
    try {
      logger.debug('Performing access token refresh');
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Request-Time': Date.now().toString()
        }
      });
      
      // Update tracking state
      this.lastRefreshTime = Date.now();
      
      if (!response.ok) {
        logger.error('Token refresh failed:', { status: response.status });
        return false;
      }
      
      const data = await response.json();
      
      if (!data.success) {
        logger.error('Token refresh failed:', data.message);
        return false;
      }
      
      // Reset refresh attempts on success
      this.refreshAttempts = 0;
      
      // Schedule the next token refresh
      this.setupRefreshTimer();
      
      // Emit token refreshed event
      this.events.emit('token_refreshed', { timestamp: Date.now() });
      
      return true;
    } catch (error) {
      logger.error('Token refresh error:', error as Error);
      return false;
    }
  }
  
  /**
   * Sets up a timer to refresh the token before it expires
   */
  async setupRefreshTimer(): Promise<void> {
    // Avoid scheduling multiple refresh timers
    if (this.refreshScheduled) {
      logger.debug('Refresh already scheduled, skipping duplicate setup');
      return;
    }
    
    // Clear any existing refresh timer
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    
    try {
      // Mark as scheduled to prevent race conditions
      this.refreshScheduled = true;
      
      // Get token info
      const tokenInfo = await this.getTokenInfo();
      
      // If token is missing or already expired, don't set a timer
      if (!tokenInfo.token || !tokenInfo.expiresAt) {
        logger.debug('No valid token available, cannot schedule refresh');
        this.tokenExpiryTime = null;
        this.refreshScheduled = false;
        return;
      }
      
      const expiresAt = tokenInfo.expiresAt.getTime();
      const now = Date.now();
      
      // Store token expiry time
      this.tokenExpiryTime = expiresAt;
      
      // Calculate when to refresh (5 minutes before expiry)
      const refreshTime = expiresAt - now - TOKEN_EXPIRY_MARGIN_MS;
      
      // Only schedule if we need to refresh in the future
      if (refreshTime <= 0) {
        // Token is already expiring or about to expire
        logger.debug('Token is expiring soon or already expired, notifying');
        this.events.emit('token_expiring', {});
        this.refreshScheduled = false;
        return;
      }
      
      // Add small jitter (0-30 seconds) to prevent all clients refreshing at once
      const jitter = Math.floor(Math.random() * 30000);
      const finalRefreshTime = refreshTime + jitter;
      
      // Schedule the refresh
      this.refreshTimeoutId = setTimeout(() => {
        this.refreshScheduled = false;
        this.events.emit('token_expiring', {});
      }, finalRefreshTime) as unknown as NodeJS.Timeout;
      
      logger.debug('Token refresh scheduled', { 
        expiresAt: tokenInfo.expiresAt.toISOString(),
        refreshIn: Math.ceil(refreshTime / 1000 / 60) + ' minutes'
      });
    } catch (error) {
      logger.error('Error setting up refresh timer:', error as Error);
      this.tokenExpiryTime = null;
      this.refreshScheduled = false;
    }
  }
  
  /**
   * Clear tokens (for logout)
   */
  clearTokens(): void {
    // Clear the refresh timer
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    
    // Reset state
    this.refreshScheduled = false;
    this.refreshInProgress = false;
    this.refreshPromise = null;
    this.refreshAttempts = 0;
    this.tokenExpiryTime = null;
  }
  
  /**
   * Register token expiring callback
   */
  onTokenExpiring(callback: () => void): () => void {
    return this.events.on('token_expiring', callback);
  }
  
  /**
   * Register token refreshed callback
   */
  onTokenRefreshed(callback: () => void): () => void {
    return this.events.on('token_refreshed', callback);
  }
}
