import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { ApiClient } from '@/core/api/ApiClient';

const api = new ApiClient();

/**
 * Hook for managing N8N workflow executions
 */
export const useExecutions = () => {
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  /**
   * Fetch execution history with optional filters
   */
  const fetchExecutions = useCallback(async (filters: Record<string, any> = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/n8n/executions', { params: filters });
      
      if (response.success && response.data) {
        setExecutions(response.data);
      } else {
        setError(response.message || 'Failed to fetch executions');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch executions';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get execution details by ID
   */
  const getExecutionDetails = useCallback(async (executionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/n8n/workflow-status/${executionId}`);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.message || 'Failed to fetch execution details');
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch execution details';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Trigger a workflow execution
   */
  const triggerWorkflow = useCallback(async (
    requestId: number,
    workflowName: string, 
    data: any = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/n8n/trigger-workflow', {
        requestId,
        workflowName,
        data
      });
      
      if (response.success && response.data) {
        // Refresh the execution list after triggering
        fetchExecutions();
        
        addNotification({
          title: 'Workflow Triggered',
          message: `Successfully triggered workflow: ${workflowName}`,
          type: 'success'
        });
        return response.data;
      } else {
        setError(response.message || 'Failed to trigger workflow');
        addNotification({
          title: 'Failed to Trigger Workflow',
          message: response.message || 'An error occurred while triggering the workflow',
          type: 'error'
        });
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to trigger workflow';
      setError(message);
      addNotification({
        title: 'Failed to Trigger Workflow',
        message,
        type: 'error'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [addNotification, fetchExecutions]);

  /**
   * Trigger a webhook
   */
  const triggerWebhook = useCallback(async (webhookUrl: string, data: any = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/n8n/webhook/trigger', {
        webhookUrl,
        data
      });
      
      if (response.success && response.data) {
        addNotification({
          title: 'Webhook Triggered',
          message: 'Successfully triggered webhook',
          type: 'success'
        });
        return response.data;
      } else {
        setError(response.message || 'Failed to trigger webhook');
        addNotification({
          title: 'Failed to Trigger Webhook',
          message: response.message || 'An error occurred while triggering the webhook',
          type: 'error'
        });
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to trigger webhook';
      setError(message);
      addNotification({
        title: 'Failed to Trigger Webhook',
        message,
        type: 'error'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Load executions on mount
   */
  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  return {
    executions,
    loading,
    error,
    fetchExecutions,
    getExecutionDetails,
    triggerWorkflow,
    triggerWebhook
  };
};
