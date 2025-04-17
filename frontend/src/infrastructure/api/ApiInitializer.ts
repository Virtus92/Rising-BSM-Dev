'use client';

/**
 * ApiInitializer - A utility to ensure proper and consistent API Client initialization
 * This helps prevent client-side API call errors due to missing initialization.
 */

import ApiClient from '@/infrastructure/clients/ApiClient';

// Keep track of initialization status
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize the API client with consistent configuration
 * 
 * @param config Optional configuration parameters
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeApi(config: {
  baseUrl?: string;
  headers?: Record<string, string>;
  autoRefreshToken?: boolean;
} = {}): Promise<void> {
  // If already initialized, return immediately
  if (isInitialized) {
    return Promise.resolve();
  }
  
  // If initialization is in progress, return the existing promise
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Create a new initialization promise
  initializationPromise = ApiClient.initialize({
    baseUrl: config.baseUrl || '/api',
    headers: {
      'Content-Type': 'application/json',
      ...(config.headers || {})
    },
    autoRefreshToken: config.autoRefreshToken ?? true
  }).then(() => {
    isInitialized = true;
    console.log('API Client successfully initialized');
    
    // Clear the promise after completion (with slight delay to prevent race conditions)
    setTimeout(() => {
      initializationPromise = null;
    }, 100);
  }).catch((error) => {
    console.error('API Client initialization failed:', error);
    isInitialized = false;
    
    // Clear the promise after completion
    setTimeout(() => {
      initializationPromise = null;
    }, 100);
    
    // Re-throw to propagate the error
    throw error;
  });
  
  return initializationPromise;
}

/**
 * Check if API client is already initialized
 * 
 * @returns Boolean indicating initialization status
 */
export function isApiInitialized(): boolean {
  return isInitialized;
}

/**
 * Reset API initialization status (mostly for testing purposes)
 */
export function resetApiInitialization(): void {
  isInitialized = false;
  initializationPromise = null;
}

// Export the ApiClient instance for convenience
export { ApiClient };
