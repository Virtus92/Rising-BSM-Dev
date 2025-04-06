'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, isLoading, error, updateSetting } = useSettings();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    companyName: '',
    timezone: 'Europe/Berlin',
    dateFormat: 'dd.MM.yyyy',
    language: 'de'
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load settings into form when they change
  useEffect(() => {
    if (!isLoading && settings) {
      setFormData({
        companyName: settings.companyName || '',
        timezone: settings.timezone || 'Europe/Berlin',
        dateFormat: settings.dateFormat || 'dd.MM.yyyy',
        language: settings.language || 'de'
      });
    }
  }, [isLoading, settings]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle system settings save
  const handleSystemSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Update each setting individually
      const promises = [
        updateSetting('companyName', formData.companyName),
        updateSetting('timezone', formData.timezone),
        updateSetting('dateFormat', formData.dateFormat),
        updateSetting('language', formData.language)
      ];

      await Promise.all(promises);
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Einstellungen</h1>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'profile'
                  ? 'border-b-2 border-green-500 text-green-600 dark:text-green-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Profil
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'account'
                  ? 'border-b-2 border-green-500 text-green-600 dark:text-green-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Account
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'notifications'
                  ? 'border-b-2 border-green-500 text-green-600 dark:text-green-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Benachrichtigungen
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('system')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'system'
                    ? 'border-b-2 border-green-500 text-green-600 dark:text-green-500'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                System
              </button>
            )}
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profil-Einstellungen</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-gray-300 dark:bg-gray-600 mb-4"></div>
                    <button className="text-sm text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400">
                      Profilbild ändern
                    </button>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        defaultValue={user?.name || ''}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        E-Mail-Adresse
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        defaultValue={user?.email || ''}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Über mich
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
                      ></textarea>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Änderungen speichern
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account-Einstellungen</h2>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Passwort ändern</h3>
                <form className="space-y-4">
                  <div>
                    <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Aktuelles Passwort
                    </label>
                    <input
                      type="password"
                      id="current-password"
                      name="current-password"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Neues Passwort
                    </label>
                    <input
                      type="password"
                      id="new-password"
                      name="new-password"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Passwort bestätigen
                    </label>
                    <input
                      type="password"
                      id="confirm-password"
                      name="confirm-password"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Passwort ändern
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Benachrichtigungseinstellungen</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="email-notifications"
                      name="email-notifications"
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="email-notifications" className="font-medium text-gray-700 dark:text-gray-300">
                      E-Mail-Benachrichtigungen
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Erhalten Sie Benachrichtigungen per E-Mail über neue Aktivitäten.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="browser-notifications"
                      name="browser-notifications"
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="browser-notifications" className="font-medium text-gray-700 dark:text-gray-300">
                      Browser-Benachrichtigungen
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Erhalten Sie Benachrichtigungen im Browser, wenn Sie die Anwendung verwenden.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Einstellungen speichern
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'system' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Systemeinstellungen</h2>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                  <p className="text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Allgemeine Einstellungen</h3>
                <form className="space-y-4" onSubmit={handleSystemSettingsSave}>
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Firmenname
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Zeitzone
                    </label>
                    <select
                      id="timezone"
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="Europe/Berlin">Europe/Berlin (UTC+1/UTC+2)</option>
                      <option value="Europe/Vienna">Europe/Vienna (UTC+1/UTC+2)</option>
                      <option value="Europe/London">Europe/London (UTC+0/UTC+1)</option>
                      <option value="America/New_York">America/New_York (UTC-5/UTC-4)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Datumsformat
                    </label>
                    <select
                      id="dateFormat"
                      name="dateFormat"
                      value={formData.dateFormat}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="dd.MM.yyyy">DD.MM.YYYY (31.12.2023)</option>
                      <option value="yyyy-MM-dd">YYYY-MM-DD (2023-12-31)</option>
                      <option value="MM/dd/yyyy">MM/DD/YYYY (12/31/2023)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sprache
                    </label>
                    <select
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="de">Deutsch</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving || isLoading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Speichern...' : 'Einstellungen speichern'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
