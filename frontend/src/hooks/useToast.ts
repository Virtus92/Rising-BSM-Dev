'use client';

import { useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
  important?: boolean;
  id?: string | number;
};

/**
 * Hook for displaying toast notifications
 */
export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const { variant = 'default', title, description, duration, action, position, onDismiss, id, important } = options;
    
    // Map variant to sonner variant
    let sonnerVariant: Parameters<typeof sonnerToast>[1] = {};
    
    switch (variant) {
      case 'success':
        sonnerVariant = { 
          className: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          descriptionClassName: 'text-green-700 dark:text-green-300',
        };
        break;
      case 'error':
        sonnerVariant = {
          className: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          descriptionClassName: 'text-red-700 dark:text-red-300',
        };
        break;
      case 'warning':
        sonnerVariant = {
          className: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
          descriptionClassName: 'text-amber-700 dark:text-amber-300',
        };
        break;
      case 'info':
        sonnerVariant = {
          className: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          descriptionClassName: 'text-blue-700 dark:text-blue-300',
        };
        break;
      default:
        sonnerVariant = {
          className: 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700',
          descriptionClassName: 'text-gray-600 dark:text-gray-300',
        };
    }
    
    // Display toast
    return sonnerToast(title, {
      description,
      duration,
      position: position as any,
      ...sonnerVariant,
      id,
      onDismiss,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
    });
  }, []);

  const dismiss = useCallback((toastId?: string | number) => {
    if (toastId) {
      sonnerToast.dismiss(toastId);
    } else {
      sonnerToast.dismiss();
    }
  }, []);

  const success = useCallback((options: Omit<ToastOptions, 'variant'>) => {
    return toast({ ...options, variant: 'success' });
  }, [toast]);

  const error = useCallback((options: Omit<ToastOptions, 'variant'>) => {
    return toast({ ...options, variant: 'error' });
  }, [toast]);

  const warning = useCallback((options: Omit<ToastOptions, 'variant'>) => {
    return toast({ ...options, variant: 'warning' });
  }, [toast]);

  const info = useCallback((options: Omit<ToastOptions, 'variant'>) => {
    return toast({ ...options, variant: 'info' });
  }, [toast]);
  
  return {
    toast,
    dismiss,
    success,
    error,
    warning,
    info,
  };
}
