import React from 'react';
import { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/shared/providers/ThemeProvider';
import { QueryProvider } from '@/shared/providers/QueryProvider';
import ApiInitializer from '@/shared/components/ApiInitializer';
import ClientOnly from '@/shared/components/ClientOnly';
// Add AuthProvider import
import { AuthProvider } from '@/features/auth/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'Rising BSM',
  description: 'Business Service Management application by Rising',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        {/* API initialization must happen first */}
        <ApiInitializer />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <ClientOnly>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </ClientOnly>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
