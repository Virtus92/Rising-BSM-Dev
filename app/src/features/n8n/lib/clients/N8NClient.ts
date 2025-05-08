import { IN8NIntegrationService } from '@/domain/services/IN8NIntegrationService';
import { ApiClient } from '@/core/api/ApiClient';

/**
 * Client-side implementation of N8N Integration Service
 */
class N8NClient implements IN8NIntegrationService {

  /**
   * Trigger a workflow in N8N
   * 
   * @param requestId - ID of the request to process (optional)
   * @param workflowName - Name of the workflow to trigger
   * @param data - Data to send to the workflow
   * @returns Execution information
   */
  async triggerWorkflow(
    requestId: number,
    workflowName: string,
    data?: any
  ): Promise<{ executionId: string; success: boolean }> {
    const response = await ApiClient.post('/api/n8n/trigger-workflow', { 
      requestId,
      workflowName, 
      data 
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to trigger workflow');
  }
  
  /**
   * Trigger a workflow in N8N by name only
   * 
   * @param workflowName - Name of the workflow to trigger
   * @param data - Data to send to the workflow
   * @returns Execution information
   */
  async triggerWorkflowByName(
    workflowName: string,
    data?: any
  ): Promise<{ executionId: string; success: boolean }> {
    return this.triggerWorkflow(0, workflowName, data);
  }
  
  /**
   * Handle workflow process start notification
   * 
   * @param requestId - ID of the request being processed
   * @param workflowId - ID of the workflow
   * @param executionId - ID of the execution
   * @param payload - Additional data from the workflow
   * @returns Process result
   */
  async handleProcessStart(
    requestId: number,
    workflowId: string,
    executionId: string,
    payload: any
  ): Promise<any> {
    const response = await ApiClient.post('/api/n8n/process/start', {
      requestId,
      workflowId,
      executionId,
      payload
    });
    
    return response.data;
  }
  
  /**
   * Handle workflow process update notification
   * 
   * @param requestId - ID of the request being processed
   * @param executionId - ID of the execution
   * @param payload - Update data from the workflow
   * @returns Process result
   */
  async handleProcessUpdate(
    requestId: number, 
    executionId: string,
    payload: any
  ): Promise<any> {
    const response = await ApiClient.post('/api/n8n/process/update', {
      requestId,
      executionId,
      payload
    });
    
    return response.data;
  }
  
  /**
   * Handle workflow process completion notification
   * 
   * @param requestId - ID of the request being processed
   * @param executionId - ID of the execution
   * @param payload - Completion data from the workflow
   * @returns Process result
   */
  async handleProcessComplete(
    requestId: number, 
    executionId: string,
    payload: any
  ): Promise<any> {
    const response = await ApiClient.post('/api/n8n/process/complete', {
      requestId,
      executionId,
      payload
    });
    
    return response.data;
  }
  
  /**
   * Handle workflow process error notification
   * 
   * @param requestId - ID of the request being processed
   * @param executionId - ID of the execution
   * @param payload - Error data from the workflow
   * @returns Process result
   */
  async handleProcessError(
    requestId: number, 
    executionId: string,
    payload: any
  ): Promise<any> {
    const response = await ApiClient.post('/api/n8n/process/error', {
      requestId,
      executionId,
      payload
    });
    
    return response.data;
  }
  
  /**
   * Trigger a workflow via webhook
   * 
   * @param webhookUrl - URL of the webhook
   * @param data - Data to send
   * @returns Response information
   */
  async triggerWebhookWorkflow(
    webhookUrl: string,
    data?: any
  ): Promise<{ success: boolean; response: any }> {
    const response = await ApiClient.post('/api/n8n/webhook/trigger', {
      webhookUrl,
      data
    });
    
    return response.data;
  }
  
  /**
   * Get the status of a workflow execution
   * 
   * @param executionId - ID of the execution
   * @returns Status information
   */
  async getWorkflowStatus(executionId: string): Promise<any> {
    const response = await ApiClient.get(`/api/n8n/workflow-status/${executionId}`);
    return response.data;
  }
  
  /**
   * Get list of available workflows from N8N
   * 
   * @returns List of workflows
   */
  async getAvailableWorkflows(): Promise<any[]> {
    const response = await ApiClient.get('/api/n8n/workflows');
    return response.data || [];
  }
  
  /**
   * Get list of saved webhook configurations
   * 
   * @returns List of webhooks
   */
  async getSavedWebhooks(): Promise<any[]> {
    const response = await ApiClient.get('/api/n8n/webhooks');
    return response.data || [];
  }
  
  /**
   * Get list of registered API endpoints
   * 
   * @returns List of API endpoints
   */
  async getApiEndpoints(): Promise<any[]> {
    const response = await ApiClient.get('/api/n8n/api-endpoints');
    return response.data || [];
  }
  
  /**
   * Get list of registered triggers
   * 
   * @returns List of triggers
   */
  async getTriggers(): Promise<any[]> {
    const response = await ApiClient.get('/api/n8n/triggers');
    return response.data || [];
  }
  
  /**
   * Register a new webhook
   * 
   * @param webhook - Webhook configuration
   * @returns Created webhook
   */
  async registerWebhook(webhook: any): Promise<any> {
    const response = await ApiClient.post('/api/n8n/webhooks', webhook);
    return response.data;
  }
  
  /**
   * Update an existing webhook
   * 
   * @param id - ID of the webhook
   * @param webhook - Updated webhook configuration
   * @returns Updated webhook
   */
  async updateWebhook(id: number, webhook: any): Promise<any> {
    const response = await ApiClient.put(`/api/n8n/webhooks/${id}`, webhook);
    return response.data;
  }
  
  /**
   * Delete a webhook
   * 
   * @param id - ID of the webhook
   * @returns Result of the operation
   */
  async deleteWebhook(id: number): Promise<{ success: boolean }> {
    const response = await ApiClient.delete(`/api/n8n/webhooks/${id}`);
    return response.data || { success: false };
  }
  
  /**
   * Register an API endpoint
   * 
   * @param endpoint - API endpoint configuration
   * @returns Created API endpoint
   */
  async registerApiEndpoint(endpoint: any): Promise<any> {
    const response = await ApiClient.post('/api/n8n/api-endpoints', endpoint);
    return response.data;
  }
  
  /**
   * Register a trigger
   * 
   * @param trigger - Trigger configuration
   * @returns Created trigger
   */
  async registerTrigger(trigger: any): Promise<any> {
    const response = await ApiClient.post('/api/n8n/triggers', trigger);
    return response.data;
  }
  
  /**
   * Get execution history
   * 
   * @param filters - Optional filters
   * @returns List of executions
   */
  async getExecutionHistory(filters?: any): Promise<any[]> {
    const response = await ApiClient.get('/api/n8n/executions', { params: filters });
    return response.data || [];
  }
  
  /**
   * Handle webhook notification from N8N
   * 
   * @param action - Action type
   * @param executionId - Execution ID
   * @param payload - Notification payload
   * @returns Processing result
   */
  async handleWebhookNotification(
    action: string,
    executionId: string,
    payload: any
  ): Promise<any> {
    const response = await ApiClient.post('/api/n8n/webhooks/notification', {
      action,
      executionId,
      payload
    });
    
    return response.data;
  }
}

// Create a singleton instance
export const N8NClientService = new N8NClient();