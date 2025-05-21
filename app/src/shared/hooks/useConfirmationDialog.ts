'use client';

import { useCallback, useState } from 'react';
import { useToast } from './useToast';

interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * A hook for handling confirmation dialogs
 * This is a simple implementation that uses toast notifications
 * In a real app, you'd likely use a modal dialog component
 */
export function useConfirmationDialog() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);

  const openConfirmDialog = useCallback((options: ConfirmDialogOptions) => {
    setOptions(options);
    setIsOpen(true);
    
    // In a real app, this would display a modal
    // For now, we'll just use toast notifications
    toast({
      title: options.title,
      description: options.description,
      variant: options.variant === 'destructive' ? 'destructive' : 'default',
      action: (
        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 bg-primary text-primary-foreground rounded"
            onClick={() => {
              setIsOpen(false);
              options.onConfirm();
            }}
          >
            {options.confirmText || 'Confirm'}
          </button>
          <button 
            className="px-3 py-1 bg-secondary text-secondary-foreground rounded"
            onClick={() => {
              setIsOpen(false);
              if (options.onCancel) options.onCancel();
            }}
          >
            {options.cancelText || 'Cancel'}
          </button>
        </div>
      )
    });
  }, [toast]);

  return {
    openConfirmDialog,
    isOpen
  };
}

export default useConfirmationDialog;
