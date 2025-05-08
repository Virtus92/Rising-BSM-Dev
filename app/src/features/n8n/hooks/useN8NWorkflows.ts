import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { ApiClient } from '@/core/api/ApiClient';

const api = new ApiClient();

/**
 * Hook for managing N8N workflows
 */
export const useN8NWorkflows = () => {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  /**
   * Fetch available workflows from N8N
   */
  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/n8n/workflows');
      
      if (response.success && response.data) {
        setWorkflows(response.data);
      } else {
        setError(response.message || 'Failed to fetch workflows');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch workflows';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get details for a specific workflow
   */
  const getWorkflowDetails = useCallback(async (workflowId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/n8n/workflows/${workflowId}`);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.message || 'Failed to fetch workflow details');
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch workflow details';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load workflows on mount
   */
  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    workflows,
    loading,
    error,
    fetchWorkflows,
    getWorkflowDetails
  };
};
