import { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@/core/api/ApiClient';
import { useToast } from '@/shared/hooks/useToast';

// Types for N8N API responses
export interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface N8NWebhook {
  id: string;
  name: string;
  webhookPath: string;
  workflowId: string;
  httpMethod: string;
}

export interface N8NExecutionStatus {
  id: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  workflowId: string;
  startedAt: string;
  finishedAt?: string;
  data?: any;
}

/**
 * Hook for interacting with N8N workflows
 * 
 * @returns N8N workflows and methods to interact with them
 */
export function useN8NWorkflows() {
  const [workflows, setWorkflows] = useState<N8NWorkflow[]>([]);
  const [webhooks, setWebhooks] = useState<N8NWebhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<N8NExecutionStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Fetch all workflows
  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiClient.get('/api/n8n/workflows');
      
      if (response.success) {
        setWorkflows(response.data);
        
        // If the response includes webhooks, set them
        if (response.data?.webhooks) {
        setWebhooks(response.data.webhooks);
        }
      } else {
        setError(response.message || 'Failed to fetch workflows');
        toast({
          title: 'Error',
          description: 'Failed to fetch N8N workflows',
          variant: 'error'
        });
      }
    } catch (err) {
      setError('Failed to fetch workflows');
      toast({
        title: 'Error',
        description: 'Failed to connect to N8N',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Trigger a workflow
  const triggerWorkflow = useCallback(async (workflowId: string, payload: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear any existing polling interval
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      
      // Reset current execution
      setCurrentExecutionId(null);
      setExecutionStatus(null);
      
      const response = await ApiClient.post('/api/n8n/trigger-workflow', {
        workflowId,
        payload
      });
      
      if (response.success && response.data?.executionId) {
        setCurrentExecutionId(response.data.executionId);
        
        // Start polling for execution status
        const interval = setInterval(() => {
          checkExecutionStatus(response.data.executionId);
        }, 2000); // Check every 2 seconds
        
        setPollingInterval(interval);
        
        toast({
          title: 'Workflow Triggered',
          description: 'Workflow execution started',
          variant: 'success'
        });
        
        return {
          success: true,
          executionId: response.data.executionId
        };
      } else {
        setError(response.message || 'Failed to trigger workflow');
        toast({
          title: 'Error',
          description: 'Failed to trigger workflow',
          variant: 'error'
        });
        
        return {
          success: false,
          error: response.message
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger workflow';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'error'
      });
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [pollingInterval, toast]);

  // Check execution status
  const checkExecutionStatus = useCallback(async (executionId: string) => {
    try {
      const response = await ApiClient.get(`/api/n8n/workflow-status/${executionId}`);
      
      if (response.success) {
        setExecutionStatus(response.data);
        
        // If execution is complete (success or error), stop polling
        if (['success', 'error'].includes(response.data.status)) {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          
          // Show toast based on status
          toast({
            title: response.data.status === 'success' ? 'Workflow Completed' : 'Workflow Failed',
            description: response.data.status === 'success' 
              ? 'Workflow executed successfully' 
              : 'Workflow execution failed',
            variant: response.data.status === 'success' ? 'success' : 'error'
          });
        }
        
        return response.data;
      } else {
        console.error('Failed to check execution status:', response.message);
        return null;
      }
    } catch (err) {
      console.error('Error checking execution status:', err);
      return null;
    }
  }, [pollingInterval, toast]);

  // Clear current execution
  const clearExecution = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    setCurrentExecutionId(null);
    setExecutionStatus(null);
  }, [pollingInterval]);

  // Fetch workflows on component mount
  useEffect(() => {
    fetchWorkflows();
    
    return () => {
      // Clean up polling interval on unmount
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [fetchWorkflows, pollingInterval]);

  return {
    workflows,
    webhooks,
    currentExecutionId,
    executionStatus,
    loading,
    error,
    fetchWorkflows,
    triggerWorkflow,
    checkExecutionStatus,
    clearExecution,
    setCurrentExecutionId
  };
}
