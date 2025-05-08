import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { ApiClient } from '@/core/api/ApiClient';

const api = new ApiClient();

interface N8NSettings {
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
}

/**
 * Hook for managing N8N integration settings
 */
export const useN8NSettings = () => {
  const [settings, setSettings] = useState<N8NSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  /**
   * Fetch N8N settings
   */
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/n8n/settings');
      
      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        setError(response.message || 'Failed to fetch N8N settings');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch N8N settings';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update N8N settings
   */
  const updateSettings = useCallback(async (newSettings: Partial<N8NSettings>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.put('/api/n8n/settings', newSettings);
      
      if (response.success && response.data) {
        setSettings(response.data);
        addNotification({
          title: 'Settings Updated',
          message: 'Successfully updated N8N settings',
          type: 'success'
        });
        return response.data;
      } else {
        setError(response.message || 'Failed to update N8N settings');
        addNotification({
          title: 'Failed to Update Settings',
          message: response.message || 'An error occurred while updating the settings',
          type: 'error'
        });
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update N8N settings';
      setError(message);
      addNotification({
        title: 'Failed to Update Settings',
        message,
        type: 'error'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Test N8N connection
   */
  const testConnection = useCallback(async (customSettings?: Partial<N8NSettings>) => {
    setLoading(true);
    setError(null);

    try {
      const payload = customSettings || {};
      const response = await api.post('/api/n8n/test-connection', payload);
      
      if (response.success) {
        addNotification({
          title: 'Connection Successful',
          message: 'Successfully connected to N8N server',
          type: 'success'
        });
        return true;
      } else {
        setError(response.message || 'Failed to connect to N8N server');
        addNotification({
          title: 'Connection Failed',
          message: response.message || 'Failed to connect to N8N server',
          type: 'error'
        });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect to N8N server';
      setError(message);
      addNotification({
        title: 'Connection Failed',
        message,
        type: 'error'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Load settings on mount
   */
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    testConnection
  };
};
