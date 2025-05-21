'use client';

import React, { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

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
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);

  const openConfirmDialog = useCallback((options: ConfirmDialogOptions) => {
    setOptions(options);
    setIsOpen(true);
    
    // Use toast with a custom component
    toast.custom((t) => (
      <div className="bg-white p-4 rounded shadow-lg border">
        <h3 className="font-medium">{options.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{options.description}</p>
        <div className="flex space-x-2 mt-3">
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded"
            onClick={() => {
              toast.dismiss(t.id);
              setIsOpen(false);
              options.onConfirm();
            }}
          >
            {options.confirmText || 'Confirm'}
          </button>
          <button 
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded"
            onClick={() => {
              toast.dismiss(t.id);
              setIsOpen(false);
              if (options.onCancel) options.onCancel();
            }}
          >
            {options.cancelText || 'Cancel'}
          </button>
        </div>
      </div>
    ), {
      duration: 50000, // Long duration to allow user to make a choice
    });
  }, []);

  return {
    openConfirmDialog,
    isOpen
  };
}

export default useConfirmationDialog;