import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectService } from '../../api/services/projectService';
import { customerService } from '../../api/services/customerService';
import { serviceService } from '../../api/services/serviceService';
import { ArrowLeft, Save } from 'lucide-react';
import React from 'react';

const EditProject = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    amount: 0,
    status: 'neu',
    customer_id: '',
    service_id: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        
        setIsLoading(true);
        const [projectData, customersData, servicesData] = await Promise.all([
          projectService.getById(parseInt(id)),
          customerService.getAll({ status: 'aktiv' }),
          serviceService.getAll()
        ]);
        
        setCustomers(customersData.data || []);
        setServices(servicesData.data || []);
        
        setFormData({
          title: projectData.title || '',
          description: projectData.description || '',
          startDate: projectData.startDate ? new Date(projectData.startDate).toISOString().split('T')[0] : '',
          endDate: projectData.endDate ? new Date(projectData.endDate).toISOString().split('T')[0] : '',
          amount: projectData.amount || 0,
          status: projectData.status || 'neu',
          customer_id: projectData.customer_id ? projectData.customer_id.toString() : '',
          service_id: projectData.service_id ? projectData.service_id.toString() : ''
        });
      } catch (err: any) {
        console.error('Error fetching project data:', err);
        setError(err.message || 'Failed to load project data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Projekttitel ist erforderlich');
      return false;
    }
    if (!formData.customer_id) {
      setError('Bitte wählen Sie einen Kunden aus');
      return false;
    }
    if (!formData.startDate) {
      setError('Startdatum ist erforderlich');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (!id) throw new Error('Project ID is missing');
      
      const projectData = {
        ...formData,
        customer_id: parseInt(formData.customer_id as string),
        service_id: formData.service_id ? parseInt(formData.service_id as string) : undefined,
        amount: parseFloat(formData.amount.toString())
      };

      await projectService.update(parseInt(id), projectData);
      navigate(`/dashboard/projects/${id}`);
    } catch (err: any) {
      console.error('Error updating project:', err);
      setError(err.message || 'Fehler beim Aktualisieren des Projekts');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(`/dashboard/projects/${id}`)}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Projekt bearbeiten</h1>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Projektdaten</h2>
        </div>
        
        <div className="px-6 py-5">
          {/* Project title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Projekttitel*
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          {/* Customer selection */}
          <div className="mb-6">
            <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-1">
              Kunde*
            </label>
            <select
              id="customer_id"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">-- Kunde auswählen --</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.firstName} {customer.lastName}{customer.company ? ` (${customer.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Service selection */}
          <div className="mb-6">
            <label htmlFor="service_id" className="block text-sm font-medium text-gray-700 mb-1">
              Dienstleistung
            </label>
            <select
              id="service_id"
              name="service_id"
              value={formData.service_id}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">-- Keine Dienstleistung --</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Startdatum*
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Enddatum
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Betrag (€)
            </label>
            <input
              type="number"
              name="amount"
              id="amount"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          {/* Status selection */}
          <div className="mb-6">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="neu">Neu</option>
              <option value="in_bearbeitung">In Bearbeitung</option>
              <option value="abgeschlossen">Abgeschlossen</option>
              <option value="storniert">Storniert</option>
            </select>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Beschreibung
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              to={`/dashboard/projects/${id}`}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
              {!isSubmitting && <Save size={16} className="ml-2" />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProject;