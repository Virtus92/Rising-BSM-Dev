'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/shared/hooks/useToast';

export interface N8NWorkflow {
  id: string;
  name: string;
  description: string;
  tags: string[];
  active: boolean;
}

export interface WorkflowTriggerOptions {
  additionalData?: any;
  onComplete?: (result: any) => void;
}

export interface WorkflowStatus {
  status: string;
  progress?: number;
  currentStep?: string;
  result?: any;
  error?: any;
  success?: boolean; // Add success property
}

/**
 * Hook for interacting with N8N workflows
 * 
 * @param requestId - ID of the request to process
 * @returns Functions and state for working with N8N
 */
export const useN8NWorkflows = (requestId: number) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [workflows, setWorkflows] = useState<N8NWorkflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Fetch available workflows
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/n8n/workflows');
        const data = await response.json();
        
        if (data.success) {
          setWorkflows(data.data);
        } else {
          console.error('Failed to fetch workflows:', data.message);
        }
      } catch (error) {
        console.error('Error fetching workflows:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkflows();
  }, []);
  
  /**
   * Trigger a workflow for the current request
   * 
   * @param workflowName - Name of the workflow to trigger
   * @param options - Additional options for the workflow
   * @returns Result of the trigger operation
   */
  const triggerWorkflow = async (
    workflowName: string, 
    options: WorkflowTriggerOptions = {}
  ) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/n8n/trigger-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId,
          workflowName,
          data: options.additionalData || {}
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Workflow Triggered',
          description: `Successfully triggered workflow: ${workflowName}`,
          variant: 'success'
        });
        
        return {
          success: true,
          executionId: result.data.executionId
        };
      } else {
        toast({
          title: 'Workflow Trigger Failed',
          description: result.message || 'Failed to trigger workflow',
          variant: 'error'
        });
        
        return {
          success: false,
          message: result.message
        };
      }
    } catch (error) {
      console.error('Error triggering workflow:', error);
      toast({
        title: 'Workflow Trigger Failed',
        description: 'An unexpected error occurred',
        variant: 'error'
      });
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Get the current status of a workflow execution
   * 
   * @param executionId - ID of the execution to check
   * @returns Current status information
   */
  const getWorkflowStatus = async (executionId: string): Promise<WorkflowStatus> => {
    try {
      const response = await fetch(`/api/n8n/workflow-status/${executionId}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          status: data.data.status,
          progress: data.data.progress,
          result: data.data.result,
          success: true
        };
      } else {
        return {
          status: 'error',
          error: {
            message: data.message
          },
          success: false
        };
      }
    } catch (error) {
      console.error('Error fetching workflow status:', error);
      return {
        status: 'error',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        success: false
      };
    }
  };
  
  return {
    workflows,
    isLoading,
    isProcessing,
    triggerWorkflow,
    getWorkflowStatus
  };
};