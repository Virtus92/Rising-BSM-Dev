import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { appointmentService } from '../../api/services/appointmentService';
import { customerService } from '../../api/services/customerService';
import { projectService } from '../../api/services/projectService';
import { ArrowLeft, Save } from 'lucide-react';
import React from 'react';

const NewAppointment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Extract params from URL if present
  const queryParams = new URLSearchParams(location.search);
  const preselectedCustomerId = queryParams.get('kunde_id');
  const preselectedProjectId = queryParams.get('projekt_id');

  // Set default date to today and time to next full hour
  const today = new Date();
  const nextHour = new Date(today);
  nextHour.setHours(today.getHours() + 1, 0, 0, 0);
  
  const [formData, setFormData] = useState({
    titel: '',
    kunde_id: preselectedCustomerId || '',
    projekt_id: preselectedProjectId || '',
    termin_datum: today.toISOString().split('T')[0],
    termin_zeit: nextHour.toTimeString().split(' ')[0].substring(0, 5),
    dauer: 60,
    ort: '',
    beschreibung: '',
    status: 'geplant'
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch customers for dropdown
        const customersData = await customerService.getAll({ status: 'aktiv' });
        setCustomers(customersData.data || []);

        // Fetch all projects for dropdown
        const projectsData = await projectService.getAll({ status: 'neu,in_bearbeitung' });
        setProjects(projectsData.data || []);
        
        // Filter projects if customer is preselected
        if (preselectedCustomerId) {
          setFilteredProjects(projectsData.data.filter(
            (project: any) => project.customer_id.toString() === preselectedCustomerId
          ));
        } else {
          setFilteredProjects(projectsData.data || []);
        }
      } catch (err: any) {
        console.error('Error fetching form data:', err);
        setError('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [preselectedCustomerId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Filter projects when customer selection changes
    if (name === 'kunde_id') {
      setFilteredProjects(
        projects.filter(project => project.customer_id.toString() === value)
      );
      // Reset project selection if customer changes
      setFormData(prev => ({
        ...prev,
        kunde_id: value,
        projekt_id: ''
      }));
    }
  };

  const validateForm = () => {
    if (!formData.titel.trim()) {
      setError('Termintitel ist erforderlich');
      return false;
    }
    if (!formData.kunde_id) {
      setError('Bitte wählen Sie einen Kunden aus');
      return false;
    }
    if (!formData.termin_datum) {
      setError('Datum ist erforderlich');
      return false;
    }
    if (!formData.termin_zeit) {
      setError('Uhrzeit ist erforderlich');
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
      // Combine date and time
      const dateTime = new Date(`${formData.termin_datum}T${formData.termin_zeit}`);
      
      const appointmentData = {
        titel: formData.titel,
        kunde_id: parseInt(formData.kunde_id as string),
        projekt_id: formData.projekt_id ? parseInt(formData.projekt_id as string) : undefined,
        termin_datum: dateTime.toISOString(),
        dauer: parseInt(formData.dauer.toString()),
        ort: formData.ort,
        beschreibung: formData.beschreibung,
        status: formData.status
      };

      const result = await appointmentService.create(appointmentData);
      navigate(`/dashboard/termine/${result.id}`);
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      setError(err.message || 'Fehler beim Erstellen des Termins');
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
            onClick={() => navigate('/dashboard/termine')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Neuer Termin</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Termindaten</h2>
        </div>
        
        <div className="px-6 py-5">
          {/* Title */}
          <div className="mb-6">
            <label htmlFor="titel" className="block text-sm font-medium text-gray-700 mb-1">
              Termintitel*
            </label>
            <input
              type="text"
              name="titel"
              id="titel"
              value={formData.titel}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          {/* Customer selection */}
          <div className="mb-6">
            <label htmlFor="kunde_id" className="block text-sm font-medium text-gray-700 mb-1">
              Kunde*
            </label>
            <select
              id="kunde_id"
              name="kunde_id"
              value={formData.kunde_id}
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

          {/* Project selection */}
          <div className="mb-6">
            <label htmlFor="projekt_id" className="block text-sm font-medium text-gray-700 mb-1">
              Projekt
            </label>
            <select
              id="projekt_id"
              name="projekt_id"
              value={formData.projekt_id}
              onChange={handleInputChange}
              disabled={!formData.kunde_id}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                !formData.kunde_id ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="">-- Kein Projekt --</option>
              {filteredProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
            {!formData.kunde_id && (
              <p className="mt-1 text-xs text-gray-500">Bitte wählen Sie zuerst einen Kunden aus</p>
            )}
          </div>

          {/* Date and time fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div>
              <label htmlFor="termin_datum" className="block text-sm font-medium text-gray-700 mb-1">
                Datum*
              </label>
              <input
                type="date"
                name="termin_datum"
                id="termin_datum"
                value={formData.termin_datum}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="termin_zeit" className="block text-sm font-medium text-gray-700 mb-1">
                Uhrzeit*
              </label>
              <input
                type="time"
                name="termin_zeit"
                id="termin_zeit"
                value={formData.termin_zeit}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="dauer" className="block text-sm font-medium text-gray-700 mb-1">
                Dauer (Minuten)
              </label>
              <input
                type="number"
                name="dauer"
                id="dauer"
                min="15"
                step="15"
                value={formData.dauer}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Location */}
          <div className="mb-6">
            <label htmlFor="ort" className="block text-sm font-medium text-gray-700 mb-1">
              Ort
            </label>
            <input
              type="text"
              name="ort"
              id="ort"
              value={formData.ort}
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
              <option value="geplant">Geplant</option>
              <option value="bestaetigt">Bestätigt</option>
              <option value="abgeschlossen">Abgeschlossen</option>
              <option value="storniert">Storniert</option>
            </select>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="beschreibung" className="block text-sm font-medium text-gray-700 mb-1">
              Beschreibung
            </label>
            <textarea
              id="beschreibung"
              name="beschreibung"
              rows={3}
              value={formData.beschreibung}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              to="/dashboard/termine"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isSubmitting ? 'Wird erstellt...' : 'Termin erstellen'}
              {!isSubmitting && <Save size={16} className="ml-2" />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewAppointment;