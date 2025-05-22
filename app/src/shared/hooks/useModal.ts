'use client';

import { useState, useCallback } from 'react';

export interface UseModalResult {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;
}

/**
 * Hook for managing modal state
 */
export function useModal(initialOpen = false): UseModalResult {
  const [isOpen, setIsOpen] = useState(initialOpen);
  
  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);
  
  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  const toggleModal = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  };
}

export interface UseFormModalResult extends UseModalResult {
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  success: boolean;
  setSuccess: (success: boolean) => void;
  resetForm: () => void;
}

/**
 * Hook for managing form modal state with submission handling
 */
export function useFormModal(initialOpen = false): UseFormModalResult {
  const modal = useModal(initialOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const resetForm = useCallback(() => {
    setIsSubmitting(false);
    setError(null);
    setSuccess(false);
  }, []);
  
  const closeModal = useCallback(() => {
    modal.closeModal();
    // Reset form state when modal closes
    setTimeout(resetForm, 150); // Small delay to avoid visual glitch
  }, [modal, resetForm]);
  
  return {
    ...modal,
    closeModal,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
    success,
    setSuccess,
    resetForm
  };
}

export interface ModalAction<T = any> {
  type: 'create' | 'edit' | 'delete' | 'view' | string;
  item?: T;
  data?: any;
}

export interface UseEntityModalResult<T> extends UseFormModalResult {
  action: ModalAction<T> | null;
  openCreateModal: () => void;
  openEditModal: (item: T) => void;
  openViewModal: (item: T) => void;
  openDeleteModal: (item: T) => void;
  openCustomModal: (type: string, item?: T, data?: any) => void;
}

/**
 * Hook for managing entity modals (create, edit, delete, etc.)
 */
export function useEntityModal<T>(initialOpen = false): UseEntityModalResult<T> {
  const formModal = useFormModal(initialOpen);
  const [action, setAction] = useState<ModalAction<T> | null>(null);
  
  const openCreateModal = useCallback(() => {
    setAction({ type: 'create' });
    formModal.openModal();
  }, [formModal]);
  
  const openEditModal = useCallback((item: T) => {
    setAction({ type: 'edit', item });
    formModal.openModal();
  }, [formModal]);
  
  const openViewModal = useCallback((item: T) => {
    setAction({ type: 'view', item });
    formModal.openModal();
  }, [formModal]);
  
  const openDeleteModal = useCallback((item: T) => {
    setAction({ type: 'delete', item });
    formModal.openModal();
  }, [formModal]);
  
  const openCustomModal = useCallback((type: string, item?: T, data?: any) => {
    setAction({ type, item, data });
    formModal.openModal();
  }, [formModal]);
  
  const closeModal = useCallback(() => {
    formModal.closeModal();
    // Clear action when modal closes
    setTimeout(() => setAction(null), 150);
  }, [formModal]);
  
  return {
    ...formModal,
    closeModal,
    action,
    openCreateModal,
    openEditModal,
    openViewModal,
    openDeleteModal,
    openCustomModal
  };
}
