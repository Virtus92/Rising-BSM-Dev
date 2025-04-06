'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as api from '@/lib/api';
import { initializeClientSettings } from '@/lib/utils/settings-helper';

export interface SystemSettings {
  companyName: string;
  companyLogo?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyWebsite?: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  [key: string]: any;
}

interface SettingsContextType {
  settings: SystemSettings;
  isLoading: boolean;
  error: string | null;
  updateSetting: (key: keyof SystemSettings, value: any) => Promise<boolean>;
  reloadSettings: () => Promise<void>;
}

const defaultSettings: SystemSettings = {
  companyName: 'Rising BSM',
  dateFormat: 'dd.MM.yyyy',
  timeFormat: 'HH:mm',
  currency: 'EUR',
  language: 'de',
  theme: 'system'
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: false,
  error: null,
  updateSetting: async () => false,
  reloadSettings: async () => {}
});

export const useSettings = () => useContext(SettingsContext);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.getSettings();
      
      if (response.success && response.data) {
        // Transform the settings array/object into a key-value map
        let settingsMap: SystemSettings = { ...defaultSettings };
        
        if (Array.isArray(response.data)) {
          // If the API returns an array of settings
          response.data.forEach((setting: any) => {
            if (setting.key && setting.value !== undefined) {
              // Try to parse JSON values
              try {
                settingsMap[setting.key] = JSON.parse(setting.value);
              } catch (e) {
                // If not JSON, use the raw value
                settingsMap[setting.key] = setting.value;
              }
            }
          });
        } else if (typeof response.data === 'object') {
          // If the API returns an object with settings
          settingsMap = { ...defaultSettings, ...response.data };
        }
        
        setSettings(settingsMap);
        
        // Initialize client-side settings for utilities
        initializeClientSettings(settingsMap);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);
  
  // Update a specific setting
  const updateSetting = async (key: keyof SystemSettings, value: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await api.updateSetting(key.toString(), value);
      
      if (response.success) {
        setSettings(prev => ({
          ...prev,
          [key]: value
        }));
        return true;
      } else {
        setError(response.message || 'Failed to update setting');
        return false;
      }
    } catch (err) {
      console.error(`Error updating setting "${key}":`, err);
      setError('Failed to update setting');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        error,
        updateSetting,
        reloadSettings: loadSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
