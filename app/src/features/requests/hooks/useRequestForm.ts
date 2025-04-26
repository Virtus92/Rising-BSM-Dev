import { useState, useCallback } from 'react';
import { RequestResponseDto, UpdateRequestDto } from '@/domain/dtos/RequestDtos';
import { useToast } from '@/shared/hooks/useToast';
import { RequestStatus } from '@/domain/enums/CommonEnums';

type FormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  message?: string;
  [key: string]: string | undefined;
};

interface UseRequestFormOptions {
  initialData?: Partial<RequestResponseDto>;
  onSubmit?: (data: UpdateRequestDto) => Promise<RequestResponseDto | null>;
}

/**
 * Hook for managing request form state and validation
 */
export function useRequestForm({ initialData = {}, onSubmit }: UseRequestFormOptions = {}) {
  // Form fields
  const [name, setName] = useState(initialData.name || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [phone, setPhone] = useState(initialData.phone || '');
  const [service, setService] = useState(initialData.service || '');
  const [message, setMessage] = useState(initialData.message || '');
  const [status, setStatus] = useState<RequestStatus>(initialData.status || RequestStatus.NEW);
  
  // Form state
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { toast } = useToast();
  
  // Validation function
  const validate = useCallback(() => {
    const newErrors: FormErrors = {};
    
    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    // Validate service
    if (!service.trim()) {
      newErrors.service = 'Service is required';
    }
    
    // Validate message
    if (!message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    // Set errors and return validation status
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, email, service, message]);
  
  // Create the form data object
  const getFormData = useCallback((): UpdateRequestDto => {
    return {
      name,
      email,
      phone: phone || undefined,
      service,
      message,
      status
    };
  }, [name, email, phone, service, message, status]);
  
  // Submit form
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // If already submitting, do nothing
    if (submitting) return false;
    
    // Perform validation
    if (!validate()) return false;
    
    setSubmitting(true);
    setSuccess(false);
    
    try {
      // If onSubmit was provided, call it
      if (onSubmit) {
        const result = await onSubmit(getFormData());
        if (result) {
          setSuccess(true);
          return true;
        }
      } else {
        // If no onSubmit was provided, show an error
        throw new Error('No submit function defined');
      }
      
      return false;
    } catch (error) {
      console.error('Form error:', error as Error);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'error'
      });
      
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [submitting, validate, onSubmit, getFormData, toast]);
  
  // Reset form
  const resetForm = useCallback(() => {
    setName(initialData.name || '');
    setEmail(initialData.email || '');
    setPhone(initialData.phone || '');
    setService(initialData.service || '');
    setMessage(initialData.message || '');
    setStatus(initialData.status || RequestStatus.NEW);
    setErrors({});
    setSuccess(false);
  }, [initialData]);
  
  // Update a single field and clear its error
  const updateField = useCallback((field: string, value: string) => {
    const setters: Record<string, (value: any) => void> = {
      name: setName,
      email: setEmail,
      phone: setPhone,
      service: setService,
      message: setMessage,
      status: setStatus
    };
    
    const setter = setters[field];
    if (setter) {
      setter(value);
      
      // Clear error for this field
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  }, [errors]);
  
  return {
    // Fields
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    service,
    setService,
    message,
    setMessage,
    status,
    setStatus,
    
    // Form state
    errors,
    submitting,
    success,
    
    // Functions
    validate,
    handleSubmit,
    resetForm,
    updateField,
    getFormData
  };
}
