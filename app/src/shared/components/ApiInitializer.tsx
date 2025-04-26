'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiClient } from '@/core/api/ApiClient';

/**
 * ApiInitializer Component - React component that ensures the API client is properly initialized
 * This component coordinates with the ApiInitializer service to avoid duplication and race conditions
 */
export default function ApiInitializer() {
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  
  // Create a stable instance ID for this component instance
  const instanceIdRef = useRef<string>(`api-init-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  const hasInitializedRef = useRef<boolean>(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track component mount/unmount for debugging
  useEffect(() => {
    console.debug(`ApiInitializer component mounted (instance: ${instanceIdRef.current})`);
    
    return () => {
      // Clear any pending timeouts
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      console.debug(`ApiInitializer component unmounted (instance: ${instanceIdRef.current})`);
    };
  }, []);
  
  // Handle the actual initialization logic in a separate effect
  useEffect(() => {
    // Skip if this instance has already attempted initialization
    if (hasInitializedRef.current) {
      return;
    }
    
    // Set initializing state
    setIsInitializing(true);
    
    // Mark as initialized to prevent duplicate attempts from this component
    hasInitializedRef.current = true;
    
    console.log(`ApiInitializer: Starting initialization (instance: ${instanceIdRef.current})`);
    
    // Create timeout protection to prevent hanging initialization
    initTimeoutRef.current = setTimeout(() => {
      console.warn(`ApiInitializer: Initialization timeout (instance: ${instanceIdRef.current})`);
      setInitializationError(new Error('API initialization timed out'));
      setIsInitializing(false);
    }, 20000); // 20 second timeout (increased from 15s)
    
    // Perform initialization in stages with better error handling
    const performInitialization = async () => {
      try {
        // Clear existing data before initializing
        if (typeof localStorage !== 'undefined') {
          const authTimestamp = localStorage.getItem('auth_timestamp');
          const lastSync = localStorage.getItem('token_sync_timestamp');
          const now = Date.now();
          
          // Check if tokens might be very old/stale (over 1 hour since last activity)
          if (authTimestamp && now - parseInt(authTimestamp, 10) > 60 * 60 * 1000) {
            console.log('Auth tokens may be stale, clearing before initialization');
            // Import and clear tokens
            const { ClientTokenManager } = await import('@/features/auth/lib/clients/token/ClientTokenManager');
            ClientTokenManager.clearTokens();
          }
        }
        
        // Step 1: Initialize API client
        await ApiClient.initialize({ 
          baseUrl: '/api',
          autoRefreshToken: true,
          force: false, // Don't force reinitialization unless necessary
          headers: {
            'X-Initialization-Source': `component-${instanceIdRef.current}`, // Track initialization source
          }
        });
        
        console.log('API Client initialized successfully');
        
        // Step 2: Synchronize tokens
        const { TokenManager } = await import('@/features/auth/lib/clients/token/TokenManager');
        await TokenManager.synchronizeTokens(true);
        console.log('Tokens synchronized after initialization');
        
        // Step 3: Check for token imbalance and fix if needed
        const { ClientTokenManager } = await import('@/features/auth/lib/clients/token/ClientTokenManager');
        
        // Check all possible token locations
        const hasAuthToken = !!localStorage.getItem('auth_token_backup');
        const hasRefreshToken = !!localStorage.getItem('refresh_token_backup');
        
        // Check cookies as well
        let hasAuthCookie = false;
        let hasRefreshCookie = false;
        
        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(';').map(c => c.trim());
          hasAuthCookie = cookies.some(c => c.startsWith('auth_token=') || c.startsWith('access_token='));
          hasRefreshCookie = cookies.some(c => c.startsWith('refresh_token='));
        }
        
        console.log('Token status after API initialization:', {
          hasAuthToken,
          hasRefreshToken, 
          hasAuthCookie,
          hasRefreshCookie
        });
        
        // Fix token imbalance if we have refresh token but no auth token
        if ((!hasAuthToken && hasRefreshToken) || (!hasAuthCookie && hasRefreshCookie)) {
          console.log('Found imbalanced token state (refresh token exists but no auth token), attempting to refresh');
          await ClientTokenManager.refreshAccessToken();
          
          // Synchronize again after refresh
          await TokenManager.synchronizeTokens(true);
          
          // Log status after refresh attempt
          const hasAuthTokenAfter = !!localStorage.getItem('auth_token_backup');
          console.log('Auth token after refresh attempt:', { hasAuthTokenAfter });
        }
        
        // Initialization complete
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
          initTimeoutRef.current = null;
        }
        
        setIsInitializing(false);
      } catch (error) {
        // Handle initialization error
        console.error('API Client initialization failed:', error as Error);
        
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
          initTimeoutRef.current = null;
        }
        
        setInitializationError(error instanceof Error ? error : new Error(String(error)));
        setIsInitializing(false);
        
        // Redirect to login page for auth-related errors when not on auth pages
        const isAuthError = error instanceof Error && 
          (error.message.includes('auth') || 
           error.message.includes('token') || 
           error.message.includes('unauthorized') || 
           error.message.includes('401'));
        
        // Check if we should redirect
        if (isAuthError && 
            typeof window !== 'undefined' && 
            window.location.pathname !== '/auth/login' && 
            window.location.pathname !== '/auth/register' && 
            !window.location.pathname.startsWith('/api/')) {
          console.warn('API initialization failed due to auth error - redirecting to login');
          
          // Try to clear tokens before redirecting
          try {
            const { ClientTokenManager } = await import('@/features/auth/lib/clients/token/ClientTokenManager');
            ClientTokenManager.clearTokens();
          } catch (e) {
            console.warn('Failed to clear tokens before redirect:', e);
          }
          
          // Add a delay to ensure error state is properly set
          setTimeout(() => {
            window.location.href = `/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}&error=api_init`;
          }, 300);
        }
      }
    };
    
    // Start initialization process
    performInitialization();
    
    // Cleanup function to clear timeout if component unmounts
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
  }, []);

  // If there was an error in initialization, render an invisible alert for screen readers
  if (initializationError) {
    return (
      <div style={{ display: 'none' }} role="alert" aria-live="assertive">
        API Initialization Error: {initializationError.message}
      </div>
    );
  }

  // This component doesn't render anything visible in normal cases
  return null;
}