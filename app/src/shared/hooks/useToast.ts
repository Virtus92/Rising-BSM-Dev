'use client';

import { useState, useCallback } from 'react';

/**
 * Simple toast hook for notifications
 * In a real application, this would be implemented with a proper toast library
 * or using the toast component from your UI library
 */
export function useToast() {
  const [toasts, setToasts] = useState<any[]>([]);

  const toast = useCallback((props: any) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, ...props }]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
    
    console.log('Toast:', props.title, props.description);
    
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    toast,
    dismiss,
    toasts
  };
}

export default useToast;
