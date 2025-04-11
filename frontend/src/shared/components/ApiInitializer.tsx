'use client';

import { useEffect } from 'react';
import { ApiClient } from '@/infrastructure/clients/ApiClient';

// GLOBAL FLAG TO ENSURE INITIALIZATION HAPPENS ONLY ONCE
// This is critically important for Next.js with React Strict Mode
let apiInitializerMounted = false;

// Make sure we have global state tracking
if (typeof window !== 'undefined' && typeof (window as any).__API_INITIALIZER_MOUNTED === 'undefined') {
  (window as any).__API_INITIALIZER_MOUNTED = false;
}

export default function ApiInitializer() {
  useEffect(() => {
    // Check both module-level and window-level flags
    if (apiInitializerMounted || (typeof window !== 'undefined' && (window as any).__API_INITIALIZER_MOUNTED)) {
      console.log('ApiInitializer already mounted, skipping re-initialization');
      return;
    }
    
    // Set flag immediately to prevent duplicate initializations
    apiInitializerMounted = true;
    
    // Initialize the API client
    ApiClient.initialize({ baseUrl: '/api' })
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
        }
      });
    
    // Cleanup function that runs when component unmounts
    return () => {
      // We intentionally DO NOT reset the flag on unmount
      // This ensures initialization happens only once across remounts
      // apiInitializerMounted = false;
    };
  }, []);

  return null; // This component doesn't render anything
}