'use client';

/**
 * TokenManager
 * 
 * Core token management functionality for client-side use.
 * This file should only be imported in client components.
 */

import { getLogger } from '@/core/logging';
import { TokenPayloadDto } from '@/domain/dtos/AuthDtos';
import { TokenUser } from './interfaces/ITokenManager';
import { setItem, getItem } from '@/shared/utils/storage';

// Re-export the client or server implementation based on environment
const logger = getLogger();

// Define the interface for token-related functions
interface TokenManagerFunctions {
  getAccessToken?: () => Promise<string | null>;
  getRefreshToken?: () => Promise<string | null>;
  refreshAccessToken?: () => Promise<boolean>;
  clearTokens?: () => Promise<void>;
  getUserFromToken?: (token: string) => TokenUser | null;
  notifyAuthChange?: (isAuthenticated: boolean) => Promise<void>;
  synchronizeTokens?: (forceRefresh?: boolean) => Promise<boolean>;
}

// Initialize a default implementation with empty functions
const defaultImplementation: TokenManagerFunctions = {
  getAccessToken: async () => null,
  getRefreshToken: async () => null,
  refreshAccessToken: async () => false,
  clearTokens: async () => {},
  getUserFromToken: () => null,
  notifyAuthChange: async () => {},
  synchronizeTokens: async () => false
};

// Dynamic implementation that will be populated based on environment
let implementation: TokenManagerFunctions = { ...defaultImplementation };

// Cache for tokens to reduce API calls
const tokenCache = {
  accessToken: null as string | null,
  refreshToken: null as string | null,
  tokenUser: null as TokenUser | null,
  lastSync: 0,
  syncCooldown: 2000 // 2 seconds
};

/**
 * Determine whether we're in a client or server environment
 * and load the appropriate implementation
 */
async function loadImplementation(): Promise<void> {
  // Only try to load client-side - this file should never be imported server-side
  if (typeof window !== 'undefined') {
    try {
      const { clientTokenManager } = await import('./TokenManager.client');
      implementation = clientTokenManager;
      logger.debug('Loaded client-side TokenManager implementation');
    } catch (error) {
      logger.error('Failed to load client TokenManager:', error as Error);
    }
  } else {
    // This is a safety check - this code should never run server-side
    logger.warn('TokenManager.ts was imported in a server context - this is not supported!');
  }
}

// Initialize implementation
loadImplementation().catch(error => {
  logger.error('Error during TokenManager initialization:', error);
});

/**
 * TokenManager for both client and server environments
 */
export const TokenManager = {
  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      if (implementation.getAccessToken) {
        return await implementation.getAccessToken();
      }
      return null;
    } catch (error) {
      logger.error('Error in TokenManager.getAccessToken:', error as Error);
      return null;
    }
  },

  /**
   * Get current refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      if (implementation.getRefreshToken) {
        return await implementation.getRefreshToken();
      }
      return null;
    } catch (error) {
      logger.error('Error in TokenManager.getRefreshToken:', error as Error);
      return null;
    }
  },

  /**
   * Refresh access token 
   */
  async refreshAccessToken(): Promise<boolean> {
    try {
      if (implementation.refreshAccessToken) {
        return await implementation.refreshAccessToken();
      }
      return false;
    } catch (error) {
      logger.error('Error in TokenManager.refreshAccessToken:', error as Error);
      return false;
    }
  },

  /**
   * Clear all tokens
   */
  async clearTokens(): Promise<void> {
    try {
      // Clear cache
      tokenCache.accessToken = null;
      tokenCache.refreshToken = null;
      tokenCache.tokenUser = null;
      
      if (implementation.clearTokens) {
        await implementation.clearTokens();
      }
    } catch (error) {
      logger.error('Error in TokenManager.clearTokens:', error as Error);
    }
  },

  /**
   * Get user from token
   */
  getUserFromToken(token: string): TokenUser | null {
    try {
      if (implementation.getUserFromToken) {
        return implementation.getUserFromToken(token);
      }
      return null;
    } catch (error) {
      logger.error('Error in TokenManager.getUserFromToken:', error as Error);
      return null;
    }
  },

  /**
   * Notify about authentication state changes
   */
  async notifyAuthChange(isAuthenticated: boolean): Promise<void> {
    try {
      if (implementation.notifyAuthChange) {
        await implementation.notifyAuthChange(isAuthenticated);
      }
    } catch (error) {
      logger.error('Error in TokenManager.notifyAuthChange:', error as Error);
    }
  },

  /**
   * Synchronize tokens between localStorage and cookies
   * Ensures consistent token state across storage mechanisms
   */
  async synchronizeTokens(forceRefresh: boolean = false): Promise<boolean> {
    try {
      // Throttle sync calls
      const now = Date.now();
      if (!forceRefresh && now - tokenCache.lastSync < tokenCache.syncCooldown) {
        logger.debug('Token sync throttled (called too frequently)');
        return true;
      }
      
      tokenCache.lastSync = now;
      
      if (implementation.synchronizeTokens) {
        return await implementation.synchronizeTokens(forceRefresh);
      }
      
      // Default implementation for backward compatibility
      // This synchronizes localStorage with HTTP cookies
      const token = await this.getAccessToken();
      
      if (typeof window !== 'undefined') {
        if (token) {
          // If we have a token, store it in localStorage as backup
          setItem('auth_token_backup', token);
        } else {
          // If no token from cookies, check localStorage backup
          const backupToken = getItem('auth_token_backup');
          
          if (backupToken && forceRefresh) {
            // If we have a backup but no cookie, try to refresh
            const refreshSuccess = await this.refreshAccessToken();
            return refreshSuccess;
          }
        }
      }
      
      return !!token;
    } catch (error) {
      logger.error('Error in TokenManager.synchronizeTokens:', error as Error);
      return false;
    }
  }
};

// Export default implementation
export default TokenManager;
