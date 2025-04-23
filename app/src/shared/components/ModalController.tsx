'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  parseModalFromUrl, 
  removeModalParamFromUrl, 
  updateUrlWithoutNavigation 
} from '@/shared/utils/modal-controller';

interface ModalConfig {
  name: string;
  component: ReactNode | ((params: Record<string, string>) => ReactNode);
}

interface ModalControllerProps {
  children: ReactNode;
  modals: ModalConfig[];
  basePath?: string;
}

/**
 * Modal Controller Component
 * 
 * This component provides a standardized way to handle modal rendering
 * based on URL parameters. It keeps track of which modal to show and
 * handles updating the URL when modals are opened or closed.
 */
export function ModalController({ 
  children, 
  modals,
  basePath = '',
}: ModalControllerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalParams, setModalParams] = useState<Record<string, string>>({});
  
  // Parse modals from URL when component mounts or URL changes
  useEffect(() => {
    const { modalName, modalParams } = parseModalFromUrl();
    
    setActiveModal(modalName);
    setModalParams(modalParams);
  }, [searchParams]);
  
  // Close modal handler
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalParams({});
    
    if (typeof window !== 'undefined') {
      // Remove modal parameters from URL without navigation
      const currentUrl = window.location.href;
      const newUrl = removeModalParamFromUrl(currentUrl);
      updateUrlWithoutNavigation(newUrl);
    }
  }, []);
  
  // Render the active modal if found
  const renderActiveModal = useCallback(() => {
    if (!activeModal) return null;
    
    const modalConfig = modals.find(m => m.name === activeModal);
    if (!modalConfig) return null;
    
    // Render the modal component
    if (typeof modalConfig.component === 'function') {
      return modalConfig.component(modalParams);
    }
    
    return modalConfig.component;
  }, [activeModal, modalParams, modals]);
  
  return (
    <>
      {children}
      {renderActiveModal()}
    </>
  );
}

export default ModalController;
