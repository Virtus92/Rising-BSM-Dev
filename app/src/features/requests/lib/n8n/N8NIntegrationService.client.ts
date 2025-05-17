'use client';
/**
 * Client-side N8N Integration Service Implementation
 */
import { IN8NIntegrationService } from '@/domain/services/IN8NIntegrationService';
import { getLogger } from '@/core/logging';

const logger = getLogger();

/**
 * Client-side N8NIntegrationService implementation
 * This service uses API endpoints for N8N integration operations
 */
export class N8NIntegrationService implements IN8NIntegrationService {
  /**
   * Trigger a workflow
   */
  async triggerWorkflow(
    requestId: number,
    workflowName: string,
    data?: any
  ): Promise<{ executionId: string; success: boolean }> {
    try {
      const payload = {
        workflowId: workflowName,
        data: data || {},
        requestId
      };
      
      const response = await fetch('/api/n8n/trigger-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Error triggering workflow:', errorText);
        return {
          success: false,
          executionId: '',
        };
      }
      
      const result = await response.json();
      
      if (!result.success || !result.data?.executionId) {
        throw new Error(result.message || 'Failed to trigger workflow');
      }
      
      return {
        success: true,
        executionId: result.data.executionId
      };
    } catch (error) {
      logger.error('Error in N8NIntegrationService.triggerWorkflow:', error as Error);
      logger.error('Error in N8NIntegrationService.triggerWorkflow:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Get workflow status
   */
  async getWorkflowStatus(
    executionId: string
  ): Promise<{ success: boolean; status?: string; data?: any; error?: string }> {
    try {
      const response = await fetch(`/api/n8n/workflow-status/${executionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Error getting workflow status:', errorText);
        return {
          success: false,
          error: `Failed to get workflow status: ${errorText}`
        };
      }
      
      const result = await response.json();
      
      return {
        success: result.success,
        status: result.data?.status,
        data: result.data,
        error: result.message
      };
    } catch (error) {
      logger.error('Error in N8NIntegrationService.getWorkflowStatus:', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get available workflows
   */
  async getAvailableWorkflows(): Promise<{ id: string; name: string; description?: string }[]> {
    try {
      const response = await fetch('/api/n8n/workflows', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error('Error getting available workflows:', await response.text());
        return [];
      }
      
      const result = await response.json();
      
      return result.data || [];
    } catch (error) {
      logger.error('Error in N8NIntegrationService.getAvailableWorkflows:', error as Error);
      return [];
    }
  }
  
  /**
   * Associate workflow with request
   */
  async associateWorkflowWithRequest(
    requestId: number,
    workflowId: string,
    executionId: string
  ): Promise<boolean> {
    try {
      const payload = {
        requestId,
        workflowId,
        executionId
      };
      
      const response = await fetch(`/api/requests/${requestId}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error('Error associating workflow with request:', await response.text());
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Error in N8NIntegrationService.associateWorkflowWithRequest:', error as Error);
      return false;
    }
  }
  
  /**
   * Get request workflow executions
   */
  async getRequestWorkflowExecutions(
    requestId: number
  ): Promise<{ executionId: string; workflowId: string; status: string; createdAt: string }[]> {
    try {
      const response = await fetch(`/api/requests/${requestId}/workflows`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error('Error getting request workflow executions:', await response.text());
        return [];
      }
      
      const result = await response.json();
      
      return result.data || [];
    } catch (error) {
      logger.error('Error in N8NIntegrationService.getRequestWorkflowExecutions:', error as Error);
      return [];
    }
  }
  
  /**
   * Test N8N connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/n8n/test-connection', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Error testing N8N connection:', errorText);
        return {
          success: false,
          message: `Connection test failed: ${errorText}`
        };
      }
      
      const result = await response.json();
      
      return {
        success: result.success,
        message: result.message || 'Connection successful'
      };
    } catch (error) {
      logger.error('Error in N8NIntegrationService.testConnection:', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Update request data from workflow
   */
  async updateRequestDataFromWorkflow(
    requestId: number,
    executionId: string,
    data: Record<string, any>
  ): Promise<boolean> {
    try {
      const payload = {
        executionId,
        data
      };
      
      const response = await fetch(`/api/requests/${requestId}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error('Error updating request data from workflow:', await response.text());
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Error in N8NIntegrationService.updateRequestDataFromWorkflow:', error as Error);
      return false;
    }
  }
  
  /**
   * Trigger a workflow via webhook
   */
  async triggerWebhookWorkflow(
    requestId: number,
    webhookUrl: string,
    data?: any
  ): Promise<{ success: boolean; response: any }> {
    try {
      const payload = {
        requestId,
        data: data || {},
      };
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }
      
      return {
        success: response.ok,
        response: responseData
      };
    } catch (error) {
      logger.error('Error in N8NIntegrationService.triggerWebhookWorkflow:', error as Error);
      throw error;
    }
  }
  
  /**
   * Get list of saved webhook configurations
   */
  async getSavedWebhooks(): Promise<any[]> {
    try {
      const response = await fetch('/api/n8n/webhooks', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error('Error getting saved webhooks:', await response.text());
        return [];
      }
      
      const result = await response.json();
      
      return result.data || [];
    } catch (error) {
      logger.error('Error in N8NIntegrationService.getSavedWebhooks:', error as Error);
      return [];
    }
  }
  
  /**
   * Handle workflow process start notification
   */
  async handleProcessStart(
    requestId: number,
    workflowId: string,
    executionId: string,
    payload: any
  ): Promise<any> {
    try {
      const response = await fetch(`/api/requests/${requestId}/workflow/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          executionId,
          payload
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error('Error handling process start:', await response.text());
        return { success: false };
      }
      
      const result = await response.json();
      return result.data || { success: true };
    } catch (error) {
      logger.error('Error in N8NIntegrationService.handleProcessStart:', error as Error);
      return { success: false, error: String(error) };
    }
  }
  
  /**
   * Handle workflow process update notification
   */
  async handleProcessUpdate(
    requestId: number, 
    executionId: string,
    payload: any
  ): Promise<any> {
    try {
      const response = await fetch(`/api/requests/${requestId}/workflow/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionId,
          payload
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error('Error handling process update:', await response.text());
        return { success: false };
      }
      
      const result = await response.json();
      return result.data || { success: true };
    } catch (error) {
      logger.error('Error in N8NIntegrationService.handleProcessUpdate:', error as Error);
      return { success: false, error: String(error) };
    }
  }
  
  /**
   * Handle workflow process completion notification
   */
  async handleProcessComplete(
    requestId: number, 
    executionId: string,
    payload: any
  ): Promise<any> {
    try {
      const response = await fetch(`/api/requests/${requestId}/workflow/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionId,
          payload
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error('Error handling process completion:', await response.text());
        return { success: false };
      }
      
      const result = await response.json();
      return result.data || { success: true };
    } catch (error) {
      logger.error('Error in N8NIntegrationService.handleProcessComplete:', error as Error);
      return { success: false, error: String(error) };
    }
  }
  
  /**
   * Handle workflow process error notification
   */
  async handleProcessError(
    requestId: number, 
    executionId: string,
    payload: any
  ): Promise<any> {
    try {
      const response = await fetch(`/api/requests/${requestId}/workflow/error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionId,
          payload
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error('Error handling process error:', await response.text());
        return { success: false };
      }
      
      const result = await response.json();
      return result.data || { success: true };
    } catch (error) {
      logger.error('Error in N8NIntegrationService.handleProcessError:', error as Error);
      return { success: false, error: String(error) };
    }
  }
}