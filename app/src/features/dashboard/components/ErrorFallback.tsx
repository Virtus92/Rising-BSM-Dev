'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { ErrorBoundaryWithHooks as SharedErrorBoundary } from '@/shared/components/error/ErrorBoundary';

interface ErrorFallbackProps {
  error?: Error | null;
  title?: string;
  message?: string;
  retry?: () => void;
  resetErrorBoundary?: () => void;
}

/**
 * A specialized dashboard error fallback component with dashboard styling
 */
export function ErrorFallback({ 
  error, 
  title = "Something went wrong", 
  message = "There was an error loading this component. The issue has been reported.",
  retry,
  resetErrorBoundary
}: ErrorFallbackProps) {
  // Use retry function if provided, otherwise use resetErrorBoundary
  const handleRetry = () => {
    if (retry) {
      retry();
    } else if (resetErrorBoundary) {
      resetErrorBoundary();
    }
  };

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-base text-destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{message}</p>
        {error && process.env.NODE_ENV === 'development' && (
          <div className="mt-2 rounded bg-destructive/10 p-2 text-xs text-destructive">
            <p className="font-mono">{error.message}</p>
          </div>
        )}
        {(retry || resetErrorBoundary) && (
          <button 
            onClick={handleRetry}
            className="mt-3 text-xs bg-destructive/10 hover:bg-destructive/20 text-destructive px-2 py-1 rounded"
          >
            Try again
          </button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * A wrapper component that catches errors in its children
 * Re-exports the shared ErrorBoundaryWithHooks with dashboard styling
 */
export function ErrorBoundary({ 
  children,
  fallback = <ErrorFallback />,
  onError
}: { 
  children: React.ReactNode,
  fallback?: React.ReactNode,
  onError?: (error: Error, info: React.ErrorInfo) => void
}) {
  return (
    <SharedErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </SharedErrorBoundary>
  );
}
