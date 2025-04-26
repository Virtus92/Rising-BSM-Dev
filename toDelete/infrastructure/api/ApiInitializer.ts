'use client';

/**
 * ApiInitializer - A unified utility to ensure proper and consistent API Client initialization
 * This serves as the central coordinator for API initialization to prevent conflicts
 */

import ApiClient from '@/infrastructure/clients/ApiClient';
import { TokenManager } from '@/infrastructure/auth/TokenManager';
import { ClientTokenManager } from '@/infrastructure/auth/ClientTokenManager';

// Global state tracking with better structure to coordinate across components
const API_INITIALIZER_KEY = '__API_INITIALIZER_STATE';

// Set up global state for tracking initialization across components
if (typeof window !== 'undefined') {
  if (!(window as any)[API_INITIALIZER_KEY]) {
    (window as any)[API_INITIALIZER_KEY] = {
      isInitialized: false,
      isInitializing: false,
      lastInitTime: 0,
      initializationCount: 0,
      initializationErrors: [],
      initializationSource: null,
      initPromise: null
    };
  }
}

/**
 * Initialize the API client with consistent configuration
 * This is the single source of truth for API initialization with improved race condition handling
 * 
 * @param config Optional configuration parameters
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeApi(config: {
  baseUrl?: string;
  headers?: Record<string, string>;
  autoRefreshToken?: boolean;
  force?: boolean;
  source?: string; // Track initialization source for debugging
  handleImbalancedTokens?: boolean; // Handle refresh token without auth token
  timeout?: number; // Timeout for initialization in milliseconds
} = {}): Promise<void> {
  // Generate unique instance ID for this initialization attempt
  const instanceId = `init-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Access global state for coordination
  const globalState = typeof window !== 'undefined' ? (window as any)[API_INITIALIZER_KEY] : null;
  const now = Date.now();
  
  // Update initialization source for debugging
  if (globalState) {
    globalState.initializationCount = (globalState.initializationCount || 0) + 1;
    globalState.lastInitSource = config.source || instanceId;
  }
  
  // Log initialization attempt
  console.log(`API initialization attempt (${instanceId}):`, {
    source: config.source,
    force: config.force,
    isAlreadyInitialized: globalState?.isInitialized,
    isAlreadyInitializing: globalState?.isInitializing
  });
  
  // If already initialized and not forcing, return immediately
  if (globalState?.isInitialized && !config.force) {
    console.log(`API already initialized, skipping (${instanceId})`, { source: config.source });
    return Promise.resolve();
  }
  
  // Setup timeout protection
  const timeoutMs = config.timeout || 15000; // Default 15 seconds timeout
  let timeoutId: any = null;
  
  // Rate limit initialization requests to prevent storms
  if (!config.force && globalState && now - globalState.lastInitTime < 1000) {
    console.log(`API initialization throttled (${instanceId}), using existing state`, { source: config.source });
    // Return existing promise with timeout protection
    if (globalState.initPromise) {
      // Create a promise that will reject if the timeout occurs
      return Promise.race([
        globalState.initPromise,
        new Promise<void>((_, reject) => {
          timeoutId = setTimeout(() => {
            console.warn(`API initialization timeout (${instanceId}), breaking race condition`);
            reject(new Error('API initialization timeout'));
          }, timeoutMs);
        })
      ]).finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
      });
    }
    return Promise.resolve();
  }
  
  // If initialization is in progress, return existing promise with timeout protection
  if (globalState?.isInitializing && globalState?.initPromise && !config.force) {
    console.log(`API initialization already in progress (${instanceId}), waiting`, { source: config.source });
    // Create a promise that will reject if the timeout occurs
    return Promise.race([
      globalState.initPromise,
      new Promise<void>((_, reject) => {
        timeoutId = setTimeout(() => {
          console.warn(`API initialization timeout (${instanceId}), breaking race condition`);
          reject(new Error('API initialization timeout'));
        }, timeoutMs);
      })
    ]).finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });
  }
  
  // Update global state for new initialization
  if (globalState) {
    globalState.isInitializing = true;
    globalState.lastInitTime = now;
  }
  
  // Create a new initialization promise with timeout protection
  const initTask = async () => {
    try {
      // Initialize the API client
      await ApiClient.initialize({
        baseUrl: config.baseUrl || '/api',
        headers: {
          'Content-Type': 'application/json',
          'X-Initialization-Source': config.source || instanceId,
          'X-Instance-ID': instanceId,
          ...(config.headers || {})
        },
        autoRefreshToken: config.autoRefreshToken ?? true,
        force: config.force
      });
      
      // Check for imbalanced tokens (refresh token but no auth token)
      if (config.handleImbalancedTokens !== false) {
        console.log(`Checking for imbalanced token state (${instanceId})...`);
        try {
          // First synchronize tokens to ensure consistent state
          await TokenManager.synchronizeTokens(true);
          
          // Check if we have a refresh token but no auth token
          const hasAuthToken = !!localStorage.getItem('auth_token_backup');
          const hasRefreshToken = !!localStorage.getItem('refresh_token_backup');
          
          if (!hasAuthToken && hasRefreshToken) {
            console.log(`Detected imbalanced token state (${instanceId}): refresh token exists but no auth token`);
            console.log('Attempting to recover by performing token refresh');
            
            // Try to refresh the token to recover auth token
            await ClientTokenManager.refreshAccessToken();
          }
        } catch (tokenError) {
          console.warn(`Error handling imbalanced tokens during initialization (${instanceId}):`, tokenError);
          // Continue with initialization even if token handling fails
        }
      }
      
      // Mark as initialized in global state
      if (globalState) {
        globalState.isInitialized = true;
        globalState.isInitializing = false;
      }
      
      console.log(`API Client successfully initialized (${instanceId})`, { source: config.source });
      
      // Trigger token synchronization after successful API init
      if (config.autoRefreshToken !== false) {
        try {
          await TokenManager.synchronizeTokens(true);
        } catch (syncError) {
          console.warn(`Token synchronization failed after API init (${instanceId}):`, syncError);
          // Don't fail initialization if token sync fails
        }
      }
    } catch (error) {
      console.error(`API Client initialization failed (${instanceId}):`, error, { source: config.source });
      
      // Update global state on failure
      if (globalState) {
        globalState.isInitialized = false;
        globalState.isInitializing = false;
        globalState.initializationErrors.push({
          time: new Date().toISOString(),
          instanceId,
          message: error instanceof Error ? error.message : String(error),
          source: config.source
        });
      }
      
      // Re-throw to propagate the error
      throw error;
    }
  };
  
  // Create the initialization promise with timeout protection
  const initPromise = Promise.race([
    initTask(),
    new Promise<void>((_, reject) => {
      timeoutId = setTimeout(() => {
        console.warn(`API initialization timeout (${instanceId})`);
        if (globalState) {
          globalState.initializationErrors.push({
            time: new Date().toISOString(),
            instanceId,
            message: 'API initialization timeout',
            source: config.source
          });
        }
        reject(new Error('API initialization timeout'));
      }, timeoutMs);
    })
  ]).finally(() => {
    // Clear timeout
    if (timeoutId) clearTimeout(timeoutId);
    
    // Clear initialization state after a short delay
    setTimeout(() => {
      if (globalState && globalState.initPromise === initPromise) {
        globalState.initPromise = null;
        globalState.isInitializing = false;
      }
    }, 300);
  });
  
  // Store the promise in global state
  if (globalState) {
    globalState.initPromise = initPromise;
  }
  
  return initPromise;
}

/**
 * Check if API client is already initialized
 * Uses global state for more accurate tracking
 * 
 * @returns Boolean indicating initialization status
 */
