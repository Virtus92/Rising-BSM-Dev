'use client';

import React, { useState, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Use dynamic import for ReactQueryDevtools to avoid server-side issues
const ReactQueryDevtools = process.env.NODE_ENV === 'development'
  ? React.lazy(() => import('@tanstack/react-query-devtools').then(mod => ({ default: mod.ReactQueryDevtools })))
  : () => null;

/**
 * Provider für die React Query-Konfiguration
 * 
 * Konfiguriert den QueryClient und stellt ihn der gesamten Anwendung zur Verfügung.
 * Enthält auch die Devtools für die Entwicklung.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // QueryClient-Instanz auf Komponentenebene erstellen,
  // damit jeder Client seine eigene Instanz hat
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Improved configuration to reduce duplicate calls
        refetchOnWindowFocus: false, // No automatic refresh on window focus
        retry: 1,                    // Only one retry on errors
        staleTime: 1000 * 60 * 10,   // Keep data fresh for 10 minutes (increased)
        gcTime: 1000 * 60 * 20,      // Garbage collection after 20 minutes (increased)
        refetchOnMount: false,       // Prevent refetch when components mount
        refetchInterval: false,      // Disable automatic refetching
      },
      mutations: {
        // Configuration for all mutations
        retry: 0,                    // No automatic retries for mutations
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* Devtools nur in Entwicklungsumgebung anzeigen - mit Suspense für das lazy loading */}
      {process.env.NODE_ENV === 'development' && (
        <React.Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </React.Suspense>
      )}
    </QueryClientProvider>
  );
}

export default QueryProvider;
