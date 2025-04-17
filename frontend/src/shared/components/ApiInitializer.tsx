'use client';

import { useEffect, useRef } from 'react';
import { ApiClient } from '@/infrastructure/clients/ApiClient';

// GLOBAL FLAG TO ENSURE INITIALIZATION HAPPENS ONLY ONCE
// This is critically important for Next.js with React Strict Mode
let apiInitializerMounted = false;

// Make sure we have global state tracking
if (typeof window !== 'undefined') {
  if (typeof (window as any).__API_INITIALIZER_MOUNTED === 'undefined') {
    (window as any).__API_INITIALIZER_MOUNTED = false;
  }
  if (typeof (window as any).__API_INITIALIZER_PROMISE === 'undefined') {
    (window as any).__API_INITIALIZER_PROMISE = null;
  }
}

export default function ApiInitializer() {
  const initializationPromiseRef = useRef<Promise<void> | null>(null);
  
  useEffect(() => {
    // Capture the current window global promise if it exists
    if (typeof window !== 'undefined' && (window as any).__API_INITIALIZER_PROMISE) {
      initializationPromiseRef.current = (window as any).__API_INITIALIZER_PROMISE;
    }
    
    // Check both module-level and window-level flags
    if (apiInitializerMounted || (typeof window !== 'undefined' && (window as any).__API_INITIALIZER_MOUNTED)) {
      console.log('ApiInitializer already mounted, skipping re-initialization');
      return;
    }
    
    // If we already have an initialization in progress, don't start a new one
    if (initializationPromiseRef.current) {
      console.log('API initialization already in progress');
      return;
    }
    
    // Set flag immediately to prevent duplicate initializations
    apiInitializerMounted = true;
    
    // Create and store the initialization promise
    const initPromise = ApiClient.initialize({ baseUrl: '/api' })
      .then(() => {
        if (typeof window !== 'undefined') {
          (window as any).__API_INITIALIZER_MOUNTED = true;
          console.log('API Client initialized successfully by ApiInitializer');
        }
      })
      .catch(error => {
        console.error('API Client initialization failed:', error);
        // Allow retry if initialization fails
        apiInitializerMounted = false;
        if (typeof window !== 'undefined') {
          (window as any).__API_INITIALIZER_MOUNTED = false;
          // Log out the user if API initialization fails to prevent infinite loops
          if (window.location.pathname !== '/auth/login') {
            console.warn('API initialization failed and user not on login page, redirecting to login');
            setTimeout(() => {
              window.location.href = `/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
            }, 300);
          }
        }
      })
      .finally(() => {
        // Clear the promise reference when done
        initializationPromiseRef.current = null;
        if (typeof window !== 'undefined') {
          (window as any).__API_INITIALIZER_PROMISE = null;
        }
      });
    
    // Store the promise both in component ref and window global
    initializationPromiseRef.current = initPromise;
    if (typeof window !== 'undefined') {
      (window as any).__API_INITIALIZER_PROMISE = initPromise;
    }
    
    // Cleanup function that runs when component unmounts
    return () => {
      // We intentionally DO NOT reset the mounted flag on unmount
      // This ensures initialization happens only once across remounts
      // apiInitializerMounted = false;
    };
  }, []);

  return null; // This component doesn't render anything
}