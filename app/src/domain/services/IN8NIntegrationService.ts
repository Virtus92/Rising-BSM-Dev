/**
 * Service interface for N8N integration
 */
export interface IN8NIntegrationService {
  /**
   * Trigger a workflow in N8N
   * 
   * @param requestId - ID of the request to process (optional)
   * @param workflowName - Name of the workflow to trigger
   * @param data - Data to send to the workflow
   * @returns Execution information
   */
  triggerWorkflow(
    requestId: number,
    workflowName: string,
    data?: any
  ): Promise<{ executionId: string; success: boolean }>;
  
  /**
   * Trigger a workflow in N8N by name only
   * 
   * @param workflowName - Name of the workflow to trigger
   * @param data - Data to send to the workflow
   * @returns Execution information
   */
  triggerWorkflowByName(
    workflowName: string,
    data?: any
  ): Promise<{ executionId: string; success: boolean }>;
  
  /**
   * Handle workflow process start notification
   * 
   * @param requestId - ID of the request being processed
   * @param workflowId - ID of the workflow
   * @param executionId - ID of the execution
   * @param payload - Additional data from the workflow
   * @returns Process result
   */
  handleProcessStart(
    requestId: number,
    workflowId: string,
    executionId: string,
    payload: any
  ): Promise<any>;
  
  /**
   * Handle workflow process update notification
   * 
   * @param requestId - ID of the request being processed
   * @param executionId - ID of the execution
   * @param payload - Update data from the workflow
   * @returns Process result
   */
  handleProcessUpdate(
    requestId: number, 
    executionId: string,
    payload: any
  ): Promise<any>;
  
  /**
   * Handle workflow process completion notification
   * 
   * @param requestId - ID of the request being processed
   * @param executionId - ID of the execution
   * @param payload - Completion data from the workflow
   * @returns Process result
   */
  handleProcessComplete(
    requestId: number, 
    executionId: string,
    payload: any
  ): Promise<any>;
  
  /**
   * Handle workflow process error notification
   * 
   * @param requestId - ID of the request being processed
   * @param executionId - ID of the execution
   * @param payload - Error data from the workflow
   * @returns Process result
   */
  handleProcessError(
    requestId: number, 
    executionId: string,
    payload: any
  ): Promise<any>;
  
  /**
   * Trigger a workflow via webhook
   * 
   * @param webhookUrl - URL of the webhook
   * @param data - Data to send
   * @returns Response information
   */
  triggerWebhookWorkflow(
    webhookUrl: string,
    data?: any
  ): Promise<{ success: boolean; response: any }>;
  
  /**
   * Get the status of a workflow execution
   * 
   * @param executionId - ID of the execution
   * @returns Status information
   */
  getWorkflowStatus(executionId: string): Promise<any>;
  
  /**
   * Get list of available workflows from N8N
   * 
   * @returns List of workflows
   */
  getAvailableWorkflows(): Promise<any[]>;
  
  /**
   * Get list of saved webhook configurations
   * 
   * @returns List of webhooks
   */
  getSavedWebhooks(): Promise<any[]>;
  
  /**
   * Get list of registered API endpoints
   * 
   * @returns List of API endpoints
   */
  getApiEndpoints(): Promise<any[]>;
  
  /**
   * Get list of registered triggers
   * 
   * @returns List of triggers
   */
  getTriggers(): Promise<any[]>;
  
  /**
   * Register a new webhook
   * 
   * @param webhook - Webhook configuration
   * @returns Created webhook
   */
  registerWebhook(webhook: any): Promise<any>;
  
  /**
   * Update an existing webhook
   * 
   * @param id - ID of the webhook
   * @param webhook - Updated webhook configuration
   * @returns Updated webhook
   */
  updateWebhook(id: number, webhook: any): Promise<any>;
  
  /**
   * Delete a webhook
   * 
   * @param id - ID of the webhook
   * @returns Result of the operation
   */
  deleteWebhook(id: number): Promise<{ success: boolean }>;
  
  /**
   * Register an API endpoint
   * 
   * @param endpoint - API endpoint configuration
   * @returns Created API endpoint
   */
  registerApiEndpoint(endpoint: any): Promise<any>;
  
  /**
   * Register a trigger
   * 
   * @param trigger - Trigger configuration
   * @returns Created trigger
   */
  registerTrigger(trigger: any): Promise<any>;
  
  /**
   * Get execution history
   * 
   * @param filters - Optional filters
   * @returns List of executions
   */
  getExecutionHistory(filters?: any): Promise<any[]>;
  
  /**
   * Handle webhook notification from N8N
   * 
   * @param action - Action type
   * @param executionId - Execution ID
   * @param payload - Notification payload
   * @returns Processing result
   */
  handleWebhookNotification(
    action: string,
    executionId: string,
    payload: any
  ): Promise<any>;
}