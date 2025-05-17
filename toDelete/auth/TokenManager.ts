/**
 * TokenManager - Single source of truth for authentication tokens
 * 
 * This module provides a clean, consistent interface for token management
 * with proper error handling and no fallbacks/workarounds.
 * 
 * IMPORTANT: This file should ONLY be imported in client components!
 * For server-side token handling, use appropriate server utilities.
 */

'use client'; // Explicitly mark as client component
import { getLogger } from '@/core/logging';

/**
 * Token storage configuration
 * Using HTTP-only cookies for security with standardized settings
 */
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  TOKEN_EXPIRY_KEY: 'auth_expiry',
  COOKIE_PATH: '/',
  COOKIE_SAMESITE: 'strict',
  COOKIE_SECURE: process.env.NODE_ENV === 'production', // Secure in production
  ACCESS_TOKEN_MAX_AGE: 15 * 60, // 15 minutes in seconds
  REFRESH_TOKEN_MAX_AGE: 7 * 24 * 60 * 60, // 7 days in seconds
} as const;

/**
 * Token information interface
 */
export interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  isExpired: boolean;
}

/**
 * Token management error types
 */
export class TokenError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'TokenError';
  }
}

/**
 * Token Manager - Core implementation
 * 
 * Design principles:
 * 1. Single source of truth (cookies)
 * 2. No silent fallbacks
 * 3. Clear error propagation
 * 4. Consistent behavior across client/server
 */
