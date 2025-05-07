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
 * Event system for authentication status
 */
type AuthEventType = 'init_start' | 'init_complete' | 'init_failed' | 'auth_change';
type AuthEventCallback = (status: AuthEventData) => void;
type AuthEventData = {
  isInitialized: boolean;
  isAuthenticated: boolean;
  userId?: number | null;
  timestamp: number;
  source?: string;
};

// Event listeners storage
const authEventListeners: Record<AuthEventType, AuthEventCallback[]> = {
  init_start: [],
  init_complete: [],
  init_failed: [],
  auth_change: []
};

/**
 * Subscribe to auth events
 * @param eventType The type of auth event to listen for
 * @param callback Function to call when the event occurs
 * @returns Function to unsubscribe
 */
export function subscribeToAuthEvent(
  eventType: AuthEventType, 
  callback: AuthEventCallback
): () => void {
  if (!authEventListeners[eventType]) {
    authEventListeners[eventType] = [];
  }
  
  // Add the listener
  authEventListeners[eventType].push(callback);
  
  // If subscribing to init_complete and auth is already initialized, 
  // immediately invoke callback with current state
  if (eventType === 'init_complete' && isAuthInitialized()) {
    const currentState = {
      isInitialized: true,
      isAuthenticated: isAuthenticated(),
      userId: getUserFromTokenSync()?.id || null,
      timestamp: Date.now(),
      source: 'immediate_subscription'
    };
    
    // Use setTimeout to ensure this runs after current execution
    setTimeout(() => {
      try {
        callback(currentState);
      } catch (error) {
        console.error('Error in immediate auth event callback:', error);
      }
    }, 0);
  }
  
  // Return function to unsubscribe
  return () => {
    const index = authEventListeners[eventType].indexOf(callback);
    if (index !== -1) {
      authEventListeners[eventType].splice(index, 1);
    }
  };
}

/**
 * Emit an auth event to all subscribers
 */
function emitAuthEvent(
  eventType: AuthEventType, 
  data: Partial<AuthEventData> = {}
): void {
  if (!authEventListeners[eventType]) return;
  
  const eventData: AuthEventData = {
    isInitialized: isAuthInitialized(),
    isAuthenticated: isAuthenticated(),
    userId: getUserFromTokenSync()?.id || null,
    timestamp: Date.now(),
    ...data
  };
  
  // Log the event (except auth_change which can be frequent)
  if (eventType !== 'auth_change' || process.env.NODE_ENV === 'development') {
    console.log(`AuthInitializer: Emitting ${eventType} event`, 
      { ...eventData, listeners: authEventListeners[eventType].length });
  }
  
  // Notify all listeners
  authEventListeners[eventType].forEach(callback => {
    try {
      callback(eventData);
    } catch (error) {
      console.error(`Error in auth event listener for ${eventType}:`, error);
    }
  });
}

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
  
  // Check if already initialized and return early if so
  if (globalState?.isInitialized && !config.forceApi && !config.forceTokenSync) {
    console.log(`AuthInitializer: Already initialized, skipping (${instanceId})`);
    return;
  }
  
  // If initialization is already in progress, don't start a new one
  if (globalState?.isInitializing && globalState.initPromise) {
    console.log(`AuthInitializer: Initialization already in progress, waiting (${instanceId})`);
    return await globalState.initPromise;
  }
  
  // Update source for debugging
  if (globalState) {
    globalState.initializationCount = (globalState.initializationCount || 0) + 1;
    globalState.lastInitSource = config.source || instanceId;
    globalState.isInitializing = true;
    
    // Create a promise for this initialization
    const initPromise = new Promise<void>(async (resolve, reject) => {
      try {
        // Emit initialization start event
        emitAuthEvent('init_start', { source: config.source });
        
        // Log initialization attempt
        console.log(`AuthInitializer: Starting initialization (${instanceId})`, {
          source: config.source,
          forceApi: config.forceApi,
          forceTokenSync: config.forceTokenSync
        });
        
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
        let userId = null;
        try {
          // Import getToken as well
          const { getToken } = await import('../clients/token');
          const token = await getToken();
          if (token) {
            const user = getUserFromToken(token);
            isValid = !!user;
            userId = user?.id;
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
        
        // Emit initialization complete event
        emitAuthEvent('init_complete', { 
          source: config.source,
          userId,
          isAuthenticated: isValid
        });
        
        resolve();
      } catch (error) {
        // Update state on failure
        if (globalState) {
          globalState.isInitialized = false;
          globalState.isInitializing = false;
          globalState.lastError = error instanceof Error ? 
            error.message : 'Unknown error during auth initialization';
        }
        
        // Emit initialization failed event
        emitAuthEvent('init_failed', { 
          source: config.source,
          isAuthenticated: false
        });
        
        console.error('AuthInitializer: Error during initialization', 
          error instanceof Error ? error.message : 'Unknown error');
        reject(error);
      } finally {
        if (globalState) {
          globalState.initPromise = null;
        }
      }
    });
    
    // Store the promise
    globalState.initPromise = initPromise;
    
    // Return the promise
    return await initPromise;
  }
  
  try {
    // Emit initialization start event
    emitAuthEvent('init_start', { source: config.source });
    
    // Log initialization attempt
    console.log(`AuthInitializer: Starting initialization (${instanceId})`, {
      source: config.source,
      forceApi: config.forceApi,
      forceTokenSync: config.forceTokenSync
    });
    
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
    let userId = null;
    try {
      // Import getToken as well
      const { getToken } = await import('../clients/token');
      const token = await getToken();
      if (token) {
        const user = getUserFromToken(token);
        isValid = !!user;
        userId = user?.id;
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
    
    // Emit initialization complete event
    emitAuthEvent('init_complete', { 
      source: config.source,
      userId,
      isAuthenticated: isValid
    });
  } catch (error) {
    // Update state on failure
    if (globalState) {
      globalState.isInitialized = false;
      globalState.isInitializing = false;
      globalState.lastError = error instanceof Error ? 
        error.message : 'Unknown error during auth initialization';
    }
    
    // Emit initialization failed event
    emitAuthEvent('init_failed', { 
      source: config.source,
      isAuthenticated: false
    });
    
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
    
    // Emit auth change event
    emitAuthEvent('auth_change', { isAuthenticated: false });
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
