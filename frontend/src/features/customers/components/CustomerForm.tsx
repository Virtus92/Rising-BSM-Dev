'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { CustomerResponseDto, CreateCustomerDto, UpdateCustomerDto } from '@/domain/dtos/CustomerDtos';
import { useCustomerForm } from '@/features/customers/hooks/useCustomerForm';
import { useToast } from '@/shared/hooks/useToast';

interface CustomerFormProps {
  initialData?: Partial<CustomerResponseDto>;
  onSubmit: (data: CreateCustomerDto | UpdateCustomerDto) => Promise<CustomerResponseDto | null>;
  mode: 'create' | 'edit';
  onCancel?: () => void;
}

/**
 * Formular zum Erstellen und Bearbeiten von Kunden
 */
export default function CustomerForm({ initialData = {}, onSubmit, mode, onCancel }: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  const {
    name, setName,
    email, setEmail,
    phone, setPhone,
    address, setAddress,
    city, setCity,
    zipCode, setZipCode,
    country, setCountry,
    companyName, setCompanyName,
    vatNumber, setVatNumber,
    notes, setNotes,
    errors,
    submitting,
    handleSubmit,
    updateField
  } = useCustomerForm({
    initialData,
    onSubmit: async (data) => {
      try {
        const result = await onSubmit(data);
        if (result) {
          const successMessage = mode === 'create' 
            ? 'Kunde wurde erfolgreich erstellt' 
            : 'Kunde wurde erfolgreich aktualisiert';
            
          toast({
            title: 'Erfolg',
            description: successMessage,
            variant: 'success'
          });
          
          // Nach dem Speichern zur Detailseite oder Liste navigieren
          if (mode === 'create') {
            router.push(`/dashboard/customers/${result.id}`);
          } else {
            router.push(`/dashboard/customers/${initialData.id}`);
          }
          
          return result;
        }
        
        return null;
      } catch (error) {
        console.error('Form submission error:', error);
        toast({
          title: 'Fehler',
          description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
          variant: 'error'
        });
        
        return null;
      }
    }
  });

  // Funktion zum Überprüfen, ob Änderungen vorgenommen wurden
  const checkForChanges = useCallback(() => {
    const hasNameChanged = name !== (initialData.name || '');
    const hasEmailChanged = email !== (initialData.email || '');
    const hasPhoneChanged = phone !== (initialData.phone || '');
    const hasAddressChanged = address !== (initialData.address || '');
    const hasCityChanged = city !== (initialData.city || '');
    const hasZipCodeChanged = zipCode !== (initialData.zipCode || '');
    const hasCountryChanged = country !== (initialData.country || '');
    const hasCompanyNameChanged = companyName !== (initialData.companyName || '');
    const hasVatNumberChanged = vatNumber !== (initialData.vatNumber || '');
    const hasNotesChanged = notes !== (initialData.notes || '');
    
    const changes = hasNameChanged || hasEmailChanged || hasPhoneChanged || 
      hasAddressChanged || hasCityChanged || hasZipCodeChanged || 
      hasCountryChanged || hasCompanyNameChanged || hasVatNumberChanged || 
      hasNotesChanged;
    
    setHasChanges(changes);
  }, [
    name, email, phone, address, city, zipCode, country, 
    companyName, vatNumber, notes, initialData
  ]);

  // Die checkForChanges-Funktion bei jeder Änderung aufrufen
  const handleFieldChange = (field: string, value: string) => {
    updateField(field, value);
    checkForChanges();
  };

  // Funktion zum Abbrechen und Zurückgehen
  const handleCancel = () => {
    if (hasChanges) {
      setShowConfirmLeave(true);
    } else {
      if (onCancel) {
        onCancel();
      } else {
        if (mode === 'edit' && initialData.id) {
          router.push(`/dashboard/customers/${initialData.id}`);
        } else {
          router.push('/dashboard/customers');
        }
      }
    }
  };

  // Funktion zur Bestätigung des Verlassens trotz Änderungen
  const confirmLeave = () => {
    setShowConfirmLeave(false);
    if (onCancel) {
      onCancel();
    } else {
      if (mode === 'edit' && initialData.id) {
        router.push(`/dashboard/customers/${initialData.id}`);
      } else {
        router.push('/dashboard/customers');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={handleCancel}
            className="mr-2 p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Neuen Kunden erstellen' : 'Kundendaten bearbeiten'}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Speichern...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </>
          )}
        </button>
      </div>

      {/* Formular */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Allgemeine Informationen</h3>
            
            {/* Name */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className={`w-full px-3 py-2 border ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:text-white`}
                placeholder="Vollständiger Name"
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>
            
            {/* Firma */}
            <div className="mb-4">
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Firma
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={companyName}
                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:text-white"
                placeholder="Firmenname (optional)"
              />
            </div>
            
            {/* UID/USt-ID */}
            <div className="mb-4">
              <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                UID/USt-ID
              </label>
              <input
                id="vatNumber"
                name="vatNumber"
                type="text"
                value={vatNumber}
                onChange={(e) => handleFieldChange('vatNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:text-white"
                placeholder="UID oder USt-ID (optional)"
              />
            </div>
            
            {/* E-Mail */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-Mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className={`w-full px-3 py-2 border ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:text-white`}
                placeholder="email@beispiel.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>
            
            {/* Telefon */}
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefon
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:text-white"
                placeholder="+43 123 456789"
              />
            </div>
          </div>

          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Adressinformationen</h3>
            
            {/* Adresse */}
            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Adresse
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:text-white"
                placeholder="Straße und Hausnummer"
              />
            </div>
            
            {/* PLZ */}
            <div className="mb-4">
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Postleitzahl
              </label>
              <input
                id="zipCode"
                name="zipCode"
                type="text"
                value={zipCode}
                onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:text-white"
                placeholder="1234"
              />
            </div>
            
            {/* Stadt */}
            <div className="mb-4">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stadt
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:text-white"
                placeholder="Stadt"
              />
            </div>
            
            {/* Land */}
            <div className="mb-4">
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Land
              </label>
              <input
                id="country"
                name="country"
                type="text"
                value={country}
                onChange={(e) => handleFieldChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:text-white"
                placeholder="Österreich"
              />
            </div>
          </div>
        </div>

        {/* Notizen */}
        <div className="mt-6">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Notizen</h3>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            value={notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:text-white"
            placeholder="Zusätzliche Informationen oder Notizen zu diesem Kunden..."
          ></textarea>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                Speichern...
              </>
            ) : (
              'Speichern'
            )}
          </button>
        </div>
      </form>

      {/* Bestätigungsdialog */}
      {showConfirmLeave && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Ungespeicherte Änderungen
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sie haben ungespeicherte Änderungen. Sind Sie sicher, dass Sie die Seite verlassen möchten? Alle nicht gespeicherten Änderungen gehen verloren.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmLeave}
                >
                  Verlassen
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowConfirmLeave(false)}
                >
                  Zurück zum Formular
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}