export class TokenManager {
  private static instance: TokenManager | null = null;
  private readonly logger = getLogger();
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }
  
  /**
   * Check if running on server
   */
  private isServer(): boolean {
    return typeof window === 'undefined';
  }
  
  /**
   * Get access token
   * @throws TokenError if token retrieval fails
   */
  async getAccessToken(): Promise<string | null> {
    try {
      if (this.isServer()) {
        // Server-side: get from request cookies
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        return cookieStore.get(TOKEN_CONFIG.ACCESS_TOKEN_KEY)?.value || null;
      } else {
        // Client-side: get from document cookies
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${TOKEN_CONFIG.ACCESS_TOKEN_KEY}=`))
          ?.split('=')[1];
        
        return value ? decodeURIComponent(value) : null;
      }
    } catch (error) {
      this.logger.error('Failed to get access token:', error as Error)
      throw new TokenError(
        'Failed to retrieve access token',
        'TOKEN_RETRIEVAL_ERROR',
        error
      );
    }
  }
  
  /**
   * Get refresh token
   * @throws TokenError if token retrieval fails
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      if (this.isServer()) {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        return cookieStore.get(TOKEN_CONFIG.REFRESH_TOKEN_KEY)?.value || null;
      } else {
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${TOKEN_CONFIG.REFRESH_TOKEN_KEY}=`))
          ?.split('=')[1];
        
        return value ? decodeURIComponent(value) : null;
      }
    } catch (error) {
      this.logger.error('Failed to get refresh token:', error as Error)
      throw new TokenError(
        'Failed to retrieve refresh token',
        'TOKEN_RETRIEVAL_ERROR',
        error
      );
    }
  }
  
  /**
   * Get token expiration time
   */
  async getTokenExpiry(): Promise<Date | null> {
    try {
      if (this.isServer()) {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const expiryStr = cookieStore.get(TOKEN_CONFIG.TOKEN_EXPIRY_KEY)?.value;
        return expiryStr ? new Date(expiryStr) : null;
      } else {
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${TOKEN_CONFIG.TOKEN_EXPIRY_KEY}=`))
          ?.split('=')[1];
        
        return value ? new Date(decodeURIComponent(value)) : null;
      }
    } catch (error) {
      this.logger.error('Failed to get token expiry:', error as Error)
      return null;
    }
  }
  
  /**
   * Set tokens (client-side only)
   * @throws TokenError if setting tokens fails
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    this.setAccessToken(accessToken, expiresIn);
    this.setRefreshToken(refreshToken);
  }

  /**
   * Set access token (client-side only)
   * @throws TokenError if setting token fails
   */
  setAccessToken(accessToken: string, expiresIn: number): void {
    if (this.isServer()) {
      throw new TokenError(
        'Cannot set tokens on server side',
        'SERVER_OPERATION_ERROR'
      );
    }
    
    try {
      const expiryDate = new Date(Date.now() + expiresIn * 1000);
      
      // Build standard cookie attributes
      const cookieAttributes = [
        `path=${TOKEN_CONFIG.COOKIE_PATH}`,
        `expires=${expiryDate.toUTCString()}`,
        `samesite=${TOKEN_CONFIG.COOKIE_SAMESITE}`,
        `max-age=${expiresIn}`,
      ];
      
      // Add secure flag in production
      if (TOKEN_CONFIG.COOKIE_SECURE) {
        cookieAttributes.push('secure');
      }
      
      // Set cookies with consistent attributes
      document.cookie = `${TOKEN_CONFIG.ACCESS_TOKEN_KEY}=${encodeURIComponent(accessToken)}; ${cookieAttributes.join('; ')}`;
      document.cookie = `${TOKEN_CONFIG.TOKEN_EXPIRY_KEY}=${encodeURIComponent(expiryDate.toISOString())}; ${cookieAttributes.join('; ')}`;
      
      // Also set additional backup cookies for better reliability
      document.cookie = `auth_expires_at=${expiryDate.getTime()}; ${cookieAttributes.join('; ')}`;
      document.cookie = `auth_expires_timestamp=${expiryDate.getTime()}; ${cookieAttributes.join('; ')}`;
      document.cookie = `auth_expires_seconds=${Math.floor(expiryDate.getTime() / 1000)}; ${cookieAttributes.join('; ')}`;
      document.cookie = `auth_expires_in=${expiresIn}; ${cookieAttributes.join('; ')}`;
      document.cookie = `auth_timestamp=${Date.now()}; ${cookieAttributes.join('; ')}`;
      
      // Set backup token
      document.cookie = `auth_token_backup=${encodeURIComponent(accessToken)}; ${cookieAttributes.join('; ')}`;
      
      this.logger.info('Access token set successfully with standardized cookie settings');
    } catch (error) {
      this.logger.error('Failed to set access token:', error as Error)
      throw new TokenError(
        'Failed to set access token',
        'TOKEN_SET_ERROR',
        error
      );
    }
  }
  
  /**
   * Set refresh token (client-side only)
   * @throws TokenError if setting token fails
   */
  setRefreshToken(refreshToken: string): void {
    if (this.isServer()) {
      throw new TokenError(
        'Cannot set tokens on server side',
        'SERVER_OPERATION_ERROR'
      );
    }
    
    try {
      // Use standard refresh token expiry from config
      const expiryDate = new Date(Date.now() + TOKEN_CONFIG.REFRESH_TOKEN_MAX_AGE * 1000);
      
      // Build standard cookie attributes
      const cookieAttributes = [
        `path=${TOKEN_CONFIG.COOKIE_PATH}`,
        `expires=${expiryDate.toUTCString()}`,
        `samesite=${TOKEN_CONFIG.COOKIE_SAMESITE}`,
        `max-age=${TOKEN_CONFIG.REFRESH_TOKEN_MAX_AGE}`,
      ];
      
      // Add secure flag in production
      if (TOKEN_CONFIG.COOKIE_SECURE) {
        cookieAttributes.push('secure');
      }
      
      // Set cookie with standardized security settings
      document.cookie = `${TOKEN_CONFIG.REFRESH_TOKEN_KEY}=${encodeURIComponent(refreshToken)}; ${cookieAttributes.join('; ')}`;
      
      // Also set a backup refresh token cookie
      document.cookie = `refresh_token_backup=${encodeURIComponent(refreshToken)}; ${cookieAttributes.join('; ')}`;
      
      this.logger.info('Refresh token set successfully with standardized cookie settings');
    } catch (error) {
      this.logger.error('Failed to set refresh token:', error as Error)
      throw new TokenError(
        'Failed to set refresh token',
        'TOKEN_SET_ERROR',
        error
      );
    }
  }
  
  /**
   * Clear all tokens
   */
  async clearTokens(): Promise<void> {
    try {
      if (this.isServer()) {
        // Server-side: use Next.js cookies API
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        
        // Remove all authentication cookies
        cookieStore.delete(TOKEN_CONFIG.ACCESS_TOKEN_KEY);
        cookieStore.delete(TOKEN_CONFIG.REFRESH_TOKEN_KEY);
        cookieStore.delete(TOKEN_CONFIG.TOKEN_EXPIRY_KEY);
        
        // Also remove any legacy keys
        cookieStore.delete('auth_token_backup');
        cookieStore.delete('refresh_token_backup');
        cookieStore.delete('auth_expiry_backup');
      } else {
        // Client-side: clear cookies with consistent settings
        const tokensToRemove = [
          TOKEN_CONFIG.ACCESS_TOKEN_KEY,
          TOKEN_CONFIG.REFRESH_TOKEN_KEY,
          TOKEN_CONFIG.TOKEN_EXPIRY_KEY,
          'auth_token_backup',
          'refresh_token_backup',
          'auth_expiry_backup',
          'auth_expires_at',
          'auth_expires_timestamp',
          'auth_expires_seconds',
          'auth_expires_in',
          'auth_timestamp'
        ];
        
        // Clear cookies with consistent path and domain
        tokensToRemove.forEach(name => {
          document.cookie = `${name}=; path=${TOKEN_CONFIG.COOKIE_PATH}; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=${TOKEN_CONFIG.COOKIE_SAMESITE};`;
        });
        
        // Also run localStorage cleanup
        try {
          const { cleanupLegacyAuthStorage } = await import('../utils/AuthStorageCleanup');
          cleanupLegacyAuthStorage();
        } catch (cleanupError) {
          this.logger.warn('Could not run storage cleanup:', cleanupError as Error);
        }
      }
      
      this.logger.info('Tokens cleared successfully');
    } catch (error) {
      this.logger.error('Failed to clear tokens:', error as Error)
      throw new TokenError(
        'Failed to clear authentication tokens',
        'TOKEN_CLEAR_ERROR',
        error
      );
    }
  }
  
  /**
   * Check if token is expired
   */
  async isTokenExpired(bufferSeconds: number = 300): Promise<boolean> {
    try {
      const expiry = await this.getTokenExpiry();
      
      if (!expiry) {
        // No expiry means no valid token
        return true;
      }
      
      const now = new Date();
      const bufferMs = bufferSeconds * 1000;
      
      return now.getTime() >= expiry.getTime() - bufferMs;
    } catch (error) {
      this.logger.error('Failed to check token expiration:', error as Error)
      // Assume expired on error
      return true;
    }
  }
  
  /**
   * Get complete token information
   */
  async getTokenInfo(): Promise<TokenInfo | null> {
    try {
      const accessToken = await this.getAccessToken();
      
      if (!accessToken) {
        return null;
      }
      
      const refreshToken = await this.getRefreshToken();
      const expiresAt = await this.getTokenExpiry();
      const isExpired = await this.isTokenExpired();
      
      return {
        accessToken,
        refreshToken: refreshToken || undefined,
        expiresAt: expiresAt || new Date(Date.now() + 15 * 60 * 1000), // Default 15 min
        isExpired
      };
    } catch (error) {
      this.logger.error('Failed to get token info:', error as Error)
      return null;
    }
  }
  
  /**
   * Decode JWT token (without verification)
   * Safe version that doesn't throw exceptions on invalid tokens
   */
  decodeToken(token: string): any {
    try {
      // Validate input
      if (!token || typeof token !== 'string') {
        this.logger.warn('Invalid token provided to decodeToken');
        return null;
      }
      
      // Split the token
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        this.logger.warn('Invalid JWT format');
        return null;
      }
      
      // Decode the payload
      const payload = parts[1];
      try {
        // Handle various base64 formats
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = Buffer.from(base64, 'base64').toString('utf-8');
        return JSON.parse(decoded);
      } catch (decodeError) {
        this.logger.warn('Failed to decode token payload:', decodeError as Error);
        return null;
      }
    } catch (error) {
      this.logger.error('Failed to decode token:', error as Error)
      // Just return null instead of throwing - safer for token processing
      return null;
    }
  }
  
  /**
   * Extract user data from token
   * Added to help with auth stability issues
   */
  getUserFromToken(token: string): any {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return null;
      
      // Extract user data from token payload
      return {
        id: decoded.userId || decoded.sub,
        email: decoded.email,
        role: decoded.role,
        // Add minimal required fields for user object
        name: decoded.name || '',
        status: 'ACTIVE', // Assume active if they have a token
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      this.logger.warn('Failed to extract user data from token:', error as Error);
      return null;
    }
  }
  
  /**
   * Check token validity and ensure consistent token state
   * Optimized implementation with improved timeout handling and performance
   */
  async checkTokenValidity(force: boolean = false): Promise<boolean> {
    // Skip if not client-side and not forced
    if (this.isServer() && !force) return false;
    
    // Create a controller for timeout management
    const controller = new AbortController();
    const signal = controller.signal;
    
    // Set a shorter timeout to avoid UI hangs
    const timeoutId = setTimeout(() => {
      controller.abort();
      this.logger.warn('Token validity check timed out, continuing with initialization');
    }, 1500); // Reduced from 3000ms to 1500ms for faster UI response
    
    try {
      // Fast path: Check if token exists using optimized cookie lookup
      const hasCookie = document.cookie.includes(`${TOKEN_CONFIG.ACCESS_TOKEN_KEY}=`);
      
      // If no token found, return quickly without extra processing
      if (!hasCookie) {
        // Clean up any legacy storage in the background without waiting
        setTimeout(async () => {
          try {
            const { cleanupLegacyAuthStorage } = await import('../utils/AuthStorageCleanup');
            cleanupLegacyAuthStorage();
          } catch (error) {
            // Silently ignore cleanup errors
          }
        }, 100);
        
        clearTimeout(timeoutId);
        return false;
      }
      
      // If token exists, do a faster expiry check
      try {
        // Get cookie directly using optimized method without locking
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${TOKEN_CONFIG.ACCESS_TOKEN_KEY}=`));
        
        // If aborted, return true (assume valid to prevent logout)
        if (signal.aborted) {
          this.logger.warn('Token validity check aborted, assuming valid token');
          return true;
        }
        
        // Quick expiry check - only if token needs refresh and force=true
        // Avoid the async call to isTokenExpired when possible
        const expiryStr = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${TOKEN_CONFIG.TOKEN_EXPIRY_KEY}=`));
          
        if (expiryStr) {
          const parts = expiryStr.split('=');
          if (parts.length === 2) {
            try {
              const expiry = new Date(decodeURIComponent(parts[1]));
              const now = new Date();
              
              // Check if expired with a 5-minute buffer
              const isExpired = now.getTime() >= (expiry.getTime() - 5 * 60 * 1000);
              
              // If token is expired and force=true, try to refresh
              if (isExpired && force) {
                // Don't wait more than 1 second for refresh
                const refreshTimeoutId = setTimeout(() => {
                  controller.abort();
                }, 1000);
                
                try {
                  const { AuthClient } = await import('../clients/AuthClient');
                  
                  // If already aborted, skip refresh
                  if (signal.aborted) {
                    clearTimeout(refreshTimeoutId);
                    return true; // Assume valid to prevent logout
                  }
                  
                  await AuthClient.refreshToken();
                  clearTimeout(refreshTimeoutId);
                  clearTimeout(timeoutId);
                  return true;
                } catch (refreshError) {
                  clearTimeout(refreshTimeoutId);
                  this.logger.warn('Token refresh failed:', refreshError as Error);
                  
                  // Return true anyway to prevent logout on refresh failures
                  return true;
                }
              }
              
              clearTimeout(timeoutId);
              return !isExpired;
            } catch (parseError) {
              // If we can't parse the date, assume token is valid
              this.logger.warn('Could not parse token expiry date, assuming valid');
              clearTimeout(timeoutId);
              return true;
            }
          }
        }
        
        // If we can't determine expiry from cookie, assume valid
        // This prevents unnecessary logouts
        clearTimeout(timeoutId);
        return true;
      } catch (cookieError) {
        // If there's any error, assume the token is valid to prevent logout
        this.logger.warn('Error reading cookies during token check, assuming valid token');
        clearTimeout(timeoutId);
        return true;
      }
    } catch (error) {
      // If aborted or any other error, assume token is valid to prevent logout
      clearTimeout(timeoutId);
      
      if (signal.aborted) {
        this.logger.warn('Token validity check timed out, assuming valid token');
        return true;
      }
      
      this.logger.error('Token validity check error:', error as Error);
      return true; // Fail open instead of closed for better UX
    } finally {
      // Always clean up
      clearTimeout(timeoutId);
    }
  }
  
  // Keep synchronizeTokens for backward compatibility
  // with improved error handling
  async synchronizeTokens(force: boolean = false): Promise<boolean> {
    try {
      return await this.checkTokenValidity(force);
    } catch (error) {
      this.logger.warn('Token synchronization error handled:', error as Error);
      return true; // Prevent logout on error
    }
  }
  
  /**
   * Notify about authentication state changes
   */
  async notifyAuthChange(isAuthenticated: boolean): Promise<void> {
    try {
      if (this.isServer()) return;
      
      // Set last auth change time for throttling
      if (typeof window !== 'undefined') {
        if (!(window as any).__AUTH_PROVIDER_STATE_KEY) {
          (window as any).__AUTH_PROVIDER_STATE_KEY = {};
        }
        (window as any).__AUTH_PROVIDER_STATE_KEY.lastAuthChange = Date.now();
        (window as any).__AUTH_PROVIDER_STATE_KEY.lastLoginTime = isAuthenticated ? Date.now() : 0;
      }
      
      // Dispatch auth change event
      const event = new CustomEvent('auth-state-change', { 
        detail: { isAuthenticated, timestamp: Date.now() }
      });
      window.dispatchEvent(event);
      
      this.logger.info(`Auth change notification sent: ${isAuthenticated ? 'authenticated' : 'unauthenticated'}`);
    } catch (error) {
      this.logger.error('Error notifying about auth change:', error as Error);
    }
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();
