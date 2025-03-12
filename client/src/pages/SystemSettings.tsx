import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsService } from '../api/services/settingsService';
import { useAuth } from '../context/AuthContext';
import React from 'react';

const SystemSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    // Only admins can access this page
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    fetchSystemSettings();
  }, [user, navigate]);

  const fetchSystemSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSystemSettings();
      setSettings(data.settings || {});
      
      // Initialize form data from settings
      const initialFormData: Record<string, any> = {};
      Object.keys(data.settings || {}).forEach(category => {
        data.settings[category].forEach((setting: any) => {
          initialFormData[setting.key] = setting.value;
        });
      });
      setFormData(initialFormData);
    } catch (err: any) {
      console.error('Error fetching system settings:', err);
      setError('Fehler beim Laden der Systemeinstellungen');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle different input types
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await settingsService.updateSystemSettings(formData);
      setSuccess('Systemeinstellungen erfolgreich gespeichert');
    } catch (err: any) {
      console.error('Error updating system settings:', err);
      setError(err.message || 'Fehler beim Speichern der Systemeinstellungen');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Systemeinstellungen</h1>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 p-4 rounded-md text-green-700 mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {Object.keys(settings).map(category => (
          <div key={category} className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">
                {category === 'allgemein' ? 'Allgemeine Einstellungen' :
                 category === 'email' ? 'E-Mail-Einstellungen' :
                 category === 'sicherheit' ? 'Sicherheitseinstellungen' :
                 category}
              </h2>
            </div>
            <div className="px-6 py-5 space-y-6">
              {settings[category].map(setting => (
                <div key={setting.key} className="space-y-1">
                  <label htmlFor={setting.key} className="block text-sm font-medium text-gray-700">
                    {setting.description}
                  </label>
                  
                  {setting.type === 'boolean' && (
                    <div className="flex items-center">
                      <input
                        id={setting.key}
                        name={setting.key}
                        type="checkbox"
                        checked={!!formData[setting.key]}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor={setting.key} className="ml-2 block text-sm text-gray-900">
                        {formData[setting.key] ? 'Aktiviert' : 'Deaktiviert'}
                      </label>
                    </div>
                  )}
                  
                  {setting.type === 'string' && !setting.options && (
                    <input
                      type="text"
                      id={setting.key}
                      name={setting.key}
                      value={formData[setting.key] || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  )}
                  
                  {setting.type === 'number' && (
                    <input
                      type="number"
                      id={setting.key}
                      name={setting.key}
                      value={formData[setting.key] || 0}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  )}
                  
                  {setting.type === 'string' && setting.options && (
                    <select
                      id={setting.key}
                      name={setting.key}
                      value={formData[setting.key] || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      {setting.options.split(',').map((option: string) => (
                        <option key={option} value={option.trim()}>
                          {option.trim()}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {setting.type === 'text' && (
                    <textarea
                      id={setting.key}
                      name={setting.key}
                      value={formData[setting.key] || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/dashboard/settings')}
            className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Zurück
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {isSubmitting ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;