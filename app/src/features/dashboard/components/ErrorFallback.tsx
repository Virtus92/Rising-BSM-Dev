'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error | null;
  title?: string;
  message?: string;
  retry?: () => void;
}

/**
 * A component that displays an error message when a dashboard component fails to load
 */
export function ErrorFallback({ 
  error, 
  title = "Something went wrong", 
  message = "There was an error loading this component. The issue has been reported.",
  retry
}: ErrorFallbackProps) {
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
        {retry && (
          <button 
            onClick={retry}
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
 */
export function ErrorBoundary({ 
  children,
  fallback = <ErrorFallback />
}: { 
  children: React.ReactNode,
  fallback?: React.ReactNode
}) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error("Caught in ErrorBoundary:", error);
      setHasError(true);
      setError(error.error || new Error(error.message));
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    if (React.isValidElement(fallback)) {
      return fallback;
    }
    return <ErrorFallback error={error} retry={() => setHasError(false)} />;
  }

  return <>{children}</>;
}
