import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { ApiClient } from '@/core/api/ApiClient';

const api = new ApiClient();

/**
 * Hook for managing N8N webhooks
 */
export const useWebhooks = () => {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  /**
   * Fetch all webhooks
   */
  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/n8n/webhooks');
      
      if (response.success && response.data) {
        setWebhooks(response.data);
      } else {
        setError(response.message || 'Failed to fetch webhooks');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch webhooks';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new webhook
   */
  const createWebhook = useCallback(async (webhook: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/n8n/webhooks', webhook);
      
      if (response.success && response.data) {
        setWebhooks(prev => [...prev, response.data]);
        addNotification({
          title: 'Webhook Created',
          message: `Successfully created webhook: ${webhook.name}`,
          type: 'success'
        });
        return response.data;
      } else {
        setError(response.message || 'Failed to create webhook');
        addNotification({
          title: 'Failed to Create Webhook',
          message: response.message || 'An error occurred while creating the webhook',
          type: 'error'
        });
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create webhook';
      setError(message);
      addNotification({
        title: 'Failed to Create Webhook',
        message,
        type: 'error'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Update an existing webhook
   */
  const updateWebhook = useCallback(async (id: number, webhook: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.put(`/api/n8n/webhooks/${id}`, webhook);
      
      if (response.success && response.data) {
        setWebhooks(prev => prev.map(w => w.id === id ? response.data : w));
        addNotification({
          title: 'Webhook Updated',
          message: `Successfully updated webhook: ${webhook.name}`,
          type: 'success'
        });
        return response.data;
      } else {
        setError(response.message || 'Failed to update webhook');
        addNotification({
          title: 'Failed to Update Webhook',
          message: response.message || 'An error occurred while updating the webhook',
          type: 'error'
        });
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update webhook';
      setError(message);
      addNotification({
        title: 'Failed to Update Webhook',
        message,
        type: 'error'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Delete a webhook
   */
  const deleteWebhook = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.delete(`/api/n8n/webhooks/${id}`);
      
      if (response.success) {
        setWebhooks(prev => prev.filter(w => w.id !== id));
        addNotification({
          title: 'Webhook Deleted',
          message: 'Successfully deleted webhook',
          type: 'success'
        });
        return true;
      } else {
        setError(response.message || 'Failed to delete webhook');
        addNotification({
          title: 'Failed to Delete Webhook',
          message: response.message || 'An error occurred while deleting the webhook',
          type: 'error'
        });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete webhook';
      setError(message);
      addNotification({
        title: 'Failed to Delete Webhook',
        message,
        type: 'error'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Load webhooks on mount
   */
  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  return {
    webhooks,
    loading,
    error,
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook
  };
};
