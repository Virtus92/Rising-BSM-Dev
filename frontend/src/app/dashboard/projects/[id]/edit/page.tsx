'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { getProjectById, updateProject, getCustomers, getServices } from '@/lib/api';
import { Project } from '@/lib/api/types';

// Parameter Type erweitern
interface PageParams {
  id: string;
  [key: string]: string | string[] | undefined;
}

// Interfaces for API responses
interface ProjectResponse {
  project: Project;
}

interface CustomerResponse {
  customers: Array<{id: number, name: string, [key: string]: any}>;
}

interface ServiceResponse {
  services: Array<{id: number, name: string, basePrice: number, [key: string]: any}>;
}

export default function EditProjectPage() {
  const params = useParams() as PageParams;
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const projectId = params.id;
  const preferredStatus = searchParams?.get('status') || undefined;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Array<{id: number, name: string}>>([]);
  const [services, setServices] = useState<Array<{id: number, name: string, basePrice: number}>>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    customerId: '',
    serviceId: '',
    startDate: '',
    endDate: '',
    amount: '',
    description: '',
    status: 'new'
  });

  // Load project data and options
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setLoadingOptions(true);
        setError(null);
        
        // Load project data
        const projectResponse = await getProjectById<ProjectResponse>(projectId);
        
        if (projectResponse.success && projectResponse.data) {
          const project = projectResponse.data.project;
          
          setFormData({
            title: project.title || '',
            customerId: project.customerId?.toString() || '',
            serviceId: project.serviceId?.toString() || '',
            startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
            endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
            amount: project.amount?.toString() || '',
            description: project.description || '',
            status: preferredStatus || project.status || 'new'
          });
        } else {
          setError('Fehler beim Laden der Projektdaten');
        }
        
        // Load customers
        const customersResponse = await getCustomers<CustomerResponse>();
        if (customersResponse.success && customersResponse.data) {
          setCustomers(customersResponse.data.customers);
        }
        
        // Load services
        const servicesResponse = await getServices<ServiceResponse>();
        if (servicesResponse.success && servicesResponse.data) {
          setServices(servicesResponse.data.services);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
        setLoadingOptions(false);
      }
    }
    
    loadData();
  }, [projectId, preferredStatus]);

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      const response = await updateProject<{success: boolean, message?: string}>(projectId, formData);
      
      if (response.success) {
        router.push(`/dashboard/projects/${projectId}`);
      } else {
        setError(response.message || 'Fehler beim Speichern des Projekts');
      }
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Fehler beim Speichern des Projekts. Bitte versuchen Sie es später erneut.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-8">
          <Link href={`/dashboard/projects/${projectId}`} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold">Projektdaten werden geladen...</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-24 bg-gray-200 rounded mb-6"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href={`/dashboard/projects/${projectId}`} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-semibold">Projekt bearbeiten</h1>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Fehler: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Edit form */}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Customer */}
          <div>
            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">Kunde *</label>
            <select
              id="customerId"
              name="customerId"
              value={formData.customerId}
              onChange={handleInputChange}
              required
              disabled={loadingOptions}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Kunde auswählen</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </div>
          
          {/* Service */}
          <div>
            <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-1">Dienstleistung</label>
            <select
              id="serviceId"
              name="serviceId"
              value={formData.serviceId}
              onChange={handleInputChange}
              disabled={loadingOptions}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Dienstleistung auswählen</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.name} (€{service.basePrice.toFixed(2)})</option>
              ))}
            </select>
          </div>
          
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Betrag (€)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Enddatum</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="new">Neu</option>
              <option value="in-progress">In Bearbeitung</option>
              <option value="on-hold">Pausiert</option>
              <option value="completed">Abgeschlossen</option>
              <option value="cancelled">Storniert</option>
            </select>
          </div>
          
          {/* Description */}
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
        </div>
        
        {/* Submit button */}
        <div className="mt-8 flex justify-end">
          <Link 
            href={`/dashboard/projects/${projectId}`}
            className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Abbrechen
          </Link>
          <button 
            type="submit"
            disabled={saving}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            <Save size={16} className="mr-2" />
            {saving ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
