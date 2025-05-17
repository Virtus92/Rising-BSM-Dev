'use client';

import { useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'destructive';

// Optionen für den Toast
export type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
  important?: boolean;
  id?: string | number;
  // Flag zur Deduplizierung
  dedupeKey?: string;
  // Falls true, wird der Toast nicht angezeigt, wenn bereits einer mit demselben dedupeKey angezeigt wird
  dedupeStrategy?: 'replace' | 'ignore' | 'stack'; 
};

// Queue aktiver Toast-IDs für De-Duplizierung
const activeToasts = new Map<string, string | number>();

/**
 * Hook für Toast-Benachrichtigungen
 * 
 * Bietet eine einfache API für verschiedene Arten von Toast-Benachrichtigungen
 * mit Unterstützung für De-Duplizierung und Priorisierung
 */
export function useToast() {
  /**
   * Zeigt eine Toast-Benachrichtigung an
   */
  const toast = useCallback((options: ToastOptions) => {
    const { 
      variant = 'default', 
      title, 
      description, 
      duration = 5000, 
      action, 
      position = 'bottom-right', 
      onDismiss, 
      id: providedId, 
      important = false,
      dedupeKey,
      dedupeStrategy = 'replace'
    } = options;
    
    // Debug log to help trace toast issues
    console.log(`Toast triggered: "${title}" - ${variant}`, { 
      description: description?.substring(0, 30) + (description && description.length > 30 ? '...' : ''),
      stackTrace: new Error().stack?.split('\n').slice(1,3).join('\n') 
    });
    
    // Generiere eine eindeutige ID, wenn keine angegeben wurde
    const id = providedId || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // De-Duplizierung verwalten
    if (dedupeKey) {
      const existingId = activeToasts.get(dedupeKey);
      
      if (existingId) {
        // Ein Toast mit diesem Key existiert bereits
        switch (dedupeStrategy) {
          case 'replace':
            // Bestehenden Toast ersetzen
            sonnerToast.dismiss(existingId);
            break;
          case 'ignore':
            // Neuen Toast ignorieren
            return existingId;
          case 'stack':
            // Beide Toasts anzeigen (Standardverhalten)
            break;
        }
      }
      
      // Neuen Toast zur aktiven Map hinzufügen
      activeToasts.set(dedupeKey, id);
      
      // Sicherstellen, dass der Toast aus der Map entfernt wird, wenn er geschlossen wird
      const originalOnDismiss = onDismiss;
      options.onDismiss = () => {
        activeToasts.delete(dedupeKey);
        if (originalOnDismiss) originalOnDismiss();
      };
    }
    
    // Map our variant names to Sonner's expected style parameters
    let toastFunction = sonnerToast;
    
    // Use the appropriate Sonner function based on our variant
    switch (variant) {
      case 'success':
        return sonnerToast.success(title, {
          description,
          duration,
          position: position,
          id,
          onDismiss,
          action: action ? {
            label: action.label,
            onClick: action.onClick,
          } : undefined,
        });
      case 'error':
      case 'destructive':
        return sonnerToast.error(title, {
          description,
          duration,
          position: position,
          id,
          onDismiss,
          action: action ? {
            label: action.label,
            onClick: action.onClick,
          } : undefined,
        });
      case 'warning':
        return sonnerToast.warning(title, {
          description,
          duration,
          position: position,
          id,
          onDismiss,
          action: action ? {
            label: action.label,
            onClick: action.onClick,
          } : undefined,
        });
      case 'info':
        return sonnerToast.info(title, {
          description,
          duration,
          position: position,
          id,
          onDismiss,
          action: action ? {
            label: action.label,
            onClick: action.onClick,
          } : undefined,
        });
      default:
        // For default variant, use the standard toast function
        return sonnerToast(title, {
          description,
          duration,
          position: position,
          id,
          onDismiss,
          action: action ? {
            label: action.label,
            onClick: action.onClick,
          } : undefined,
        });
    }
  }, []);

  /**
   * Schließt eine oder alle Toasts
   */
  const dismiss = useCallback((toastId?: string | number) => {
    if (toastId) {
      sonnerToast.dismiss(toastId);
      
      // Entferne Toast aus der aktiven Map, falls er dort ist
      activeToasts.forEach((id, key) => {
        if (id === toastId) activeToasts.delete(key);
      });
    } else {
      sonnerToast.dismiss();
      activeToasts.clear();
    }
  }, []);

  /**
   * Hilfsmethode für Erfolgs-Toast
   */
  const success = useCallback((options: Omit<ToastOptions, 'variant'>) => {
    console.log('Success toast called:', options.title);
    return toast({ ...options, variant: 'success' });
  }, [toast]);

  /**
   * Hilfsmethode für Fehler-Toast
   */
  const error = useCallback((options: Omit<ToastOptions, 'variant'>) => {
    console.log('Error toast called:', options.title);
    return toast({ ...options, variant: 'error' });
  }, [toast]);

  /**
   * Hilfsmethode für Warnungs-Toast
   */
  const warning = useCallback((options: Omit<ToastOptions, 'variant'>) => {
    return toast({ ...options, variant: 'warning' });
  }, [toast]);

  /**
   * Hilfsmethode für Info-Toast
   */
  const info = useCallback((options: Omit<ToastOptions, 'variant'>) => {
    return toast({ ...options, variant: 'info' });
  }, [toast]);
  
  /**
   * Zeigt eine kurze Bestätigung an (2 Sekunden)
   */
  const confirm = useCallback((message: string) => {
    return toast({
      title: message,
      variant: 'success',
      duration: 2000,
    });
  }, [toast]);
  
  /**
   * Zeigt eine Benachrichtigung mit Bestätigungsaufforderung an
   */
  const promise = useCallback(
    <T,>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
      }
    ) => {
      return sonnerToast.promise(promise, {
        loading,
        success: (data) => (typeof success === 'function' ? success(data) : success),
        error: (err) => (typeof error === 'function' ? error(err) : error),
      });
    },
    []
  );
  
  return {
    toast,
    dismiss,
    success,
    error,
    warning,
    info,
    confirm,
    promise
  };
}

