/**
 * Zentraler Error-Handler für Frontend-Anwendungen
 * 
 * Bietet einheitliche Funktionen zum Umgang mit Fehlern, Logging und Benachrichtigungen.
 */
import { getLogger } from '@/core/logging';
import { ApiRequestError } from '@/core/api/ApiClient';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Formatiert einen Fehler in einen benutzerfreundlichen Fehlertext
 */
export function formatError(error: unknown): string {
  // Wenn es ein Error-Objekt ist, verwende die Nachricht
  if (error instanceof Error) {
    // Spezielle Behandlung für API-Fehler
    if (error instanceof ApiRequestError && error.errors && error.errors.length > 0) {
      return error.errors[0];
    }
    return error.message;
  }
  
  // Wenn es ein String ist, verwende diesen direkt
  if (typeof error === 'string') {
    return error;
  }
  
  // Fallback
  return 'Ein unbekannter Fehler ist aufgetreten';
}

/**
 * Loggt einen Fehler mit dem zentralen Logger
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  const logger = getLogger();
  const errorMessage = formatError(error);
  
  let errorData: Record<string, any> = {
    error: error instanceof Error ? error : errorMessage
  };
  
  if (context) {
    errorData = { ...errorData, ...context };
  }
  
  // Stack-Trace hinzufügen, wenn es ein Error ist
  if (error instanceof Error && error.stack) {
    errorData.stack = error.stack;
  }
  
  logger.error(errorMessage, errorData);
}

/**
 * Hook für einheitliche Fehlerbehandlung mit Toast-Benachrichtigungen
 */
export function useErrorHandler() {
  const { toast } = useToast();
  
  /**
   * Behandelt einen Fehler mit Logging und optionaler Toast-Benachrichtigung
   */
  const handleError = (
    error: unknown, 
    options?: { 
      showToast?: boolean; 
      title?: string;
      context?: Record<string, any>;
    }
  ): string => {
    const { showToast = true, title = 'Fehler', context } = options || {};
    const errorMessage = formatError(error);
    
    // Fehler loggen
    logError(error, context);
    
    // Toast-Benachrichtigung anzeigen, wenn gewünscht
    if (showToast) {
      toast({
        title,
        description: errorMessage,
        variant: 'error'
      });
    }
    
    return errorMessage;
  };
  
  return { handleError };
}
