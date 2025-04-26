
/**
 * Hook für erweiterte Formularfunktionalität mit Validierung
 * 
 * Kombiniert useForm aus react-hook-form mit einheitlicher Fehlerbehandlung,
 * Toast-Benachrichtigungen und optimierter Submission-Logik.
 */
import { useState, useCallback } from 'react';
import {
  useForm,
  UseFormProps,
  UseFormReturn,
  FieldValues,
  SubmitHandler,
  SubmitErrorHandler
} from 'react-hook-form';
import { useToast } from './useToast';
import { useErrorHandler } from '@/shared/utils/errorHandler';

interface UseFormWithValidationOptions<TFormValues extends FieldValues> 
  extends UseFormProps<TFormValues> {
  /**
   * Anzeigen eines Toast bei erfolgreicher Übermittlung
   */
  showSuccessToast?: boolean;

  /**
   * Titel für den Erfolgs-Toast
   */
  successToastTitle?: string;

  /**
   * Nachricht für den Erfolgs-Toast
   */
  successToastMessage?: string;

  /**
   * Anzeigen eines Toast bei Validierungsfehlern
   */
  showValidationErrorToast?: boolean;

  /**
   * Ob die Formularfelder nach erfolgreicher Übermittlung zurückgesetzt werden sollen
   */
  resetOnSuccess?: boolean;
}

interface UseFormWithValidationReturn<TFormValues extends FieldValues> 
  extends Omit<UseFormReturn<TFormValues>, 'handleSubmit'> {
  /**
   * Gibt an, ob das Formular gerade übermittelt wird
   */
  isSubmitting: boolean;

  /**
   * Fehler bei der Formularübermittlung
   */
  submitError: string | null;

  /**
   * Erweiterte handleSubmit-Funktion mit integriertem Lade-Status und Fehlerbehandlung
   */
  handleSubmit: (
    onValid: SubmitHandler<TFormValues>,
    onInvalid?: SubmitErrorHandler<TFormValues>
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;

  /**
   * Setzt den Übermittlungsfehler zurück
   */
  clearSubmitError: () => void;
}

/**
 * Hook für Formulare mit erweiterter Validierung und Status-Management
 */
export function useFormWithValidation<TFormValues extends FieldValues = FieldValues>(
  options: UseFormWithValidationOptions<TFormValues> = {}
): UseFormWithValidationReturn<TFormValues> {
  const {
    showSuccessToast = false,
    successToastTitle = 'Erfolg',
    successToastMessage = 'Die Aktion wurde erfolgreich ausgeführt.',
    showValidationErrorToast = true,
    resetOnSuccess = false,
    ...formOptions
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  
  // Form-Hook initialisieren
  const formMethods = useForm<TFormValues>(formOptions);
  
  // Fehler zurücksetzen
  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  // Erweiterte handleSubmit-Funktion, die Ladezustand und Fehler verwaltet
  const handleSubmitWithStatus = useCallback(
    (onValid: SubmitHandler<TFormValues>, onInvalid?: SubmitErrorHandler<TFormValues>) => {
      return async (e?: React.BaseSyntheticEvent) => {
        // Submission-Status und Fehler zurücksetzen
        setIsSubmitting(true);
        clearSubmitError();

        // Originale handleSubmit-Funktion mit eigenen Wrappern aufrufen
        return formMethods.handleSubmit(
          // Erfolgsfall
          async (data) => {
            try {
              // Onvalid-Funktion ausführen
              await onValid(data);
              
              // Formular zurücksetzen, wenn gewünscht
              if (resetOnSuccess) {
                formMethods.reset();
              }
              
              // Erfolgs-Toast anzeigen, wenn aktiviert
              if (showSuccessToast) {
                toast({
                  title: successToastTitle,
                  description: successToastMessage,
                  variant: 'success'
                });
              }
            } catch (error) {
              // Fehler behandeln mit zentraler Fehlerbehandlung
              const errorMessage = handleError(error, { 
                title: 'Formularfehler',
                showToast: true
              });
              setSubmitError(errorMessage);
            } finally {
              setIsSubmitting(false);
            }
          },
          // Fehlerfall bei Validierungsfehler
          (errors) => {
            setIsSubmitting(false);
            
            // Validierungsfehler-Toast anzeigen, wenn aktiviert
            if (showValidationErrorToast && Object.keys(errors).length > 0) {
              // Ersten Fehler zur Anzeige finden
              let firstErrorMessage = 'Bitte überprüfen Sie die eingegeben Daten.';
              const firstErrorField = Object.values(errors)[0];
              
              if (firstErrorField && firstErrorField.message) {
                firstErrorMessage = firstErrorField.message as string;
              }
              
              toast({
                title: 'Validierungsfehler',
                description: firstErrorMessage,
                variant: 'error'
              });
            }
            
            // Original onInvalid aufrufen, wenn vorhanden
            if (onInvalid) {
              onInvalid(errors);
            }
          }
        )(e);
      };
    },
    [formMethods, clearSubmitError, resetOnSuccess, showSuccessToast, successToastTitle, 
     successToastMessage, showValidationErrorToast, toast, handleError]
  );

  return {
    ...formMethods,
    isSubmitting,
    submitError,
    handleSubmit: handleSubmitWithStatus,
    clearSubmitError
  };
}

/**
 * Hilfsfunktion für die Erstellung von Validierungsregeln für Formulare
 */
export const validationRules = {
  required: (message = 'Dieses Feld ist erforderlich') => ({
    required: { value: true, message }
  }),
  
  email: (message = 'Bitte geben Sie eine gültige E-Mail-Adresse ein') => ({
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message
    }
  }),
  
  minLength: (min: number, message?: string) => ({
    minLength: {
      value: min,
      message: message || `Dieses Feld muss mindestens ${min} Zeichen lang sein`
    }
  }),
  
  maxLength: (max: number, message?: string) => ({
    maxLength: {
      value: max,
      message: message || `Dieses Feld darf maximal ${max} Zeichen lang sein`
    }
  }),
  
  pattern: (pattern: RegExp, message: string) => ({
    pattern: { value: pattern, message }
  }),
  
  matchField: (field: string, message = 'Die Felder stimmen nicht überein') => ({
    validate: (value: any, formValues: any) => 
      value === formValues[field] || message
  }),
  
  phoneNumber: (message = 'Bitte geben Sie eine gültige Telefonnummer ein') => ({
    pattern: {
      value: /^(\+?\d{1,3}[- ]?)?\(?(?:\d{2,3})\)?[- ]?(\d{3,4})[- ]?(\d{4})$/,
      message
    }
  }),
  
  numeric: (message = 'Bitte geben Sie nur Zahlen ein') => ({
    pattern: {
      value: /^[0-9]+$/,
      message
    }
  }),
  
  alphanumeric: (message = 'Bitte geben Sie nur Buchstaben und Zahlen ein') => ({
    pattern: {
      value: /^[a-zA-Z0-9]+$/,
      message
    }
  })
};
