'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';

interface EntityCreateModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to call when modal should close */
  onClose: () => void;
  /** Title for the modal */
  title: string;
  /** Description for the modal */
  description?: string;
  /** The form component to render inside the modal */
  children: React.ReactNode;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Whether to use full width on mobile */
  fullWidthOnMobile?: boolean;
  /** Custom max width class */
  maxWidth?: string;
}

/**
 * Generic modal component for creating entities
 * Provides consistent styling and behavior across all entity creation modals
 */
export function EntityCreateModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  isSubmitting = false,
  fullWidthOnMobile = true,
  maxWidth = 'sm:max-w-[600px]'
}: EntityCreateModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dialogClassName = fullWidthOnMobile && isMobile 
    ? 'sm:max-w-[100%] p-4'
    : `${maxWidth}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${dialogClassName} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10 pb-4">
          <DialogTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CreateButtonProps {
  /** Function to call when button is clicked */
  onClick: () => void;
  /** Label for the button */
  label?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Button variant */
  variant?: 'default' | 'outline' | 'secondary';
  /** Button size */
  size?: 'sm' | 'default' | 'lg';
  /** Custom className */
  className?: string;
}

/**
 * Standardized create button for entities
 */
export function CreateButton({
  onClick,
  label = 'Create New',
  disabled = false,
  variant = 'default',
  size = 'sm',
  className = ''
}: CreateButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      size={size}
      className={`shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <Plus className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

interface UseEntityModalProps {
  /** Parameter name to check in URL for auto-opening modal */
  urlParam?: string;
  /** Value that triggers modal opening */
  urlValue?: string;
}

interface UseEntityModalReturn {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to open the modal */
  openModal: () => void;
  /** Function to close the modal */
  closeModal: () => void;
  /** Function to toggle the modal */
  toggleModal: () => void;
}

/**
 * Hook for managing entity creation modal state
 * Handles URL parameters for auto-opening modals
 */
export function useEntityModal({
  urlParam = 'modal',
  urlValue = 'new'
}: UseEntityModalProps = {}): UseEntityModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();

  // Handle URL parameter-based modal opening
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const modalParam = searchParams?.get(urlParam);
      
      if (modalParam === urlValue) {
        setIsOpen(true);
        
        // Clean up URL
        const params = new URLSearchParams(window.location.search);
        if (params.has(urlParam)) {
          params.delete(urlParam);
          const newUrl = window.location.pathname + 
            (params.toString() ? `?${params.toString()}` : '');
          window.history.replaceState({}, '', newUrl);
        }
      }
    }
  }, [searchParams, urlParam, urlValue]);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const toggleModal = () => setIsOpen(prev => !prev);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  };
}

export default EntityCreateModal;