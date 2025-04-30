'use client';

/**
 * AuthInitializer - A centralized utility to ensure proper authentication initialization
 * This serves as the single source of truth for authentication state
 */

import { ApiClient } from '@/core/api/ApiClient';
import { 
synchronizeTokens,
refreshAccessToken,
clearTokens,
notifyAuthChange,
notifyLogout,
getUserFromToken
} from '../clients/token';
import { getItem } from '@/shared/utils/storage';

/**
 * Global state for auth initialization (for backward compatibility)
 */
const AUTH_INITIALIZER_KEY = '__AUTH_INITIALIZER_STATE';

// Set up global state for tracking initialization across components
if (typeof window !== 'undefined') {
  if (!(window as any)[AUTH_INITIALIZER_KEY]) {
    (window as any)[AUTH_INITIALIZER_KEY] = {
      isInitialized: false,
      isInitializing: false,
      lastInitTime: 0,
      initializationCount: 0,
      tokens: {
        lastSync: 0,
        lastRefresh: 0,
        status: {
          hasAuthToken: false,
          hasRefreshToken: false,
          authExpiration: null
        }
      },
      initPromise: null
    };
  }
}

// Configuration for initialization
export interface AuthInitConfig {
  forceApi?: boolean;
  forceTokenSync?: boolean;
  source?: string;
  timeout?: number;
  detectDuplicates?: boolean;
}

/**
 * Check if API client is initialized
 */
function isApiInitialized(): boolean {
  // Check if ApiClient has a static property or method for this
  if (typeof window !== 'undefined' && (window as any).__API_CLIENT_STATE) {
    return (window as any).__API_CLIENT_STATE.initialized === true;
  }
  return false;
}

/**
 * Initialize authentication
 * This is the centralized way to initialize auth state across the application
 * 
 * @param config Optional configuration
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeAuth(config: AuthInitConfig = {}): Promise<void> {
  // Generate unique instance ID for this initialization
  const instanceId = `auth-init-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  // Access global state for tracking
  const globalState = typeof window !== 'undefined' ? (window as any)[AUTH_INITIALIZER_KEY] : null;
  const now = Date.now();
  
  // Update source for debugging
  if (globalState) {
    globalState.initializationCount = (globalState.initializationCount || 0) + 1;
    globalState.lastInitSource = config.source || instanceId;
  }
  
  // Log initialization attempt
  console.log(`AuthInitializer: Starting initialization (${instanceId})`, {
    source: config.source,
    forceApi: config.forceApi,
    forceTokenSync: config.forceTokenSync
  });
  
  try {
    // Initialize API client
    await ApiClient.initialize({
      force: config.forceApi, 
      autoRefreshToken: true,
      headers: {
        'X-Initialization-Source': `auth-initializer-${instanceId}`
      }
    });
    
    // Synchronize tokens if forced
    if (config.forceTokenSync) {
      await synchronizeTokens(true);
    }
    
    // Validate token to ensure authentication state is accurate
    let isValid = false;
    try {
      // Import getToken as well
      const { getToken } = await import('../clients/token');
      const token = await getToken();
      if (token) {
        const user = getUserFromToken(token);
        isValid = !!user;
      }
    } catch (error) {
      console.warn('Error validating token during initialization', error);
    }
    
    // Update global state
    if (globalState) {
      globalState.isInitialized = true;
      globalState.isInitializing = false;
      globalState.lastInitTime = Date.now();
      
      // Update token status
      if (isValid && typeof localStorage !== 'undefined') {
        const hasAuthToken = !!getItem('auth_token_backup');
        const hasRefreshToken = !!getItem('refresh_token_backup');
        const expiresAt = getItem('auth_expires_at');
        
        if (globalState.tokens) {
          globalState.tokens.status = {
            hasAuthToken,
            hasRefreshToken,
            authExpiration: expiresAt
          };
        }
      }
    }
    
    console.log('AuthInitializer: Authentication initialized successfully');
  } catch (error) {
    // Update state on failure
    if (globalState) {
      globalState.isInitialized = false;
      globalState.isInitializing = false;
      globalState.lastError = error instanceof Error ? 
        error.message : 'Unknown error during auth initialization';
    }
    
    console.error('AuthInitializer: Error during initialization', 
      error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Check if auth is already initialized
 */
export function isAuthInitialized(): boolean {
  const globalState = typeof window !== 'undefined' ? (window as any)[AUTH_INITIALIZER_KEY] : null;
  return globalState?.isInitialized === true;
}

/**
 * Reset the auth initialization state - useful for testing/recovery
 */
export function resetAuthInitialization(): void {
  const globalState = typeof window !== 'undefined' ? (window as any)[AUTH_INITIALIZER_KEY] : null;
  
  if (globalState) {
    globalState.isInitialized = false;
    globalState.isInitializing = false;
    globalState.initPromise = null;
  }
}

/**
 * Get the current auth token status
 */
export function getAuthStatus(): Record<string, any> {
  const globalState = typeof window !== 'undefined' ? (window as any)[AUTH_INITIALIZER_KEY] : null;
  
  if (!globalState) {
    return {
      available: false
    };
  }
  
  return {
    available: true,
    isInitialized: globalState.isInitialized,
    isInitializing: globalState.isInitializing,
    tokens: globalState.tokens,
    lastInitTime: globalState.lastInitTime ? new Date(globalState.lastInitTime).toISOString() : null
  };
}

/**
 * Clear all authentication tokens and state
 */
export async function clearAuthState(): Promise<void> {
  try {
    // Clear tokens using TokenManager
    await clearTokens();
    
    // Reset initialization state
    resetAuthInitialization();
    
    // Notify about logout
    await notifyLogout();
    
    console.log('AuthInitializer: Auth state cleared successfully');
  } catch (error) {
    console.error('AuthInitializer: Error clearing auth state:', 
      error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Utility function to initialize authentication with default settings
 */
export async function setupAuth(): Promise<void> {
  return initializeAuth({
    source: 'authUtils.setupAuth',
    detectDuplicates: true
  });
}

/**
 * Check if a user is authenticated based on token presence and validity
 */
export function isAuthenticated(): boolean {
  // Check global state first for backward compatibility
  const status = getAuthStatus();
  
  if (status.available) {
    return status.isInitialized && status.tokens?.status?.hasAuthToken;
  }
  
  // Otherwise use token presence check
  if (typeof localStorage !== 'undefined') {
    return !!getItem('auth_token_backup');
  }
  
  return false;
}

/**
 * Get user information from the current authentication token (synchronous version)
 */
export function getUserFromTokenSync(): { id: number; name: string; email: string; role: string } | null {
  try {
    // Check for auth token first
    if (!isAuthenticated()) {
      return null;
    }
    
    // Get the token from localStorage backup
    if (typeof localStorage === 'undefined') {
      return null;
    }
    
    const token = getItem('auth_token_backup');
    if (!token) {
      return null;
    }
    
    // Use the imported getUserFromToken function
    return getUserFromToken(token);
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
}

// Export TokenManager functionality through function instead of direct export
export async function getTokenManager() {
  // Dynamically import to prevent server-side issues
  const { ClientTokenManager } = await import('../clients/token/ClientTokenManager');
  return ClientTokenManager;
}
