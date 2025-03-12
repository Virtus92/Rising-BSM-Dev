import { useState, useEffect } from 'react';
import { settingsService } from '../api/services/settingsService';
import { useAuth } from '../context/AuthContext';
import React from 'react';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    sprache: 'de',
    dark_mode: false,
    benachrichtigungen_email: true,
    benachrichtigungen_push: false,
    benachrichtigungen_intervall: 'sofort'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setFormData({
        sprache: settings.sprache || 'de',
        dark_mode: settings.dark_mode || false,
        benachrichtigungen_email: settings.benachrichtigungen_email || true,
        benachrichtigungen_push: settings.benachrichtigungen_push || false,
        benachrichtigungen_intervall: settings.benachrichtigungen_intervall || 'sofort'
      });
    }
  }, [settings]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getUserSettings();
      setSettings(data.settings);
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setError('Fehler beim Laden der Einstellungen');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await settingsService.updateUserSettings(formData);
      setSuccess('Einstellungen erfolgreich gespeichert');
    } catch (err: any) {
      console.error('Error updating settings:', err);
      setError(err.message || 'Fehler beim Speichern der Einstellungen');
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
        <h1 className="text-2xl font-bold text-gray-800">Einstellungen</h1>
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

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Allgemeine Einstellungen</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="sprache" className="block text-sm font-medium text-gray-700">Sprache</label>
              <select
                id="sprache"
                name="sprache"
                value={formData.sprache}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="de">Deutsch</option>
                <option value="en">Englisch</option>
              </select>
            </div>
            <div className="flex items-center h-full mt-6">
              <input
                id="dark_mode"
                name="dark_mode"
                type="checkbox"
                checked={formData.dark_mode}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="dark_mode" className="ml-2 block text-sm text-gray-900">
                Dark Mode
              </label>
            </div>
          </div>

          <div className="px-6 py-5 border-t border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Benachrichtigungseinstellungen</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="benachrichtigungen_email"
                name="benachrichtigungen_email"
                type="checkbox"
                checked={formData.benachrichtigungen_email}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="benachrichtigungen_email" className="ml-2 block text-sm text-gray-900">
                E-Mail-Benachrichtigungen erhalten
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="benachrichtigungen_push"
                name="benachrichtigungen_push"
                type="checkbox"
                checked={formData.benachrichtigungen_push}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="benachrichtigungen_push" className="ml-2 block text-sm text-gray-900">
                Push-Benachrichtigungen aktivieren
              </label>
            </div>
            <div>
              <label htmlFor="benachrichtigungen_intervall" className="block text-sm font-medium text-gray-700">Benachrichtigungsintervall</label>
              <select
                id="benachrichtigungen_intervall"
                name="benachrichtigungen_intervall"
                value={formData.benachrichtigungen_intervall}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="sofort">Sofort</option>
                <option value="taeglich">Täglich</option>
                <option value="woechentlich">Wöchentlich</option>
              </select>
            </div>
          </div>

          <div className="pt-5">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {isSubmitting ? 'Speichern...' : 'Speichern'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {user?.role === 'admin' && (
        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Administrator-Einstellungen</h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-gray-600">
              Als Administrator haben Sie Zugriff auf erweiterte Einstellungen des Systems.
            </p>
            <div className="mt-4 space-y-4">
              <a
                href="/dashboard/settings/system"
                className="block px-4 py-2 text-sm text-center font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Systemeinstellungen
              </a>
              <a
                href="/dashboard/settings/backup"
                className="block px-4 py-2 text-sm text-center font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Backup-Einstellungen
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;