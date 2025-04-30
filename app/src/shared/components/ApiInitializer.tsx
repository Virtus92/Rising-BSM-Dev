'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiClient } from '@/core/api/ApiClient';

/**
 * ApiInitializer Component - React component that ensures the API client is properly initialized
 * with robust error throwing instead of fallbacks
 */
export default function ApiInitializer() {
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  
  // Create a stable instance ID for this component instance
  const instanceIdRef = useRef<string>(`api-init-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  const hasInitializedRef = useRef<boolean>(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track if we've attempted initialization in this render cycle (for React 18 strict mode)
  const hasAttemptedInitRef = useRef<boolean>(false);
  
  // Track component mount/unmount for debugging
  useEffect(() => {
    // Don't log on each strict mode render
    if (!hasAttemptedInitRef.current) {
      console.debug(`ApiInitializer component mounted (instance: ${instanceIdRef.current})`);
      // Mark that we've seen this render cycle
      hasAttemptedInitRef.current = true;
    }
    
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
    // Only initialize once per component instance (prevent React 18 double init)
    if (hasInitializedRef.current) {
      return;
    }
    
    // Check if it's already initialized globally
    if (typeof window !== 'undefined' && (window as any).__API_CLIENT_STATE?.initialized) {
      console.debug(`ApiInitializer: API already initialized globally (instance: ${instanceIdRef.current})`);
      hasInitializedRef.current = true;
      return;
    }
    
    // Set initializing state
    setIsInitializing(true);
    
    // Mark as initialized to prevent duplicate attempts from this component
    hasInitializedRef.current = true;
    
    console.log(`ApiInitializer: Starting initialization (instance: ${instanceIdRef.current})`);
    
    // Register this initialization with global state
    if (typeof window !== 'undefined') {
      if (!(window as any).__API_INITIALIZERS) {
        (window as any).__API_INITIALIZERS = {
          inProgress: 0,
          instances: {},
          lastInitTime: 0
        };
      }
      
      const apiState = (window as any).__API_INITIALIZERS;
      apiState.inProgress++;
      apiState.instances[instanceIdRef.current] = Date.now();
      apiState.lastInitTime = Date.now();
    }
    
    // Create timeout protection to prevent hanging initialization
    initTimeoutRef.current = setTimeout(() => {
      console.warn(`ApiInitializer: Initialization timeout (instance: ${instanceIdRef.current})`);
      setInitializationError(new Error('API initialization timed out'));
      setIsInitializing(false);
      
      // Cleanup global state
      if (typeof window !== 'undefined' && (window as any).__API_INITIALIZERS) {
        const apiState = (window as any).__API_INITIALIZERS;
        apiState.inProgress = Math.max(0, apiState.inProgress - 1);
        delete apiState.instances[instanceIdRef.current];
      }
    }, 25000); // 25 second timeout (increased for better reliability)
    
    // Perform initialization without fallbacks
    const performInitialization = async () => {
      try {
        // Check if there's already a global initialization going on in AuthInitializer
        if (typeof window !== 'undefined' && (window as any).__AUTH_INITIALIZER_STATE) {
          const authState = (window as any).__AUTH_INITIALIZER_STATE;
          
          // If auth initialization is in progress, wait for it instead of duplicating effort
          if (authState.isInitializing && authState.initPromise) {
            console.log('ApiInitializer: AuthInitializer already initializing, waiting for it to complete');
            try {
              await authState.initPromise;
              console.log('ApiInitializer: AuthInitializer completed, skipping duplicate initialization');
              // Mark as initialized to prevent duplicate initialization
              hasInitializedRef.current = true;
              setIsInitializing(false);
              return;
            } catch (authError) {
              console.warn('ApiInitializer: Error waiting for AuthInitializer', authError);
              // Do not continue with our own initialization - rethrow the error
              throw authError;
            }
          }
        }
        
        // Initialize API client
        await ApiClient.initialize({ 
          baseUrl: '/api',
          autoRefreshToken: true,
          force: false, // Don't force reinitialization unless necessary
          headers: {
            'X-Initialization-Source': `component-${instanceIdRef.current}`, // Track initialization source
          }
        });
        
        console.log('API Client initialized successfully');
        
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
        
        // Throw the error to propagate to error boundaries
        throw error;
      }
    };
    
    // Start initialization process
    performInitialization().catch(error => {
      console.error('API initialization process failed:', error);
      // We catch here only to prevent unhandled promise rejections
      // The error is already set in state through the try/catch above
    });
    
    // Cleanup function to clear timeout if component unmounts
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
  }, []);

  // If there was an error in initialization, render an error message for screen readers
  // and to make errors visible to users
  if (initializationError) {
    return (
      <div 
        className="p-4 my-4 border-l-4 border-red-500 bg-red-50 text-red-700" 
        role="alert" 
        aria-live="assertive"
      >
        <p className="font-bold">API Initialization Error</p>
        <p>{initializationError.message}</p>
        <p className="mt-2 text-sm">
          Please try refreshing the page. If the problem persists, contact support.
        </p>
      </div>
    );
  }

  // If initializing, render a minimal loading indicator
  if (isInitializing) {
    return (
      <div className="sr-only" aria-live="polite">
        Initializing application...
      </div>
    );
  }

  // When successfully initialized, render nothing visible
  return null;
}
