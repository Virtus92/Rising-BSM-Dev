'use client';

/**
 * Token Refresh Manager
 * 
 * Manages token refresh operations to prevent excessive refreshes and race conditions.
 * This implementation is streamlined to better coordinate with TokenManager and prevent duplication.
 */

import { TokenManager } from './TokenManager';
import { getLogger } from '@/core/logging';
import { getItem, setItem, removeItem } from '@/shared/utils/storage/cookieStorage';

/**
 * Configuration options for token refresh behavior
 */
export interface TokenRefreshConfig {
  // Minimum time between token refresh attempts (ms)
  minRefreshInterval: number;
  
  // Maximum consecutive failed refreshes before redirecting to login
  maxFailedRefresh: number;
  
  // Buffer time before token expiration to trigger refresh (seconds)
  refreshBuffer: number;
  
  // Whether to auto-refresh tokens on app initialization
  autoRefreshOnInit: boolean;
  
  // Whether to log detailed operations
  verbose: boolean;
}

/**
 * TokenRefreshManager
 * 
 * Singleton class to manage token refresh operations and prevent race conditions
 */
export class TokenRefreshManager {
  private static instance: TokenRefreshManager;
  
  // Default configuration with more responsive settings
  private config: TokenRefreshConfig = {
    minRefreshInterval: 300000, // 5 minutes minimum between refreshes (reduced from 20 minutes)
    maxFailedRefresh: 3,
    refreshBuffer: 600, // 10 minutes before expiration (reduced from 30 minutes)
    autoRefreshOnInit: true, // Set to true to ensure token refresh on initialization
    verbose: true // Enable verbose logging for better debugging
  };
  
  // Scheduled refresh state
  private refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;
  
