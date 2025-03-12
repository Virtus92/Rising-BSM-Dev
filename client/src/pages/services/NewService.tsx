// client/src/pages/services/NewService.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { serviceService } from '../../api/services/serviceService';
import { ArrowLeft, Save } from 'lucide-react';
import React from 'react';

const NewService = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceBase: 0,
    unit: 'Stunde',
    vatRate: 19,
    active: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (name === 'priceBase' || name === 'vatRate') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name ist erforderlich');
      return false;
    }
    if (formData.priceBase < 0) {
      setError('Preis muss größer oder gleich 0 sein');
      return false;
    }
    if (formData.vatRate < 0 || formData.vatRate > 100) {
      setError('MwSt-Satz muss zwischen 0 und 100 liegen');
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
      const result = await serviceService.create(formData);
      navigate(`/dashboard/dienste/${result.id}`);
    } catch (err: any) {
      console.error('Error creating service:', err);
      setError(err.message || 'Fehler beim Erstellen der Dienstleistung');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/dashboard/dienste')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Neue Dienstleistung</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Dienstleistungsdaten</h2>
        </div>
        
        <div className="px-6 py-5">
          {/* Name field */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name*
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          {/* Price fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div>
              <label htmlFor="priceBase" className="block text-sm font-medium text-gray-700 mb-1">
                Preis (€)*
              </label>
              <input
                type="number"
                name="priceBase"
                id="priceBase"
                step="0.01"
                min="0"
                value={formData.priceBase}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                Einheit
              </label>
              <input
                type="text"
                name="unit"
                id="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="z.B. Stunde, Tag, Einheit"
              />
            </div>
            <div>
              <label htmlFor="vatRate" className="block text-sm font-medium text-gray-700 mb-1">
                MwSt-Satz (%)*
              </label>
              <input
                type="number"
                name="vatRate"
                id="vatRate"
                min="0"
                max="100"
                step="0.1"
                value={formData.vatRate}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Active status */}
          <div className="mb-6">
            <div className="flex items-center">
              <input
                id="active"
                name="active"
                type="checkbox"
                checked={formData.active}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Aktiv
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Nur aktive Dienstleistungen können für neue Projekte ausgewählt werden
            </p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Beschreibung
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              to="/dashboard/dienste"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isSubmitting ? 'Wird erstellt...' : 'Dienstleistung erstellen'}
              {!isSubmitting && <Save size={16} className="ml-2" />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewService;