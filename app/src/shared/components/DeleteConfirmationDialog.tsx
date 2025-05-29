'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export interface DeleteConfirmationDialogProps {
  title: string;
  description: string;
  open: boolean;
  onConfirm: () => Promise<void> | void;
  onClose?: () => void;
  onCancel?: () => void; // Support both onCancel and onClose for backward compatibility
  confirmLabel?: string;
  cancelLabel?: string;
  itemName?: string; // Support itemName prop used by components
}

/**
 * Reusable confirmation dialog for delete operations
 */
export function DeleteConfirmationDialog({
  title,
  description,
  open,
  onConfirm,
  onClose,
  onCancel,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  itemName
}: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <AlertDialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && (onClose || onCancel)?.()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}