  // Status flags
  private initialized: boolean = false;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Initialize global state for tracking
    if (typeof window !== 'undefined') {
      if (!(window as any).__TOKEN_REFRESH_STATE) {
        (window as any).__TOKEN_REFRESH_STATE = {
          lastRefresh: 0,
          failedCount: 0,
          isRefreshing: false,
          refreshScheduled: false
        };
      }
    }
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): TokenRefreshManager {
    if (!TokenRefreshManager.instance) {
      TokenRefreshManager.instance = new TokenRefreshManager();
    }
    return TokenRefreshManager.instance;
  }
  
  /**
   * Configure the token refresh behavior
   * @param config Partial configuration to override defaults
   */
  public configure(config: Partial<TokenRefreshConfig>): void {
    this.config = { ...this.config, ...config };
    
    const logger = getLogger();
    if (this.config.verbose) {
      logger.debug('TokenRefreshManager configured:', { config: this.config });
    }
  }
  
  /**
   * Initialize the token refresh manager
   * Sets up token refresh scheduling based on current token status
   */
  public async initialize(): Promise<boolean> {
    // Skip if already initialized to prevent duplicate initialization
    if (this.initialized) {
      return true;
    }
    
    const logger = getLogger();
    logger.debug('TokenRefreshManager: Initializing');
    
    try {
      // First ensure tokens are synchronized
      await TokenManager.synchronizeTokens(true);
      
      // Get access token to check its expiration
      const accessToken = await TokenManager.getAccessToken?.();
      
      if (!accessToken) {
        logger.debug('TokenRefreshManager: No access token available during initialization');
        this.initialized = true;
        return false;
      }
      
      // Schedule token refresh based on expiration
      this.scheduleNextRefresh();
      
      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('TokenRefreshManager: Initialization error', { error });
      this.initialized = true; // Still mark as initialized to prevent repeated init failures
      return false;
    }
  }
  
  /**
   * Schedule the next token refresh based on current token expiration
   */
  private scheduleNextRefresh(): void {
    const logger = getLogger();
    
    // Clear any existing refresh timer
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    
    try {
      // Get token and expiration from localStorage
      const accessToken = getItem('auth_token_backup');
      const expiresAtStr = getItem('auth_expires_at');
      
      if (!accessToken || !expiresAtStr) {
        if (this.config.verbose) {
          logger.debug('TokenRefreshManager: No access token or expiration available, not scheduling refresh');
        }
        return;
      }
      
      // Calculate when to refresh the token
      const expiresAt = new Date(expiresAtStr).getTime();
      
      // Ensure the expiration date is valid
      if (isNaN(expiresAt)) {
        logger.debug('TokenRefreshManager: Invalid expiration date, not scheduling refresh');
        return;
      }
      
      // Calculate the refresh time (with buffer)
      const refreshTime = expiresAt - (this.config.refreshBuffer * 1000);
      const now = Date.now();
      
      // Calculate delay until refresh is needed
      let refreshDelay = Math.max(0, refreshTime - now);
      
      // Ensure minimum refresh interval
      const lastRefresh = parseInt(getItem('token_refresh_timestamp') || '0', 10);
      if (now - lastRefresh < this.config.minRefreshInterval) {
        refreshDelay = Math.max(refreshDelay, this.config.minRefreshInterval - (now - lastRefresh));
      }
      
      // Add some randomization to prevent all clients refreshing simultaneously
      // This helps distribute server load
      const jitter = Math.floor(Math.random() * 60000); // Random jitter up to 1 minute
      refreshDelay += jitter;
      
      // Don't schedule if delay is too large (over 24 hours) - we'll reschedule on next check
      if (refreshDelay > 24 * 60 * 60 * 1000) {
        if (this.config.verbose) {
          logger.debug('TokenRefreshManager: Refresh delay too large, will be scheduled later');
        }
        return;
      }
      
      // Don't schedule if token is expired or will expire before refresh happens
      if (expiresAt <= now) {
        logger.debug('TokenRefreshManager: Token already expired, triggering immediate refresh');
        this.refreshAccessToken();
        return;
      }
      
      // Log scheduling information - reduce logging in production
      if (this.config.verbose) {
        logger.debug('TokenRefreshManager: Scheduling next refresh', { 
          refreshDelay: Math.round(refreshDelay / 1000) + 's',
          refreshAt: new Date(now + refreshDelay).toISOString(),
          tokenExpires: new Date(expiresAt).toISOString(),
          jitterMs: jitter
        });
      } else {
        // Minimal logging in production
        logger.debug(`TokenRefreshManager: Token refresh scheduled in ${Math.round(refreshDelay / 1000)}s`);
      }
      
      // Update global state
      if (typeof window !== 'undefined' && (window as any).__TOKEN_REFRESH_STATE) {
        (window as any).__TOKEN_REFRESH_STATE.refreshScheduled = true;
        (window as any).__TOKEN_REFRESH_STATE.nextRefreshTime = new Date(now + refreshDelay).toISOString();
      }
      
      // Schedule the token refresh with improved error handling
      this.refreshTimeoutId = setTimeout(async () => {
        // Update global state
        if (typeof window !== 'undefined' && (window as any).__TOKEN_REFRESH_STATE) {
          (window as any).__TOKEN_REFRESH_STATE.refreshScheduled = false;
        }
        
        // Get current time and verify token is still valid before refresh attempt
        const currentTime = Date.now();
        const currentExpiresAtStr = getItem('auth_expires_at');
        let shouldAttemptRefresh = true;
        
        // Check if token has been refreshed by another component/tab
        if (currentExpiresAtStr) {
          try {
            const currentExpiresAt = new Date(currentExpiresAtStr).getTime();
            // If token expiration has changed significantly, it was likely refreshed elsewhere
            if (currentExpiresAt > expiresAt + (60 * 1000)) { // More than 1 minute difference
              logger.debug('TokenRefreshManager: Token already refreshed by another process');
              // Schedule next refresh based on new expiration
              this.scheduleNextRefresh();
              return;
            }
          } catch (e) {
            // Continue with refresh if there's an error parsing the date
            logger.warn('Error checking current token expiration, continuing with refresh');
          }
        }
        
        if (shouldAttemptRefresh) {
          // Use TokenManager to perform the refresh
          try {
            logger.debug('TokenRefreshManager: Executing scheduled token refresh');
            const success = await TokenManager.refreshAccessToken();
            
            if (success) {
              // Store last refresh timestamp
              setItem('token_refresh_timestamp', Date.now().toString());
              // Schedule next refresh
              this.scheduleNextRefresh();
            } else {
              // Calculate appropriate retry delay based on failure count
              const failedCount = parseInt(getItem('token_refresh_failed_count') || '0', 10) + 1;
              setItem('token_refresh_failed_count', failedCount.toString());
              
              // Exponential backoff: 1min, 2min, 4min, 8min (capped)
              const retryDelay = Math.min(60000 * Math.pow(2, failedCount - 1), 8 * 60000);
              
              logger.warn(`TokenRefreshManager: Refresh failed (attempt ${failedCount}), retrying in ${retryDelay/1000}s`);
              setTimeout(() => this.scheduleNextRefresh(), retryDelay);
            }
          } catch (error) {
            logger.error('TokenRefreshManager: Scheduled refresh error');
            // Retry with exponential backoff
            setTimeout(() => this.scheduleNextRefresh(), 5 * 60 * 1000);
          }
        }
      }, refreshDelay);
    } catch (error) {
      logger.error('TokenRefreshManager: Error scheduling refresh', { error });
    }
  }
  
  /**
   * Refresh the access token using TokenManager
   */
  public async refreshAccessToken(): Promise<boolean> {
    const logger = getLogger();
    
    try {
      if (this.config.verbose) {
        logger.debug('TokenRefreshManager: Starting token refresh');
      }
      
      // Forward to TokenManager for the actual refresh
      const result = await TokenManager.refreshAccessToken();
      
      if (result) {
        // Store last refresh timestamp
        setItem('token_refresh_timestamp', Date.now().toString());
        // Schedule next refresh after success
        this.scheduleNextRefresh();
      }
      
      return result;
    } catch (error) {
      logger.error('TokenRefreshManager: Error refreshing token', { error });
      return false;
    }
  }
  
  /**
   * Reset all refresh state (used for testing or after logout)
   */
  public reset(): void {
    const logger = getLogger();
    logger.debug('TokenRefreshManager: Resetting state');
    
    // Clear refresh timeout
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    
    // Reset localStorage state for all related keys
    removeItem('token_refresh_timestamp');
    removeItem('token_refresh_failed_count');
    removeItem('token_refresh_last_error');
    
    // Update global state
    if (typeof window !== 'undefined' && (window as any).__TOKEN_REFRESH_STATE) {
      (window as any).__TOKEN_REFRESH_STATE = {
        lastRefresh: 0,
        failedCount: 0,
        isRefreshing: false,
        refreshScheduled: false
      };
    }
    
    this.initialized = false;
  }
}

// Export singleton instance for easy access
export const tokenRefreshManager = TokenRefreshManager.getInstance();
export default tokenRefreshManager;
