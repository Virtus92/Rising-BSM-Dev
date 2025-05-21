'use client';

import { PropsWithChildren } from 'react';
import { NotificationProvider } from '@/features/notifications/providers/NotificationProvider';

/**
 * Layout component that wraps other components and provides the NotificationContext
 * Place this at the app level to ensure the NotificationContext is available everywhere
 */
export function NotificationLayout({ children }: PropsWithChildren) {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );
}

export default NotificationLayout;
