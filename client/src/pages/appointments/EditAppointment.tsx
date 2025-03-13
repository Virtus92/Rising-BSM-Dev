import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { appointmentService } from '../../api/services/appointmentService';
import { customerService } from '../../api/services/customerService';
import { projectService } from '../../api/services/projectService';
import { ArrowLeft, Save } from 'lucide-react';
import React from 'react';

const EditAppointment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    titel: '',
    kunde_id: '',
    projekt_id: '',
    termin_datum: '',
    termin_zeit: '',
    dauer: 60,
    ort: '',
    beschreibung: '',
    status: 'geplant'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        
        setIsLoading(true);
        const [appointmentData, customersData, projectsData] = await Promise.all([
          appointmentService.getById(parseInt(id)),
          customerService.getAll({ status: 'aktiv' }),
          projectService.getAll({ status: 'neu,in_bearbeitung' })
        ]);
        
        setCustomers(customersData.data || []);
        setProjects(projectsData.data || []);
        
        const appointmentDate = new Date(appointmentData.termin_datum);
        const formattedDate = appointmentDate.toISOString().split('T')[0];
        const formattedTime = appointmentDate.toTimeString().split(' ')[0].substring(0, 5);
        
        setFormData({
          titel: appointmentData.titel || '',
          kunde_id: appointmentData.kunde_id ? appointmentData.kunde_id.toString() : '',
          projekt_id: appointmentData.projekt_id ? appointmentData.projekt_id.toString() : '',
          termin_datum: formattedDate,
          termin_zeit: formattedTime,
          dauer: appointmentData.dauer || 60,
          ort: appointmentData.ort || '',
          beschreibung: appointmentData.beschreibung || '',
          status: appointmentData.status || 'geplant'
        });
        
        if (appointmentData.kunde_id) {
          setFilteredProjects(
            projectsData.data.filter((project: any) => 
              project.customer_id === appointmentData.kunde_id
            )
          );
        }
      } catch (err: any) {
        console.error('Error fetching appointment data:', err);
        setError(err.message || 'Failed to load appointment data');
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
    
    if (name === 'kunde_id') {
      setFilteredProjects(
        projects.filter(project => project.customer_id.toString() === value)
      );
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
      if (!id) throw new Error('Appointment ID is missing');
      
      const dateTime = new Date(`${formData.termin_datum}T${formData.termin_zeit}`);
      
      const appointmentData = {
        titel: formData.titel,
        kunde_id: parseInt(formData.kunde_id as string),
        projekt_id: formData.projekt_id ? parseInt(formData.projekt_id as string) : null,
        termin_datum: dateTime.toISOString(),
        dauer: parseInt(formData.dauer.toString()),
        ort: formData.ort,
        beschreibung: formData.beschreibung,
        status: formData.status
      };

      await appointmentService.update(parseInt(id), appointmentData);
      navigate(`/dashboard/termine/${id}`);
    } catch (err: any) {
      console.error('Error updating appointment:', err);
      setError(err.message || 'Fehler beim Aktualisieren des Termins');
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
            onClick={() => navigate(`/dashboard/termine/${id}`)}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Termin bearbeiten</h1>
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
              to={`/dashboard/termine/${id}`}
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

export default EditAppointment;