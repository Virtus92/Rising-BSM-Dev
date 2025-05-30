import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import { PermissionProvider } from '@/features/permissions/providers/PermissionProvider';
import { ToastProvider } from '@/shared/providers/ToastProvider';
import { ThemeProvider } from '@/shared/providers/ThemeProvider';
import { QueryProvider } from '@/shared/providers/QueryProvider';

import './globals.css';

// Force Node.js runtime for this route
export const runtime = 'nodejs';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rising BSM',
  description: 'Business Service Management Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>
              <AuthProvider>
                <PermissionProvider>
                  {children}
                </PermissionProvider>
              </AuthProvider>
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
