'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel?: () => void;
  isConfirming?: boolean;
  error?: string | null;
  className?: string;
}

/**
 * Clean confirmation modal for destructive actions
 * Provides consistent confirmation behavior
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  isConfirming = false,
  error = null,
  className
}: ConfirmationModalProps) {
  
  // Handle modal close
  const handleClose = () => {
    if (!isConfirming) {
      onClose();
    }
  };
  
  // Handle cancel action
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      handleClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={cn(
          'max-w-md',
          className
        )}
        onPointerDownOutside={isConfirming ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isConfirming ? (e) => e.preventDefault() : undefined}
      >
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === 'destructive' && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {title}
          </DialogTitle>
        </DialogHeader>
        
        {/* Content */}
        <div className="py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <DialogDescription className="text-sm text-muted-foreground">
            {message}
          </DialogDescription>
        </div>
        
        {/* Footer with actions */}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isConfirming}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isConfirming}
            className="min-w-[100px]"
          >
            {isConfirming ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
