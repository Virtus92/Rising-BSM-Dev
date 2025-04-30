'use client';

import { useEffect, useState, ReactNode } from 'react';

/**
 * ClientOnly component wraps content that should only render on the client
 * This prevents hydration errors and ensures components only mount once on the client
 */
export default function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Only show children when component is mounted on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return null during server-side rendering or first client render
  // This prevents hydration mismatch errors
  if (!mounted) {
    return null;
  }

  // Once mounted on client, render children
  return <>{children}</>;
}
