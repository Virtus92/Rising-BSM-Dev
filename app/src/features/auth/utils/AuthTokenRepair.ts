/**
 * Auth Token Repair Utility
 * 
 * Simplified utility to handle authentication token issues during initialization:
 * 1. Cleans up any inconsistent state from previous auth system
 * 2. Ensures token storage is consistent
 * 3. Removes legacy token implementations
 * 
 * Used by AppInitializer during the initialization sequence.
 */

import { getLogger } from '@/core/logging';
import { getItem, setItem } from '@/shared/utils/storage';

const logger = getLogger();

/**
 * AuthTokenRepair - Fixes common token-related issues
 */
export class AuthTokenRepair {
  // Tracking variables
  private static repairInProgress = false;
  private static lastRepairTime = 0;
  
  /**
   * Repair token system by cleaning up inconsistent state
   * Simplified implementation that focuses on cleaning up legacy storage
   */
  static async repairTokenSystem(): Promise<boolean> {
    // Prevent multiple simultaneous repairs
    if (this.repairInProgress) {
      logger.debug('AuthTokenRepair: Repair already in progress, skipping');
      return true;
    }
    
    // Simple rate limiting
    const now = Date.now();
    if (now - this.lastRepairTime < 10000) { // 10 seconds
      logger.debug('AuthTokenRepair: Rate limiting repair operations');
      return true;
    }
    
    // Set repair in progress
    this.repairInProgress = true;
    this.lastRepairTime = now;
    
    try {
      logger.debug('AuthTokenRepair: Starting cleanup of token storage');
      
      // Cleanup legacy localStorage tokens that might conflict
      if (typeof window !== 'undefined') {
        // Remove legacy token items that are no longer used
        const legacyKeys = [
          'auth_token', 
          'refresh_token',
          'auth_token_backup',
          'refresh_token_backup',
          'token_expires_at',
          'token_refresh_timestamp',
          'token_refresh_failed_count',
          'token_refresh_last_error'
        ];
        
        // Clean up each legacy key
        legacyKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            // Ignore storage access errors
          }
        });
        
        // Remove any global state markers
        const win = window as any;
        if ('__TOKEN_REFRESH_STATE' in win) {
          win.__TOKEN_REFRESH_STATE = undefined;
        }
        
        if ('__TOKEN_REFRESH_IN_PROGRESS' in win) {
          win.__TOKEN_REFRESH_IN_PROGRESS = undefined;
        }
      }
      
      logger.debug('AuthTokenRepair: Token storage cleanup completed');
      return true;
    } catch (error) {
      logger.error('AuthTokenRepair: Error during cleanup:', error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      this.repairInProgress = false;
    }
  }
  
  /**
   * Helper method to check token endpoint health
   * This is useful to diagnose issues with the token API endpoints
   */
  static async checkTokenEndpointHealth(): Promise<boolean> {
    try {
      logger.debug('AuthTokenRepair: Checking token endpoint health');
      
      // Use AbortController for timeout management
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        // Simply check if the token endpoint is responding
        const response = await fetch('/api/auth/token', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'X-Source': 'token-health-check'
          },
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // We don't care about the response status, just that the endpoint is reachable
        logger.debug(`AuthTokenRepair: Token endpoint health check complete, status: ${response.status}`);
        return true;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          logger.warn('AuthTokenRepair: Token endpoint health check timed out');
          return false;
        }
        
        throw fetchError;
      }
    } catch (error) {
      logger.error('AuthTokenRepair: Error checking token endpoint health:', 
        error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  
  /**
   * Check and clear any legacy token storage
   * This helps to avoid conflicts with older storage mechanisms
   */
  static clearLegacyTokenStorage(): void {
    if (typeof document !== 'undefined') {
      logger.debug('AuthTokenRepair: Clearing legacy token cookies');
      
      // List of legacy cookie names to clear
      const legacyCookies = [
        'auth_token',
        'auth_token_access',
        'refresh_token'
      ];
      
      legacyCookies.forEach(name => {
        try {
          // Set an expired cookie to effectively delete it
          document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
        } catch (e) {
          // Ignore cookie access errors
        }
      });
      
      // Also clear localStorage items for completeness
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      } catch (e) {
        // Ignore localStorage access errors
      }
    }
  }
  
  /**
   * Check for race conditions and token refresh conflicts
   * Helps diagnose issues with multiple simultaneous token refreshes
   */
  static checkRefreshRaceConditions(): boolean {
    let raceConditionDetected = false;
    
    if (typeof window !== 'undefined') {
      // Check for multiple refresh or initialization flags
      const win = window as any;
      const tokenRefreshInProgress = win.__TOKEN_REFRESH_IN_PROGRESS === true;
      const multipleInitialization = document.querySelectorAll('[data-auth-initializing]').length > 1;
      
      if (tokenRefreshInProgress || multipleInitialization) {
        raceConditionDetected = true;
        logger.warn('AuthTokenRepair: Potential race condition detected', {
          tokenRefreshInProgress,
          multipleInitialization
        });
        
        // Clean up race condition flags
        if (tokenRefreshInProgress) {
          win.__TOKEN_REFRESH_IN_PROGRESS = undefined;
        }
      }
    }
    
    return raceConditionDetected;
  }
}