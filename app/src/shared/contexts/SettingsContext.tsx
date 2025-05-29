'use client';

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { SettingsClient, SystemSettings as SystemSettingsType } from '@/features/settings/lib/clients/SettingsClient';
import { initializeClientSettings } from '@/features/settings/lib/utils/SettingsHelper';
import { useToast } from '@/shared/hooks/useToast';
import { getItem, setItem } from '@/shared/utils/storage/cookieStorage';

export interface SystemSettings extends SystemSettingsType {}

interface SettingsContextType {
  settings: SystemSettings;
  isLoading: boolean;
  error: string | null;
  updateSetting: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => Promise<boolean>;
  reloadSettings: () => Promise<void>;
  resetToDefaults: () => Promise<boolean>;
}

// Default settings for fallbacks and initialization
const defaultSettings: SystemSettings = {
  companyName: 'RISING BSM',
  dateFormat: 'dd.MM.yyyy',
  timeFormat: 'HH:mm',
  currency: 'EUR',
  language: 'de',
  theme: 'system',
  notificationsEnabled: true,
  emailNotifications: true,
  version: '1.0.0',
};

// Create context with default values
const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: false,
  error: null,
  updateSetting: async () => false,
  reloadSettings: async () => {},
  resetToDefaults: async () => false
});

/**
 * Hook to access the settings context
 */
export const useSettings = () => useContext(SettingsContext);

interface SettingsProviderProps {
  children: ReactNode;
}

/**
 * Provider component for system settings
 */
export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  /**
   * Load settings from API
   */
  const loadSettings = useCallback(async () => {
    // Verhindere mehrfache gleichzeitige Ladeanfragen
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await SettingsClient.getSettings();
      
      if (response.success && response.data) {
        // Transform the settings array/object into a key-value map
        let settingsMap: SystemSettings = { ...defaultSettings };
        
        if (Array.isArray(response.data)) {
          // If the API returns an array of settings
          response.data.forEach((setting: any) => {
            if (setting.key && setting.value !== undefined) {
              // Try to parse JSON values
              try {
                settingsMap[setting.key as keyof SystemSettings] = JSON.parse(setting.value);
              } catch (e) {
                // If not JSON, use the raw value
                settingsMap[setting.key as keyof SystemSettings] = setting.value;
              }
            }
          });
        } else if (typeof response.data === 'object') {
          // If the API returns an object with settings
          settingsMap = { ...defaultSettings, ...response.data };
        }
        
        setSettings(settingsMap);
        
        // Cache settings in localStorage to reduce API calls
        try {
          setItem('app_settings', JSON.stringify({
            data: settingsMap,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error('Failed to cache settings:', e);
        }
        
        // Initialize client-side settings for utilities
        initializeClientSettings(settingsMap);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
      
      // Nur einen Toast anzeigen, wenn es sich um einen signifikanten Fehler handelt
      if (!(err instanceof Error && err.message.includes('Authentication'))) {
        toast({
          title: 'Fehler',
          description: 'Die Einstellungen konnten nicht geladen werden.',
          variant: 'error',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast, isLoading]);
  
  // Load settings on component mount
  useEffect(() => {
    // Versuche zuerst, die Einstellungen aus dem LocalStorage zu laden
    try {
      const cachedSettings = getItem('app_settings');
      if (cachedSettings) {
        const { data, timestamp } = JSON.parse(cachedSettings);
        // Prüfe, ob die Einstellungen nicht älter als 1 Stunde sind
        if (data && timestamp && Date.now() - timestamp < 3600000) {
          setSettings(data);
          initializeClientSettings(data);
          // Nach 100ms die Einstellungen trotzdem im Hintergrund laden,
          // um sicherzustellen, dass wir die neuesten Einstellungen haben
          setTimeout(() => loadSettings(), 100);
          return;
        }
      }
    } catch (e) {
      console.error('Error loading settings from localStorage:', e);
    }
    
    // Wenn keine gecachten Einstellungen verfügbar sind, lade sie von der API
    loadSettings();
    
    // Add event listener for settings changes from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'settings_updated') {
        loadSettings();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadSettings]);
  
  /**
   * Update a specific setting
   */
  const updateSetting = useCallback(async <K extends keyof SystemSettings>(
    key: K, 
    value: SystemSettings[K]
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await SettingsClient.updateSetting(key.toString(), value);
      
      if (response.success) {
        setSettings(prev => ({
          ...prev,
          [key]: value
        }));
        
        // Notify other tabs/windows
        setItem('settings_updated', Date.now().toString());
        
        toast({
          title: 'Einstellung gespeichert',
          description: 'Die Einstellung wurde erfolgreich aktualisiert.',
          variant: 'success',
        });
        
        return true;
      } else {
        setError(response.message || 'Failed to update setting');
        
        toast({
          title: 'Fehler',
          description: 'Die Einstellung konnte nicht aktualisiert werden.',
          variant: 'error',
        });
        
        return false;
      }
    } catch (err) {
      console.error(`Error updating setting "${key}":`, err);
      setError('Failed to update setting');
      
      toast({
        title: 'Fehler',
        description: 'Die Einstellung konnte nicht aktualisiert werden.',
        variant: 'error',
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  /**
   * Reset all settings to defaults
   */
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Implement API call to reset settings if available
      const response = await SettingsClient.resetSettings();
      
      if (response.success) {
        setSettings(defaultSettings);
        
        // Initialize client-side settings for utilities
        initializeClientSettings(defaultSettings);
        
        // Notify other tabs/windows
        setItem('settings_updated', Date.now().toString());
        
        toast({
          title: 'Einstellungen zurückgesetzt',
          description: 'Alle Einstellungen wurden auf die Standardwerte zurückgesetzt.',
          variant: 'success',
        });
        
        return true;
      } else {
        setError(response.message || 'Failed to reset settings');
        
        toast({
          title: 'Fehler',
          description: 'Die Einstellungen konnten nicht zurückgesetzt werden.',
          variant: 'error',
        });
        
        return false;
      }
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError('Failed to reset settings');
      
      toast({
        title: 'Fehler',
        description: 'Die Einstellungen konnten nicht zurückgesetzt werden.',
        variant: 'error',
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    settings,
    isLoading,
    error,
    updateSetting,
    reloadSettings: loadSettings,
    resetToDefaults
  }), [settings, isLoading, error, updateSetting, loadSettings, resetToDefaults]);
  
  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
