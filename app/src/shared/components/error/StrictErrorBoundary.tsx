'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { getLogger } from '@/core/logging';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo, resetError: () => void) => React.ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Strict Error Boundary Component
 * 
 * Unlike regular error boundaries that silently catch errors, this component
 * will log detailed error information and provide clear context about what failed.
 */
export class StrictErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
    
    this.resetError = this.resetError.bind(this);
  }
  
  // Catch errors during render
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }
  
  // Log details when error is caught
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const logger = getLogger();
    
    const context = this.props.componentName 
      ? `in component ${this.props.componentName}`
      : 'in React component';
    
    logger.error(`Strict Error Boundary caught error ${context}`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      componentStack: errorInfo.componentStack
    });
    
    // Update state with error details
    this.setState({
      errorInfo
    });
    
    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  // Reset error state
  resetError(): void {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }
  
  // Reset on props change if enabled
  componentDidUpdate(prevProps: Props): void {
    if (
      this.props.resetOnPropsChange &&
      this.state.hasError &&
      prevProps.children !== this.props.children
    ) {
      this.resetError();
    }
  }
  
  render(): ReactNode {
    const { children, fallback } = this.props;
    const { hasError, error, errorInfo } = this.state;
    
    if (hasError && error) {
      // If fallback is a function, call it with error details
      if (typeof fallback === 'function' && errorInfo) {
        return fallback(error, errorInfo, this.resetError);
      }
      
      // If fallback is a ReactNode, return it
      if (fallback) {
        return fallback as ReactNode;
      }
      
      // Default error UI
      return (
        <div className="strict-error-boundary">
          <h2>Application Error</h2>
          <p>A component error occurred.</p>
          <details>
            <summary>Details</summary>
            <p>{error.toString()}</p>
            {errorInfo && (
              <pre>{errorInfo.componentStack}</pre>
            )}
          </details>
          <button 
            onClick={this.resetError}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    
    return children;
  }
}

/**
 * HOC to wrap a component with StrictErrorBoundary
 */
export function withStrictErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<Props, 'children'> = {}
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <StrictErrorBoundary 
      {...options} 
      componentName={Component.displayName || Component.name}
    >
      <Component {...props} />
    </StrictErrorBoundary>
  );
  
  WithErrorBoundary.displayName = `WithStrictErrorBoundary(${Component.displayName || Component.name})`;
  
  return WithErrorBoundary;
}

export default StrictErrorBoundary;