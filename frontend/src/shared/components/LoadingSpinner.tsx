'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

/**
 * Loading spinner component for indicating loading states
 */
export function LoadingSpinner({ size = 'md', className = '', message }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-4 h-full w-full">
      <Loader2 className={`animate-spin text-primary ${sizeClass} ${className}`} />
      {message && <p className="mt-4 text-muted-foreground text-sm">{message}</p>}
    </div>
  );
}