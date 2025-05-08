import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { ApiClient } from '@/core/api/ApiClient';

const api = new ApiClient();

/**
 * Hook for managing N8N triggers
 */
export const useTriggers = () => {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  /**
   * Fetch all triggers
   */
  const fetchTriggers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/n8n/triggers');
      
      if (response.success && response.data) {
        setTriggers(response.data);
      } else {
        setError(response.message || 'Failed to fetch triggers');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch triggers';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new trigger
   */
  const createTrigger = useCallback(async (trigger: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/n8n/triggers', trigger);
      
      if (response.success && response.data) {
        setTriggers(prev => [...prev, response.data]);
        addNotification({
          title: 'Trigger Created',
          message: `Successfully created trigger: ${trigger.name}`,
          type: 'success'
        });
        return response.data;
      } else {
        setError(response.message || 'Failed to create trigger');
        addNotification({
          title: 'Failed to Create Trigger',
          message: response.message || 'An error occurred while creating the trigger',
          type: 'error'
        });
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create trigger';
      setError(message);
      addNotification({
        title: 'Failed to Create Trigger',
        message,
        type: 'error'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Update an existing trigger
   */
  const updateTrigger = useCallback(async (id: number, trigger: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.put(`/api/n8n/triggers/${id}`, trigger);
      
      if (response.success && response.data) {
        setTriggers(prev => prev.map(t => t.id === id ? response.data : t));
        addNotification({
          title: 'Trigger Updated',
          message: `Successfully updated trigger: ${trigger.name}`,
          type: 'success'
        });
        return response.data;
      } else {
        setError(response.message || 'Failed to update trigger');
        addNotification({
          title: 'Failed to Update Trigger',
          message: response.message || 'An error occurred while updating the trigger',
          type: 'error'
        });
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update trigger';
      setError(message);
      addNotification({
        title: 'Failed to Update Trigger',
        message,
        type: 'error'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Delete a trigger
   */
  const deleteTrigger = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.delete(`/api/n8n/triggers/${id}`);
      
      if (response.success) {
        setTriggers(prev => prev.filter(t => t.id !== id));
        addNotification({
          title: 'Trigger Deleted',
          message: 'Successfully deleted trigger',
          type: 'success'
        });
        return true;
      } else {
        setError(response.message || 'Failed to delete trigger');
        addNotification({
          title: 'Failed to Delete Trigger',
          message: response.message || 'An error occurred while deleting the trigger',
          type: 'error'
        });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete trigger';
      setError(message);
      addNotification({
        title: 'Failed to Delete Trigger',
        message,
        type: 'error'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Load triggers on mount
   */
  useEffect(() => {
    fetchTriggers();
  }, [fetchTriggers]);

  return {
    triggers,
    loading,
    error,
    fetchTriggers,
    createTrigger,
    updateTrigger,
    deleteTrigger
  };
};
