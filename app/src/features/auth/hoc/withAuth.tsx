'use client';

/**
 * Higher-Order Component (HOC) for protecting client components with authentication
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { getLogger } from '@/core/logging';

// Logger for auth HOC
const logger = getLogger();

// Options for withAuth HOC
interface WithAuthOptions {
  redirectTo?: string; // Redirect path for unauthenticated users
  role?: string | string[]; // Required role(s)
  loadingComponent?: React.ReactNode; // Custom loading component
}

/**
 * Higher-Order Component for protecting routes with authentication
 * 
 * @param WrappedComponent Component to protect
 * @param options Auth options
 * @returns Protected component
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  // Set default options
  const { 
    redirectTo = '/auth/login',
    role = undefined,
    loadingComponent = <div className="flex items-center justify-center min-h-screen">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
                            <p className="text-lg">Verifying authentication...</p>
                          </div>
                        </div>
  } = options;
  
  // Return new component
  function WithAuthComponent(props: P) {
    const { isAuthenticated, isLoading, user, refreshAuth } = useAuth();
    const router = useRouter();
    
    // Check auth on mount and when auth state changes
    useEffect(() => {
      // Skip if still loading
      if (isLoading) return;
      
      async function checkAuth() {
        // If not authenticated, redirect to login
        if (!isAuthenticated) {
          logger.info('User not authenticated, redirecting to login');
          
          // Add return URL for redirect back after login
          const returnUrl = encodeURIComponent(window.location.pathname);
          router.push(`${redirectTo}?returnUrl=${returnUrl}`);
          return;
        }
        
        // If role check is needed
        if (role && user) {
          // Check if user has required role
          const hasRequiredRole = Array.isArray(role)
            ? role.includes(user.role as string)
            : user.role === role;
            
          if (!hasRequiredRole) {
            logger.warn(`User does not have required role: ${Array.isArray(role) ? role.join(', ') : role}`);
            router.push('/dashboard');
            return;
          }
        }
      }
      
      checkAuth();
    }, [isAuthenticated, isLoading, user, router, refreshAuth]);
    
    // If still loading, show loading component
    if (isLoading) {
      return <>{loadingComponent}</>;
    }
    
    // If authenticated (and has required role if specified), render the wrapped component
    if (isAuthenticated && (!role || (user && 
        (Array.isArray(role) ? role.includes(user.role as string) : user.role === role)))) {
      return <WrappedComponent {...props} />;
    }
    
    // Otherwise, render nothing while redirecting
    return null;
  }
  
  // Set display name for debugging
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithAuthComponent.displayName = `withAuth(${displayName})`;
  
  return WithAuthComponent;
}

export default withAuth;