export function isApiInitialized(): boolean {
  const globalState = typeof window !== 'undefined' ? (window as any)[API_INITIALIZER_KEY] : null;
  return globalState?.isInitialized === true && !globalState?.isInitializing;
}

/**
 * Get API initialization status details
 * Useful for debugging initialization issues
 */
export function getApiInitializationStatus(): Record<string, any> {
  const globalState = typeof window !== 'undefined' ? (window as any)[API_INITIALIZER_KEY] : null;
  
  if (!globalState) {
    return { available: false };
  }
  
  return {
    available: true,
    isInitialized: globalState.isInitialized,
    isInitializing: globalState.isInitializing,
    lastInitTime: new Date(globalState.lastInitTime).toISOString(),
    initializationCount: globalState.initializationCount,
    hasErrors: globalState.initializationErrors.length > 0,
    errorCount: globalState.initializationErrors.length,
    lastError: globalState.initializationErrors[globalState.initializationErrors.length - 1],
    source: globalState.initializationSource
  };
}

/**
 * Reset API initialization status
 * Used for testing and recovery from failed states
 */
export function resetApiInitialization(): void {
  const globalState = typeof window !== 'undefined' ? (window as any)[API_INITIALIZER_KEY] : null;
  
  if (globalState) {
    globalState.isInitialized = false;
    globalState.isInitializing = false;
    globalState.initPromise = null;
    // Keep errors and counts for debugging
  }
}

// Export the ApiClient instance for convenience
export { ApiClient };
