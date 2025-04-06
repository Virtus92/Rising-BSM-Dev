'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    console.error('Fehler in Komponente abgefangen:', error, errorInfo);
    
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
        return this.props.fallback;
      }
      
      return (
        <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-red-800">Ein Fehler ist aufgetreten</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{this.state.error?.message || 'Unbekannter Fehler'}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded bg-red-50 px-2 py-1.5 text-sm font-semibold text-red-800 shadow-sm hover:bg-red-100"
                >
                  Seite neu laden
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Standard Fehler-Fallback Komponente
 */
export function ErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error?: Error; 
  resetErrorBoundary?: () => void;
}): ReactNode {
  return (
    <div className="p-6 rounded-lg bg-red-50 shadow-sm border border-red-100">
      <h2 className="text-lg font-semibold text-red-800 mb-2">Etwas ist schiefgelaufen</h2>
      <p className="text-red-700 mb-4">{error?.message || 'Ein unerwarteter Fehler ist aufgetreten.'}</p>
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Erneut versuchen
        </button>
      )}
    </div>
  );
}

export default ErrorBoundary;
