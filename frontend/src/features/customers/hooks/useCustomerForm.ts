import { useState, useCallback } from 'react';
import { CustomerResponseDto, CreateCustomerDto, UpdateCustomerDto } from '@/domain/dtos/CustomerDtos';
import { useToast } from '@/shared/hooks/useToast';
import { formatPhoneNumber, isValidPhone } from '@/infrastructure/common/validation/userValidation';

type FormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
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
  const [zipCode, setZipCode] = useState(initialData.zipCode || '');
  const [country, setCountry] = useState(initialData.country || '');
  const [companyName, setCompanyName] = useState(initialData.companyName || '');
  const [vatNumber, setVatNumber] = useState(initialData.vatNumber || '');
  const [notes, setNotes] = useState(initialData.notes || '');
  
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
    if (phone && !isValidPhone(phone)) {
      newErrors.phone = 'Ungültiges Telefonnummer-Format';
    }
    
    // Setze Fehler und gib Validierungsstatus zurück
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, email, phone]);
  
  // Erstelle das Formularobjekt
  const getFormData = useCallback((): CreateCustomerDto | UpdateCustomerDto => {
    return {
      name,
      email: email || undefined,
      phone: phone ? formatPhoneNumber(phone) : undefined,
      address: address || undefined,
      city: city || undefined,
      zipCode: zipCode || undefined,
      country: country || undefined,
      companyName: companyName || undefined,
      vatNumber: vatNumber || undefined,
      notes: notes || undefined
    };
  }, [
    name, email, phone, address, 
    city, zipCode, country, companyName, 
    vatNumber, notes
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
      console.error('Formularfehler:', error);
      
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
    setZipCode(initialData.zipCode || '');
    setCountry(initialData.country || '');
    setCompanyName(initialData.companyName || '');
    setVatNumber(initialData.vatNumber || '');
    setNotes(initialData.notes || '');
    setErrors({});
    setSuccess(false);
  }, [initialData]);
  
  // Einzelnes Feld aktualisieren und Fehler löschen
  const updateField = useCallback((field: string, value: string) => {
    const setters: Record<string, (value: string) => void> = {
      name: setName,
      email: setEmail,
      phone: (value) => setPhone(value),
      address: setAddress,
      city: setCity,
      zipCode: setZipCode,
      country: setCountry,
      companyName: setCompanyName,
      vatNumber: setVatNumber,
      notes: setNotes
    };
    
    const setter = setters[field];
    if (setter) {
      setter(value);
      
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
    zipCode,
    setZipCode,
    country,
    setCountry,
    companyName,
    setCompanyName,
    vatNumber,
    setVatNumber,
    notes,
    setNotes,
    
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
