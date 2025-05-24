'use client';

import React, { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  isSubmitting?: boolean;
  error?: string | null;
  success?: boolean;
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
}

/**
 * Clean form modal component that expects forms without wrappers
 * Provides consistent modal behavior with built-in submit/cancel actions
 */
export function FormModal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  isSubmitting = false,
  error = null,
  success = false,
  children,
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  className
}: FormModalProps) {
  
  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
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
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };
  
  // Size classes mapping
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={cn(
          sizeClasses[size],
          'max-h-[90vh] overflow-y-auto',
          className
        )}
        onPointerDownOutside={isSubmitting ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isSubmitting ? (e) => e.preventDefault() : undefined}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isSubmitting && <LoadingSpinner size="sm" />}
              {success && <CheckCircle className="h-5 w-5 text-green-600" />}
              {error && <XCircle className="h-5 w-5 text-red-600" />}
              {title}
            </DialogTitle>
            
            {description && (
              <DialogDescription className="text-muted-foreground">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {/* Content */}
          <div className="py-6">
            {/* Status Messages */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Operation completed successfully!</AlertDescription>
              </Alert>
            )}
            
            {/* Form fields */}
            <div className={cn('space-y-4', isSubmitting && 'pointer-events-none opacity-50')}>
              {children}
            </div>
          </div>
          
          {/* Footer with actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
