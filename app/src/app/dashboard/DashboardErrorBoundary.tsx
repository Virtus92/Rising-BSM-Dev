'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { removeItem } from '@/shared/utils/storage/cookieStorage';

interface ErrorBoundaryProps {
  error: Error;
  reset: () => void;
}

/**
 * Dashboard Error Boundary
 * 
 * Provides graceful error handling for the dashboard
 */
export default function DashboardErrorBoundary(
  { error, reset }: ErrorBoundaryProps
) {
  const router = useRouter();
  const [errorInfo, setErrorInfo] = useState({
    message: error.message || 'An unexpected error occurred',
    stack: error.stack || '',
    timeOccurred: new Date().toISOString()
  });
  
  // Log error when component mounts
  useEffect(() => {
    console.error('Dashboard Error Boundary caught error:', {
      message: errorInfo.message,
      stack: errorInfo.stack,
      time: errorInfo.timeOccurred
    });
    
    // Log to server if available
    try {
      fetch('/api/log/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: errorInfo.message,
          stack: errorInfo.stack,
          source: 'dashboard',
          url: window.location.href,
          timestamp: errorInfo.timeOccurred
        }),
        // Don't wait for response
        keepalive: true
      }).catch(() => {
        // Ignore errors from error logging
      });
    } catch (loggingError) {
      // Ignore errors from error logging
    }
  }, [errorInfo]);

  // Determine error type for better handling
  const isAuthError = errorInfo.message.toLowerCase().includes('auth') || 
                      errorInfo.message.toLowerCase().includes('token') || 
                      errorInfo.message.toLowerCase().includes('permission') || 
                      errorInfo.message.toLowerCase().includes('unauthorized') || 
                      errorInfo.message.toLowerCase().includes('forbidden');
                      
  // Check for network connectivity issues
  const isNetworkError = errorInfo.message.toLowerCase().includes('network') ||
                         errorInfo.message.toLowerCase().includes('failed to fetch') ||
                         errorInfo.message.toLowerCase().includes('connection') ||
                         errorInfo.message.toLowerCase().includes('offline') ||
                         navigator.onLine === false;
                         
  // Check for API timeouts and server errors
  const isServerError = errorInfo.message.toLowerCase().includes('timeout') ||
                         errorInfo.message.toLowerCase().includes('500') ||
                         errorInfo.message.toLowerCase().includes('server error') ||
                         errorInfo.message.toLowerCase().includes('service unavailable');
                         
  // Check for CORS issues
  const isCorsError = errorInfo.message.toLowerCase().includes('cors') ||
                     errorInfo.message.toLowerCase().includes('cross-origin');

  const handleRetry = () => {
    // Force reload if it's a network error as a simple reset may not be enough
    if (isNetworkError || isServerError) {
      window.location.reload();
    } else {
      // Reset error boundary
      reset();
    }
  };
  
  // Attempt to automatically recover from temporary network issues
  useEffect(() => {
    // Only set up auto-retry for network issues
    if (isNetworkError) {
      // Create a network recovery listener
      const handleOnline = () => {
        console.log('Network connection restored, attempting recovery...');
        setTimeout(() => reset(), 1000); // Small delay to ensure connection is stable
      };
      
      // Listen for online event
      window.addEventListener('online', handleOnline);
      
      // Set a timer to automatically retry after a delay
      const retryTimer = setTimeout(() => {
        if (navigator.onLine) {
          console.log('Auto-retry after network error');
          reset();
        }
      }, 5000); // 5 second auto-retry
      
      return () => {
        window.removeEventListener('online', handleOnline);
        clearTimeout(retryTimer);
      };
    }
  }, [isNetworkError, reset]);

  const handleLogout = () => {
    // Clear any authentication state
    try {
      document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'auth_token_access=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      removeItem('auth_token_backup');
      removeItem('refresh_token_backup');
    } catch (e) {
      // Ignore errors during cleanup
    }
    
    // Redirect to login
    router.push('/auth/login?error=session');
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <CardTitle className="text-xl">Something went wrong</CardTitle>
          </div>
          <CardDescription>
            We encountered an unexpected error while loading the dashboard.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm font-mono overflow-auto max-h-32">
            {errorInfo.message}
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            {isAuthError 
              ? 'This appears to be related to your login session. You may need to log in again.'
              : isNetworkError
                ? 'It looks like you may be experiencing network connectivity issues. Please check your internet connection.'
                : isServerError
                  ? 'Our servers appear to be experiencing issues. Please try again in a few moments.'
                  : isCorsError
                    ? 'There appears to be a security configuration issue. Please contact support.'
                    : 'You can try refreshing the page or contact support if the problem persists.'}
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRetry}
            className="space-x-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
          
          {isAuthError && (
            <Button onClick={handleLogout}>
              Log In Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}