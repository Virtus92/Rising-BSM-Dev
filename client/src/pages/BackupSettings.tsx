import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsService } from '../api/services/settingsService';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Download, Clock, Calendar, Database } from 'lucide-react';
import React from 'react';

const BackupSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  
  const [formData, setFormData] = useState({
    automatisch: true,
    intervall: 'taeglich',
    zeit: '03:00',
    aufbewahrung: 30
  });

  useEffect(() => {
    // Only admins can access this page
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    fetchBackupSettings();
  }, [user, navigate]);

  useEffect(() => {
    if (settings) {
      setFormData({
        automatisch: settings.automatisch !== undefined ? settings.automatisch : true,
        intervall: settings.intervall || 'taeglich',
        zeit: settings.zeit || '03:00',
        aufbewahrung: settings.aufbewahrung || 30
      });
    }
  }, [settings]);

  const fetchBackupSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getBackupSettings();
      setSettings(data.settings || {});
      setBackups(data.backups || []);
    } catch (err: any) {
      console.error('Error fetching backup settings:', err);
      setError('Fehler beim Laden der Backup-Einstellungen');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (name === 'aufbewahrung') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
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
      await settingsService.updateBackupSettings(formData);
      setSuccess('Backup-Einstellungen erfolgreich gespeichert');
      
      // Refresh settings
      const data = await settingsService.getBackupSettings();
      setSettings(data.settings || {});
      setBackups(data.backups || []);
    } catch (err: any) {
      console.error('Error updating backup settings:', err);
      setError(err.message || 'Fehler beim Speichern der Backup-Einstellungen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    setError(null);
    setSuccess(null);

    try {
      await settingsService.triggerManualBackup();
      setSuccess('Backup wurde erfolgreich gestartet');
      
      // Refresh backups
      const data = await settingsService.getBackupSettings();
      setBackups(data.backups || []);
    } catch (err: any) {
      console.error('Error triggering backup:', err);
      setError(err.message || 'Fehler beim Starten des Backups');
    } finally {
      setIsBackingUp(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/dashboard/settings')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Backup-Einstellungen</h1>
        </div>
        <button
          onClick={handleTriggerBackup}
          disabled={isBackingUp}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {isBackingUp ? 'Backup läuft...' : 'Manuelles Backup starten'}
          {!isBackingUp && <Download size={16} className="ml-2" />}
        </button>
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

      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Automatische Backup-Einstellungen</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          <div className="flex items-center">
            <input
              id="automatisch"
              name="automatisch"
              type="checkbox"
              checked={formData.automatisch}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="automatisch" className="ml-2 block text-sm text-gray-900">
              Automatische Backups aktivieren
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="intervall" className="block text-sm font-medium text-gray-700 mb-1">
                Intervall
              </label>
              <select
                id="intervall"
                name="intervall"
                value={formData.intervall}
                onChange={handleInputChange}
                disabled={!formData.automatisch}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                  !formData.automatisch ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="taeglich">Täglich</option>
                <option value="woechentlich">Wöchentlich</option>
                <option value="monatlich">Monatlich</option>
              </select>
            </div>
            <div>
              <label htmlFor="zeit" className="block text-sm font-medium text-gray-700 mb-1">
                Uhrzeit
              </label>
              <input
                type="time"
                id="zeit"
                name="zeit"
                value={formData.zeit}
                onChange={handleInputChange}
                disabled={!formData.automatisch}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                  !formData.automatisch ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div>
              <label htmlFor="aufbewahrung" className="block text-sm font-medium text-gray-700 mb-1">
                Aufbewahrungsdauer (Tage)
              </label>
              <input
                type="number"
                id="aufbewahrung"
                name="aufbewahrung"
                min="1"
                max="365"
                value={formData.aufbewahrung}
                onChange={handleInputChange}
                disabled={!formData.automatisch}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                  !formData.automatisch ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          <div className="pt-5">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {isSubmitting ? 'Speichern...' : 'Einstellungen speichern'}
                {!isSubmitting && <Save size={16} className="ml-2" />}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Letzte Backups</h2>
        </div>
        <div className="px-6 py-5">
          {backups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum & Zeit</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Größe</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backups.map((backup, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{backup.date} {backup.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          backup.type === 'manual' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {backup.type === 'manual' ? 'Manuell' : 'Automatisch'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Database className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{formatFileSize(backup.size)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        
                          <a href={backup.downloadUrl}
                          download
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Herunterladen
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>Keine Backups vorhanden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupSettings;