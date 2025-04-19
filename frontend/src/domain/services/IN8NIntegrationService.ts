/**
 * Service interface for N8N integration
 */
export interface IN8NIntegrationService {
  /**
   * Trigger a workflow in N8N
   * 
   * @param requestId - ID of the request to process
   * @param workflowName - Name of the workflow to trigger
   * @param data - Additional data to send
   * @returns Execution information
   */
  triggerWorkflow(
    requestId: number,
    workflowName: string,
    data?: any
  ): Promise<{ executionId: string; success: boolean }>;
  
  /**
   * Trigger a workflow via webhook
   * 
   * @param requestId - ID of the request to process
   * @param webhookUrl - URL of the webhook
   * @param data - Additional data to send
   * @returns Response information
   */
  triggerWebhookWorkflow(
    requestId: number,
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
   * Handle workflow process start notification
   * 
   * @param requestId - ID of the request
   * @param workflowId - ID of the workflow
   * @param executionId - ID of the execution
   * @param payload - Additional data
   * @returns Processing result
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
   * @param requestId - ID of the request
   * @param executionId - ID of the execution
   * @param payload - Update data
   * @returns Processing result
   */
  handleProcessUpdate(
    requestId: number, 
    executionId: string,
    payload: any
  ): Promise<any>;
  
  /**
   * Handle workflow process completion notification
   * 
   * @param requestId - ID of the request
   * @param executionId - ID of the execution
   * @param payload - Completion data
   * @returns Processing result
   */
  handleProcessComplete(
    requestId: number, 
    executionId: string,
    payload: any
  ): Promise<any>;
  
  /**
   * Handle workflow process error notification
   * 
   * @param requestId - ID of the request
   * @param executionId - ID of the execution
   * @param payload - Error data
   * @returns Processing result
   */
  handleProcessError(
    requestId: number, 
    executionId: string,
    payload: any
  ): Promise<any>;
}