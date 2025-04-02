'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { createProject, getCustomers, getServices } from '@/lib/api';

function ProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams?.get('customerId');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Array<{id: number, name: string}>>([]);
  const [services, setServices] = useState<Array<{id: number, name: string, basePrice: number}>>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    customerId: initialCustomerId || '',
    serviceId: '',
    startDate: '',
    endDate: '',
    amount: '',
    description: '',
    status: 'new'
  });

  // Lade Kunden und Dienstleistungen für die Dropdown-Felder
  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        const [customersResponse, servicesResponse] = await Promise.all([
          getCustomers({ limit: 100, status: 'active' }),
          getServices({ active: true })
        ]);
        
        if (customersResponse.success) {
          setCustomers(customersResponse.data.customers);
        }
        
        if (servicesResponse.success) {
          setServices(servicesResponse.data.services);
        }
      } catch (err) {
        console.error('Error loading form options:', err);
        setError('Fehler beim Laden der Formularoptionen. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoadingOptions(false);
      }
    }
    
    loadOptions();
  }, []);

  // Handling für Inputänderung
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Wenn Service ausgewählt wird, Standard-Preis setzen
    if (name === 'serviceId' && value) {
      const selectedService = services.find(service => service.id === parseInt(value));
      if (selectedService) {
        setFormData(prev => ({ ...prev, [name]: value, amount: selectedService.basePrice.toString() }));
      }
    }
  };

  // Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Formatiere die Daten für die API
      const projectData = {
        ...formData,
        customerId: formData.customerId ? parseInt(formData.customerId) : null,
        serviceId: formData.serviceId ? parseInt(formData.serviceId) : null,
        amount: formData.amount ? parseFloat(formData.amount) : null
      };
      
      const response = await createProject(projectData);
      
      if (response.success) {
        router.push(`/dashboard/projects/${response.data.project.id}`);
      } else {
        setError(response.message || 'Fehler beim Erstellen des Projekts');
      }
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Fehler beim Erstellen des Projekts. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Neues Projekt erstellen</h1>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zur Liste
        </Link>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Es gab einen Fehler</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white dark:bg-slate-800 shadow overflow-hidden rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Grundinformationen</h3>
              <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Projekttitel <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="title"
                      id="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-md"
                      disabled={loadingOptions}
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kunde
                  </label>
                  <div className="mt-1">
                    <select
                      id="customerId"
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-md"
                      disabled={loadingOptions}
                    >
                      <option value="">-- Kunden auswählen --</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.customerId && (
                    <div className="mt-2 text-sm">
                      <Link 
                        href={`/dashboard/customers/${formData.customerId}`}
                        className="text-green-600 dark:text-green-500 hover:underline"
                      >
                        Kundendetails anzeigen
                      </Link>
                    </div>
                  )}
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dienstleistung
                  </label>
                  <div className="mt-1">
                    <select
                      id="serviceId"
                      name="serviceId"
                      value={formData.serviceId}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-md"
                      disabled={loadingOptions}
                    >
                      <option value="">-- Dienstleistung auswählen --</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name} ({new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(service.basePrice)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Startdatum
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="startDate"
                      id="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-md"
                      disabled={loadingOptions}
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enddatum
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="endDate"
                      id="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-md"
                      disabled={loadingOptions}
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Betrag (€)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">€</span>
                    </div>
                    <input
                      type="number"
                      name="amount"
                      id="amount"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={handleChange}
                      className="focus:ring-green-500 focus:border-green-500 block w-full pl-9 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-md"
                      disabled={loadingOptions}
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <select
                      id="status"
                      name="status"
                      required
                      value={formData.status}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-md"
                      disabled={loadingOptions}
                    >
                      <option value="new">Neu</option>
                      <option value="in-progress">In Bearbeitung</option>
                      <option value="on-hold">Pausiert</option>
                      <option value="completed">Abgeschlossen</option>
                      <option value="cancelled">Abgebrochen</option>
                    </select>
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Beschreibung
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-md"
                      disabled={loadingOptions}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Geben Sie eine detaillierte Beschreibung des Projekts an.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-gray-600 flex justify-end">
            <Link
              href="/dashboard/projects"
              className="mr-4 px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={loading || loadingOptions}
              className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Speichern
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Wrap the component that uses useSearchParams in a Suspense boundary
export default function NewProjectPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectForm />
    </Suspense>
  );
}