'use client';

import React, { useState, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

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
        // Allgemeine Konfiguration für alle Queries
        refetchOnWindowFocus: false, // Keine automatische Aktualisierung bei Fokuswechsel
        retry: 1,                    // Nur ein Wiederholungsversuch bei Fehlern
        staleTime: 1000 * 60 * 5,    // Daten für 5 Minuten frisch halten
        gcTime: 1000 * 60 * 10,      // Garbage Collection nach 10 Minuten
      },
      mutations: {
        // Konfiguration für alle Mutationen
        retry: 0,                    // Keine automatischen Wiederholungsversuche für Mutationen
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* Devtools nur in Entwicklungsumgebung anzeigen */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default QueryProvider;
