import { useState, useCallback } from 'react';
import { CustomerResponseDto, CreateCustomerDto, UpdateCustomerDto } from '@/domain/dtos/CustomerDtos';
import { useToast } from '@/shared/hooks/useToast';
import { formatPhoneNumber, validatePhone } from '@/core/validation/userValidation';
import { CommonStatus, CustomerType } from '@/domain/enums/CommonEnums';

type FormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  [key: string]: string | undefined;
};

interface UseCustomerFormOptions {
  initialData?: Partial<CustomerResponseDto>;
  onSubmit?: (data: CreateCustomerDto | UpdateCustomerDto) => Promise<CustomerResponseDto | null>;
}

/**
 * Hook zum Verwalten eines Kundenformulars
 * 
 * Bietet Formularstatus, Validierung und Submitting-Logik
 */
export function useCustomerForm({ initialData = {}, onSubmit }: UseCustomerFormOptions = {}) {
  // Formularfelder
  const [name, setName] = useState(initialData.name || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [phone, setPhone] = useState(initialData.phone ? formatPhoneNumber(initialData.phone) : '');
  const [address, setAddress] = useState(initialData.address || '');
  const [city, setCity] = useState(initialData.city || '');
  const [postalCode, setPostalCode] = useState(initialData.postalCode || '');
  const [country, setCountry] = useState(initialData.country || '');
  const [company, setCompany] = useState(initialData.company || '');
  const [vatNumber, setVatNumber] = useState(initialData.vatNumber || '');
  
  // Ensure we use type from initialData, not customerType
  const [customerType, setCustomerType] = useState(initialData.type || CustomerType.PRIVATE);
  const [status, setStatus] = useState(initialData.status || CommonStatus.ACTIVE);
  
  // Ensure newsletter is properly initialized as a boolean
  const [newsletter, setNewsletter] = useState(() => {
    // Make sure to convert to boolean regardless of the type in initialData
    return initialData.newsletter === true ;
  });
  
  // Formularstatus
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { toast } = useToast();
  
  // Validierungsfunktion
  const validate = useCallback(() => {
    const newErrors: FormErrors = {};
    
    // Validiere Name
    if (!name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    
    // Validiere E-Mail (falls vorhanden)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Ungültiges E-Mail-Format';
    }
    
    // Validiere Telefonnummer (falls vorhanden)
    if (phone && !validatePhone(phone)) {
      newErrors.phone = 'Ungültiges Telefonnummer-Format';
    }
    
    // Setze Fehler und gib Validierungsstatus zurück
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, email, phone]);
  
  // Erstelle das Formularobjekt
  const getFormData = useCallback((): CreateCustomerDto | UpdateCustomerDto => {
    // Debug log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Form data before submission:', {
        type: customerType,
        newsletter: newsletter,
        vatNumber: vatNumber
      });
    }
    
    return {
      name,
      email: email || undefined,
      phone: phone ? formatPhoneNumber(phone) : undefined,
      address: address || undefined,
      city: city || undefined,
      postalCode: postalCode || undefined,
      country: country || undefined,
      company: company || undefined,
      vatNumber: vatNumber || undefined,
      // The corrected fields:
      type: customerType,
      status: status,
      // Ensure newsletter is always a boolean
      newsletter: newsletter === true
    };
  }, [
    name, email, phone, address, 
    city, postalCode, country, company,
    vatNumber, customerType, status, newsletter
  ]);
  
  // Formular absenden
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Wenn bereits am Absenden, nichts tun
    if (submitting) return false;
    
    // Validierung durchführen
    if (!validate()) return false;
    
    setSubmitting(true);
    setSuccess(false);
    
    try {
      // Log data pre-submission for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Submitting customer form with data:', getFormData());
      }
      
      // Wenn eine onSubmit-Funktion übergeben wurde, rufe sie auf
      if (onSubmit) {
        const result = await onSubmit(getFormData());
        if (result) {
          setSuccess(true);
          return true;
        }
      } else {
        // Wenn keine onSubmit-Funktion übergeben wurde, zeige einen Hinweis
        throw new Error('Keine Submit-Funktion definiert');
      }
      
      return false;
    } catch (error) {
      console.error('Formularfehler:', error as Error);
      
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten',
        variant: 'error'
      });
      
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [submitting, validate, onSubmit, getFormData, toast]);
  
  // Formular zurücksetzen
  const resetForm = useCallback(() => {
    setName(initialData.name || '');
    setEmail(initialData.email || '');
    setPhone(initialData.phone ? formatPhoneNumber(initialData.phone) : '');
    setAddress(initialData.address || '');
    setCity(initialData.city || '');
    setPostalCode(initialData.postalCode || '');
    setCountry(initialData.country || '');
    setCompany(initialData.company || '');
    setVatNumber(initialData.vatNumber || '');
    
    // Reset the type field to the correct value
    setCustomerType(initialData.type || CustomerType.PRIVATE);
    setStatus(initialData.status || CommonStatus.ACTIVE);
    
    // Make sure we reset newsletter to a proper boolean
    setNewsletter(initialData.newsletter === true );
    
    setErrors({});
    setSuccess(false);
  }, [initialData]);
  
  // Einzelnes Feld aktualisieren und Fehler löschen
  const updateField = useCallback((field: string, value: any) => {
    const setters: Record<string, (value: any) => void> = {
      name: setName,
      email: setEmail,
      phone: (value) => setPhone(value),
      address: setAddress,
      city: setCity,
      postalCode: setPostalCode,
      country: setCountry,
      company: setCompany,
      vatNumber: setVatNumber,
      // Ensure both 'type' and 'customerType' map to the same setter
      customerType: setCustomerType,
      type: setCustomerType,
      status: setStatus,
      // Ensure newsletter is stored as a boolean
      newsletter: (value) => setNewsletter(value === true || value === 'true')
    };
    
    const setter = setters[field];
    if (setter) {
      setter(value);
      
      // Debug log for development
      if (process.env.NODE_ENV === 'development' && 
          (field === 'type' || field === 'customerType' || field === 'newsletter' || field === 'vatNumber')) {
        console.log(`Field ${field} updated:`, value);
      }
      
      // Lösche Fehler für dieses Feld
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
    // Felder
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    address,
    setAddress,
    city,
    setCity,
    postalCode,
    setPostalCode,
    country,
    setCountry,
    company,
    setCompany,
    vatNumber,
    setVatNumber,
    
    // Properly expose all fields
    customerType,
    setCustomerType,
    status,
    setStatus,
    newsletter,
    setNewsletter,
    
    // Formularzustand
    errors,
    submitting,
    success,
    
    // Funktionen
    validate,
    handleSubmit,
    resetForm,
    updateField,
    getFormData
  };
}
