import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { ApiClient } from '@/core/api/ApiClient';

const api = new ApiClient();

/**
 * Hook for managing N8N API endpoints
 */
export const useApiEndpoints = () => {
  const [apiEndpoints, setApiEndpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  /**
   * Fetch all API endpoints
   */
  const fetchApiEndpoints = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/n8n/api-endpoints');
      
      if (response.success && response.data) {
        setApiEndpoints(response.data);
      } else {
        setError(response.message || 'Failed to fetch API endpoints');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch API endpoints';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Discover API endpoints from route files
   */
  const discoverApiEndpoints = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/n8n/api-endpoints/discover');
      
      if (response.success && response.data) {
        setApiEndpoints(response.data);
        addNotification({
          title: 'API Endpoints Discovered',
          message: `Successfully discovered ${response.data.length} API endpoints`,
          type: 'success'
        });
        return response.data;
      } else {
        setError(response.message || 'Failed to discover API endpoints');
        addNotification({
          title: 'Failed to Discover API Endpoints',
          message: response.message || 'An error occurred while discovering API endpoints',
          type: 'error'
        });
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to discover API endpoints';
      setError(message);
      addNotification({
        title: 'Failed to Discover API Endpoints',
        message,
        type: 'error'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Register a new API endpoint
   */
  const registerApiEndpoint = useCallback(async (endpoint: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/n8n/api-endpoints', endpoint);
      
      if (response.success && response.data) {
        setApiEndpoints(prev => [...prev, response.data]);
        addNotification({
          title: 'API Endpoint Registered',
          message: `Successfully registered API endpoint: ${endpoint.path}`,
          type: 'success'
        });
        return response.data;
      } else {
        setError(response.message || 'Failed to register API endpoint');
        addNotification({
          title: 'Failed to Register API Endpoint',
          message: response.message || 'An error occurred while registering the API endpoint',
          type: 'error'
        });
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register API endpoint';
      setError(message);
      addNotification({
        title: 'Failed to Register API Endpoint',
        message,
        type: 'error'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Update an existing API endpoint
   */
  const updateApiEndpoint = useCallback(async (id: number, endpoint: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.put(`/api/n8n/api-endpoints/${id}`, endpoint);
      
      if (response.success && response.data) {
        setApiEndpoints(prev => prev.map(e => e.id === id ? response.data : e));
        addNotification({
          title: 'API Endpoint Updated',
          message: `Successfully updated API endpoint: ${endpoint.path}`,
          type: 'success'
        });
        return response.data;
      } else {
        setError(response.message || 'Failed to update API endpoint');
        addNotification({
          title: 'Failed to Update API Endpoint',
          message: response.message || 'An error occurred while updating the API endpoint',
          type: 'error'
        });
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update API endpoint';
      setError(message);
      addNotification({
        title: 'Failed to Update API Endpoint',
        message,
        type: 'error'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Delete an API endpoint
   */
  const deleteApiEndpoint = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.delete(`/api/n8n/api-endpoints/${id}`);
      
      if (response.success) {
        setApiEndpoints(prev => prev.filter(e => e.id !== id));
        addNotification({
          title: 'API Endpoint Deleted',
          message: 'Successfully deleted API endpoint',
          type: 'success'
        });
        return true;
      } else {
        setError(response.message || 'Failed to delete API endpoint');
        addNotification({
          title: 'Failed to Delete API Endpoint',
          message: response.message || 'An error occurred while deleting the API endpoint',
          type: 'error'
        });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete API endpoint';
      setError(message);
      addNotification({
        title: 'Failed to Delete API Endpoint',
        message,
        type: 'error'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Load API endpoints on mount
   */
  useEffect(() => {
    fetchApiEndpoints();
  }, [fetchApiEndpoints]);

  return {
    apiEndpoints,
    loading,
    error,
    fetchApiEndpoints,
    discoverApiEndpoints,
    registerApiEndpoint,
    updateApiEndpoint,
    deleteApiEndpoint
  };
};
