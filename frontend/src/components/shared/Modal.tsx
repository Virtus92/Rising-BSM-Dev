'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Modal component for displaying content in a popup dialog.
 * 
 * @param isOpen Controls whether the modal is displayed
 * @param onClose Function to call when the modal is closed
 * @param title Title to display in the modal header
 * @param children Content to display in the modal body
 * @param size Size of the modal ('sm', 'md', 'lg', 'xl')
 */
const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md' 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Close modal when clicking outside it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    // Close modal on escape key
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    // Lock body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Don't render anything if the modal is closed
  if (!isOpen) return null;
  
  // Calculate modal width based on size prop
  const getModalWidth = () => {
    switch (size) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      default: return 'max-w-md';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        {/* Modal backdrop */}
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-40"></div>
        
        {/* Modal panel */}
        <div 
          ref={modalRef}
          className={`inline-block w-full ${getModalWidth()} p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 rounded-lg shadow-xl`}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
            >
              <X size={20} />
              <span className="sr-only">Close</span>
            </button>
          </div>
          
          {/* Modal content */}
          <div className="mt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
