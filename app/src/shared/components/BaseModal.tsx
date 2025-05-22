'use client';

import React, { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

/**
 * Base modal component for consistent modal behavior across the app
 * Provides standardized loading states, error handling, and success states
 */
export function BaseModal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  isLoading = false,
  error = null,
  success = false,
  children,
  footer,
  className,
  closeOnOverlayClick = true,
  showCloseButton = true
}: BaseModalProps) {
  
  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };
  
  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && !isLoading && e.target === e.currentTarget) {
      handleClose();
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
        onPointerDownOutside={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={isLoading ? (e) => e.preventDefault() : undefined}
      >
        {/* Header */}
        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2 pr-8">
            {isLoading && <LoadingSpinner size="sm" />}
            {success && <CheckCircle className="h-5 w-5 text-green-600" />}
            {error && <XCircle className="h-5 w-5 text-red-600" />}
            {title}
          </DialogTitle>
          
          {description && (
            <DialogDescription className="text-muted-foreground">
              {description}
            </DialogDescription>
          )}
          
          {/* Close button */}
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={handleClose}
              disabled={isLoading}
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </DialogHeader>
        
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
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-2">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-muted-foreground">Processing...</p>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className={cn('space-y-4', isLoading && 'pointer-events-none opacity-50')}>
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export interface FormModalProps extends Omit<BaseModalProps, 'children' | 'footer'> {
  onSubmit?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  children: ReactNode;
  showDefaultActions?: boolean;
}

/**
 * Form modal component with standardized submit/cancel actions
 */
export function FormModal({
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  showDefaultActions = true,
  children,
  ...baseProps
}: FormModalProps) {
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      baseProps.onClose();
    }
  };
  
  const footer = showDefaultActions ? (
    <>
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
        onClick={onSubmit}
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
    </>
  ) : undefined;
  
  return (
    <BaseModal
      {...baseProps}
      isLoading={isSubmitting}
      footer={footer}
      closeOnOverlayClick={!isSubmitting}
    >
      {children}
    </BaseModal>
  );
}

export interface ConfirmationModalProps extends Omit<BaseModalProps, 'children' | 'footer'> {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel?: () => void;
  isConfirming?: boolean;
}

/**
 * Confirmation modal for destructive actions
 */
export function ConfirmationModal({
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  isConfirming = false,
  ...baseProps
}: ConfirmationModalProps) {
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      baseProps.onClose();
    }
  };
  
  const footer = (
    <>
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
    </>
  );
  
  return (
    <BaseModal
      {...baseProps}
      size="sm"
      isLoading={isConfirming}
      footer={footer}
      closeOnOverlayClick={!isConfirming}
    >
      <div className="py-4">
        <p className="text-sm text-muted-foreground">
          {message}
        </p>
      </div>
    </BaseModal>
  );
}
