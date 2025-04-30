'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AuthErrorDisplay } from '@/shared/components/AuthErrorDisplay';
import { authErrorHandler } from '@/features/auth/utils/AuthErrorHandler';

interface AuthErrorBoundaryProps {
  /**
   * Child components
   */
  children: ReactNode;
  
  /**
   * Custom fallback component (optional)
   */
  fallback?: ReactNode | ((error: Error) => ReactNode);
  
  /**
   * Component name for error tracking
   */
  componentName?: string;
  
  /**
   * Whether to reset on route change
   */
  resetOnRouteChange?: boolean;
  
  /**
   * Show detailed error information
   */
  showDetails?: boolean;
}

interface AuthErrorBoundaryState {
  /**
   * Whether an error has occurred
   */
  hasError: boolean;
  
  /**
   * Current error
   */
  error: Error | null;
}

/**
 * Error boundary specialized for authentication and permission errors
 * Catches errors from authentication and permission checks and displays them properly
 */
export class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }
  
  // Reset error state when route changes if enabled
  componentDidMount() {
    if (this.props.resetOnRouteChange) {
      window.addEventListener('popstate', this.handleRouteChange);
    }
  }
  
  componentWillUnmount() {
    if (this.props.resetOnRouteChange) {
      window.removeEventListener('popstate', this.handleRouteChange);
    }
  }
  
  // Reset error state on route change
  handleRouteChange = () => {
    if (this.state.hasError) {
      this.setState({
        hasError: false,
        error: null
      });
    }
  };
  
  // Catch errors in child components
  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }
  
  // Log error details
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AuthErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Log to server if needed
    if (process.env.NODE_ENV === 'production') {
      try {
        fetch('/api/log/client-error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: {
              message: error.message,
              name: error.name,
              stack: error.stack
            },
            componentStack: errorInfo.componentStack,
            componentName: this.props.componentName || 'AuthErrorBoundary',
            url: window.location.href,
            timestamp: new Date().toISOString()
          })
        }).catch(e => {
          console.error('Failed to report error to server:', e);
        });
      } catch (e) {
        console.error('Error reporting to server:', e);
      }
    }
  }
  
  // Reset error state
  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };
  
  render() {
    const { children, fallback, componentName = 'unknown', showDetails = process.env.NODE_ENV === 'development' } = this.props;
    const { hasError, error } = this.state;
    
    if (hasError && error) {
      // If custom fallback is provided
      if (fallback) {
        if (typeof fallback === 'function') {
          return (fallback as (error: Error) => ReactNode)(error);
        }
        return fallback;
      }
      
      // Convert to AuthError for consistent display
      const authError = authErrorHandler.normalizeError(error, {
        component: componentName
      });
      
      // Default error display
      return (
        <div className="auth-error-boundary">
          <AuthErrorDisplay 
            error={authError} 
            showDetails={showDetails}
          />
          
          <div className="mt-4">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={this.resetErrorBoundary}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    
    return children;
  }
}

export default AuthErrorBoundary;
