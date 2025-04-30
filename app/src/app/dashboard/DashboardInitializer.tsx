'use client';

/**
 * DashboardInitializer Component
 * 
 * Handles authentication initialization for dashboard pages with proper error handling
 * Uses clean architecture without fallbacks or workarounds
 */
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { TokenManager } from '@/features/auth/lib/clients/token';
import { ValidationError } from '@/core/errors/types/AppError';
import { getLogger } from '@/core/logging';

const logger = getLogger();

/**
 * Error types for tracking initialization issues
 */
enum InitErrorType {
  AUTH_FAILED = 'AUTH_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Error information for tracking
 */
interface InitError {
  type: InitErrorType;
  message: string;
  timestamp: number;
  details?: any;
}

/**
 * DashboardInitializer
 * 
 * Ensures users are authenticated before accessing dashboard pages
 * Handles proper error scenarios without fallbacks
 */
export default function DashboardInitializer() {
  const router = useRouter();
  const { refreshAuth, isAuthenticated, isLoading: authProviderInitializing } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<InitError | null>(null);
  const initializingRef = useRef(false);
  
  // Only initialize once
  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;
    
    const initDashboard = async () => {
      try {
        // First check if already authenticated in auth provider
        if (isAuthenticated && !authProviderInitializing) {
          setIsInitializing(false);
          return;
        }
        
        // Initialize auth
        logger.info('DashboardInitializer: Refreshing authentication');
        
        // Add timeout protection
        const refreshPromise = refreshAuth();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Auth refresh timed out')), 10000)
        );
        
        // Race the refresh against a timeout
        const refreshResult = await Promise.race([refreshPromise, timeoutPromise]);
        
        // If refresh successful, we're done
        if (refreshResult === true) {
          logger.info('DashboardInitializer: Authentication successful');
          setIsInitializing(false);
          return;
        }
        
        // If refresh unsuccessful (returned false), redirect to login
        logger.warn('DashboardInitializer: Authentication failed, redirecting to login');
        
        // Include error info in redirect
        const errorInfo = encodeURIComponent(JSON.stringify({ 
          type: InitErrorType.AUTH_FAILED,
          message: 'Authentication refresh failed with result: false',
          timestamp: Date.now()
        }));
        
        router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}&errorInfo=${errorInfo}`);
      } catch (error) {
        // Handle specific error types
        let errorType = InitErrorType.UNKNOWN;
        let errorDetails = null;
        
        if (error instanceof ValidationError) {
          errorType = InitErrorType.AUTH_FAILED;
          errorDetails = {
            validationErrors: error
          };
        } else if (
          error instanceof Error && 
          (error.message.includes('network') || error.message.includes('fetch'))
        ) {
          errorType = InitErrorType.NETWORK_ERROR;
        } else if (
          error instanceof Error && 
          error.message.includes('timeout')
        ) {
          errorType = InitErrorType.TIMEOUT;
        } else if (
          error instanceof Error && 
          (error.message.includes('token') || error.message.includes('jwt'))
        ) {
          errorType = InitErrorType.TOKEN_INVALID;
        }
        
        // Create detailed error object
        const errorObj: InitError = {
          type: errorType,
          message: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
          details: errorDetails || (error instanceof Error ? { stack: error.stack } : null)
        };
        
        // Set error state for UI rendering
        setError(errorObj);
        
        logger.error('DashboardInitializer: Error during initialization', {
          errorType,
          error: error instanceof Error ? {
            message: error.message,
            name: error.name,
            stack: error.stack
          } : String(error),
          timestamp: errorObj.timestamp
        });
        
        // Redirect to login with error information
        const errorInfo = encodeURIComponent(JSON.stringify({ 
          type: errorObj.type,
          message: errorObj.message,
          timestamp: errorObj.timestamp
        }));
        
        router.push(`/auth/login?error=init_failed&errorInfo=${errorInfo}&returnUrl=${encodeURIComponent(window.location.pathname)}`);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initDashboard();
  }, [router, refreshAuth, isAuthenticated, authProviderInitializing]);
  
  // Render an error state if there's an error
  if (error) {
    return (
      <div className="p-4 my-4 border-l-4 border-red-500 bg-red-50 text-red-700">
        <p className="font-bold">Authentication Error</p>
        <p>{error.message}</p>
        <p className="mt-2 text-sm">
          Please try refreshing the page or log in again.
        </p>
      </div>
    );
  }
  
  // Render a loading state if initializing
  if (isInitializing) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
          <p className="mt-2">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // Otherwise render nothing
  return null;
}
