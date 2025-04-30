'use client';

import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorFallbackProps {
  error?: Error | null;
  resetErrorBoundary?: () => void;
  title?: string;
  message?: string;
  retry?: () => void;
}

/**
 * ErrorBoundary-Komponente fängt JavaScript-Fehler in der gesamten
 * Komponentenstruktur darunter ab und protokolliert diese.
 * 
 * Beispiel-Verwendung:
 * <ErrorBoundary
 *   fallback={<ErrorFallback />}
 *   onError={(error, info) => logError(error, info)}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Aktualisiert den State, so dass der nächste Render die Fallback-UI zeigt
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Fehlerinformationen protokollieren
    console.error('Error caught in ErrorBoundary:', error, errorInfo);
    
    // Optional: Fehler an Callback übergeben
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Fehlerinfo im State speichern
    this.setState({ errorInfo });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Benutzerdefiniertes Fallback oder Standard-Fehlernachricht
      if (this.props.fallback) {
        if (React.isValidElement(this.props.fallback)) {
          // For React elements, we need to be careful with typing when cloning
          const resetErrorBoundary = () => this.setState({ hasError: false });
          
          // A safer approach that doesn't trigger TypeScript errors
          return React.createElement(
            this.props.fallback.type,
            {
              ...this.props.fallback.props,
              error: this.state.error,
              resetErrorBoundary
            }
          );
        }
        return this.props.fallback;
      }
      
      return <ErrorFallback error={this.state.error} resetErrorBoundary={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

/**
 * Function-based error boundary using hooks
 * Use this for clients that need hook functionality
 */
export function ErrorBoundaryWithHooks({ 
  children,
  fallback,
  onError
}: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (errorEvent: ErrorEvent) => {
      console.error("Caught in ErrorBoundary:", errorEvent);
      setHasError(true);
      const actualError = errorEvent.error || new Error(errorEvent.message);
      setError(actualError);
      
      if (onError) {
        onError(actualError, { componentStack: '' });
      }
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, [onError]);

  if (hasError) {
    if (fallback) {
      if (React.isValidElement(fallback)) {
        const resetErrorBoundary = () => setHasError(false);
        
        // A safer approach that doesn't trigger TypeScript errors
        return React.createElement(
          fallback.type,
          {
            ...fallback.props,
            error,
            resetErrorBoundary
          }
        );
      }
      return fallback;
    }
    
    return <ErrorFallback error={error} resetErrorBoundary={() => setHasError(false)} />;
  }

  return <>{children}</>;
}

/**
 * Standard Fehler-Fallback Komponente
 */
export function ErrorFallback({ 
  error, 
  resetErrorBoundary,
  title = "Something went wrong",
  message
}: ErrorFallbackProps): ReactNode {
  return (
    <div className="p-6 rounded-lg bg-red-50 dark:bg-red-950/20 shadow-sm border border-red-100 dark:border-red-900/30">
      <h2 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">{title}</h2>
      <p className="text-red-700 dark:text-red-400 mb-4">{message || error?.message || 'An unexpected error occurred.'}</p>
      {process.env.NODE_ENV === 'development' && error?.stack && (
        <details className="mb-4">
          <summary className="cursor-pointer text-sm text-red-700 dark:text-red-400">Show Stack Trace</summary>
          <pre className="mt-2 text-xs overflow-auto p-3 bg-red-100 dark:bg-red-900/30 rounded">
            {error.stack}
          </pre>
        </details>
      )}
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorBoundary;
