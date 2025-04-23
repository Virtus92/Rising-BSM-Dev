'use client';

/**
 * AuthInitializer - A centralized utility to ensure proper authentication initialization
 * This serves as the single source of truth for authentication state and token management
 */

import { initializeApi, isApiInitialized } from '@/infrastructure/api/ApiInitializer';

// Global state tracking for authentication initialization
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

/**
 * Initialize authentication with proper token synchronization and handling
 * This is the centralized way to initialize auth state across the application
 * 
 * @param config Optional configuration
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeAuth(config: {
  forceApi?: boolean;
  forceTokenSync?: boolean;
  source?: string;
  timeout?: number;
  detectDuplicates?: boolean; // Whether to detect duplicate auth components
} = {}): Promise<void> {
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
  
  // Rate limit initialization to prevent storms
  if (globalState && !config.forceApi && !config.forceTokenSync && 
      now - globalState.lastInitTime < 2000) {
    console.log(`AuthInitializer: Throttling initialization (${instanceId})`);
    
    if (globalState.initPromise) {
      return globalState.initPromise;
    }
    return Promise.resolve();
  }
  
  // If already initialized and not forcing reinit, return immediately
  if (globalState?.isInitialized && !config.forceApi && !config.forceTokenSync) {
    console.log(`AuthInitializer: Already initialized, skipping (${instanceId})`);
    return Promise.resolve();
  }
  
  // If initialization is in progress, return existing promise
  if (globalState?.isInitializing && globalState?.initPromise) {
    console.log(`AuthInitializer: Initialization already in progress, waiting (${instanceId})`);
    return globalState.initPromise;
  }
  
  // Update state for new initialization
  if (globalState) {
    globalState.isInitializing = true;
    globalState.lastInitTime = now;
  }
  
  // Create the initialization promise with timeout protection
  const initPromise = async () => {
    try {
      // Check for duplicate AuthProvider instances if detection is enabled
      if (config.detectDuplicates !== false && typeof window !== 'undefined') {
        if ((window as any).__AUTH_PROVIDER_MOUNT_KEY) {
          const mountRegistry = (window as any).__AUTH_PROVIDER_MOUNT_KEY;
          if (mountRegistry.instances > 1 || (mountRegistry.activeProviders && mountRegistry.activeProviders.size > 1)) {
            console.warn(`AuthInitializer: Detected ${mountRegistry.instances} AuthProvider instances!`, {
              activeInstances: mountRegistry.activeProviders ? Array.from(mountRegistry.activeProviders) : [],
              mountTimes: mountRegistry.mountTimes
            });
            
            // Log more details about current React component tree in development
            if (process.env.NODE_ENV === 'development') {
              console.warn('Multiple AuthProvider instances can cause authentication issues. Please check your component hierarchy.');
            }
          }
        }
      }
      
      // First ensure API is initialized
      console.log(`AuthInitializer: Initializing API (${instanceId})`);
      await initializeApi({
        force: config.forceApi, 
        handleImbalancedTokens: true,
        autoRefreshToken: true,
        timeout: config.timeout || 15000,
        source: `auth-initializer-${instanceId}`
      });
      
      // Next, import and initialize TokenManager
      console.log(`AuthInitializer: Synchronizing tokens (${instanceId})`);
      const { TokenManager } = await import('@/infrastructure/auth/TokenManager');
      const syncResult = await TokenManager.synchronizeTokens(config.forceTokenSync || false);
      
      // Log the result
      console.log(`AuthInitializer: Token synchronization complete (${instanceId})`, { syncResult });
      
      // Check for auth token backup in localStorage
      const hasAuthTokenBackup = !!localStorage.getItem('auth_token_backup');
      const hasRefreshTokenBackup = !!localStorage.getItem('refresh_token_backup');
      
      // Check if we have cookies
      const cookies = document.cookie.split(';').map(c => c.trim());
      const hasAuthCookie = cookies.some(c => 
        c.startsWith('auth_token=') || 
        c.startsWith('auth_token_access=') || 
        c.startsWith('access_token=') || 
        c.startsWith('accessToken=')
      );
      const hasRefreshCookie = cookies.some(c => 
        c.startsWith('refresh_token=') || 
        c.startsWith('refresh_token_access=') || 
        c.startsWith('refresh=') || 
        c.startsWith('refreshToken=')
      );
      
      // Update token status in global state
      if (globalState?.tokens) {
        globalState.tokens.status = {
          hasAuthToken: hasAuthCookie || hasAuthTokenBackup,
          hasRefreshToken: hasRefreshCookie || hasRefreshTokenBackup,
          authExpiration: localStorage.getItem('auth_expires_at') || null
        };
        globalState.tokens.lastSync = Date.now();
      }
      
      // If we have a refresh token but no auth token, try to refresh
      if ((!hasAuthCookie && !hasAuthTokenBackup) && 
          (hasRefreshCookie || hasRefreshTokenBackup)) {
        console.log(`AuthInitializer: Found refresh token but no auth token, attempting refresh (${instanceId})`);
        
        try {
          const { ClientTokenManager } = await import('@/infrastructure/auth/ClientTokenManager');
          const refreshResult = await ClientTokenManager.refreshAccessToken();
          
          console.log(`AuthInitializer: Token refresh attempt result (${instanceId}):`, { refreshResult });
          
          // Update token status after refresh attempt
          if (globalState?.tokens) {
            globalState.tokens.lastRefresh = Date.now();
          }
        } catch (refreshError) {
          console.warn(`AuthInitializer: Error during token refresh (${instanceId}):`, refreshError);
        }
      }
      
      // Mark as initialized
      if (globalState) {
        globalState.isInitialized = true;
        globalState.isInitializing = false;
      }
      
      console.log(`AuthInitializer: Initialization complete (${instanceId})`);
    } catch (error) {
      console.error(`AuthInitializer: Error during initialization (${instanceId}):`, error);
      
      // Update state on failure
      if (globalState) {
        globalState.isInitialized = false;
        globalState.isInitializing = false;
        globalState.lastError = error instanceof Error ? 
          error.message : 'Unknown error during auth initialization';
      }
      
      throw error;
    }
  };
  
  // Store and execute the promise
  if (globalState) {
    globalState.initPromise = initPromise();
  }
  
  // Execute the promise
  try {
    await (globalState?.initPromise || initPromise());
    
    // Clear the promise reference after completion
    if (globalState) {
      globalState.initPromise = null;
      globalState.isInitializing = false;
    }
    
    return Promise.resolve();
  } catch (error) {
    // Clear promise on error
    if (globalState) {
      globalState.initPromise = null;
      globalState.isInitializing = false;
    }
    
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
 * Clear all authentication tokens and state
 */
export async function clearAuthState(): Promise<void> {
  try {
    // Import the token managers
    const [{ TokenManager }, { ClientTokenManager }] = await Promise.all([
      import('@/infrastructure/auth/TokenManager'),
      import('@/infrastructure/auth/ClientTokenManager')
    ]);
    
    // Clear tokens using both managers
    TokenManager.clearTokens();
    ClientTokenManager.clearTokens();
    
    // Reset initialization state
    resetAuthInitialization();
    
    // Notify about logout
    await TokenManager.notifyAuthChange(false);
    
    console.log('AuthInitializer: Auth state cleared successfully');
    return Promise.resolve();
  } catch (error) {
    console.error('AuthInitializer: Error clearing auth state:', error);
    throw error;
  }
}

// Export the token managers for direct access
export { TokenManager } from '@/infrastructure/auth/TokenManager';
export { ClientTokenManager } from '@/infrastructure/auth/ClientTokenManager';
