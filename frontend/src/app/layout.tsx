'use client';

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/providers/AuthProvider';
import { SettingsProvider } from '@/contexts/SettingsContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Protokolliert einen Client-Fehler an den Server
async function logErrorToServer(error: Error, errorInfo: any) {
  // In Produktion könnten wir den Fehler an unseren Fehler-Tracking-Dienst senden
  try {
    await fetch('/api/log/client-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
        name: error.name,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    });
  } catch (e) {
    // Stille Fehler, damit wir keinen Kreislauf erzeugen
    console.error('Failed to report error:', e);
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  // Analytik für Seitenaufrufe
  useEffect(() => {
    if (pathname) {
      console.log(`Seitenaufruf: ${pathname}`);
      // Hier könnte Analytics-Code kommen
    }
  }, [pathname]);

  return (
    <html lang="de">
      <body className={inter.className}>
        <ErrorBoundary onError={logErrorToServer}>
          <AuthProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '0.375rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
              duration: 4000,
            }} 
          />
        </ErrorBoundary>
      </body>
    </html>
  );
}
