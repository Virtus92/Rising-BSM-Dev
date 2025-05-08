import { IRequestRepository } from '@/domain/repositories/IRequestRepository';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors';
import { ConfigService } from '@/core/config';
import { IN8NIntegrationService } from '@/domain/services/IN8NIntegrationService';
import { EventTriggerService } from './EventTriggerService';
import { WebhookManagementService } from './WebhookManagementService';
import { ApiEndpointService } from './ApiEndpointService';

/**
 * Interface for request data repository operations
 * 
 * This should match the IRequestDataRepository from the domain layer
 */
import { IRequestDataRepository as IDomainRequestDataRepository } from '@/domain/repositories/IRequestDataRepository';

// Use the domain interface directly to ensure consistency
type IRequestDataRepository = IDomainRequestDataRepository;

/**
 * Enhanced service for integrating with N8N workflows
 * @implements IN8NIntegrationService
 */
export class N8NIntegrationService implements IN8NIntegrationService {
  constructor(
    protected requestRepository: IRequestRepository,
    protected requestDataRepository: IRequestDataRepository,
    protected logger: ILoggingService,
    protected errorHandler: IErrorHandler,
    protected configService: typeof ConfigService,
    protected eventTriggerService: EventTriggerService,
    protected webhookService: WebhookManagementService,
    protected apiEndpointService: ApiEndpointService
  ) {
    // Initialize event listeners
    this.registerEventListeners();
  }
  
  /**
   * Register event listeners for automatic workflow triggering
   */
  private registerEventListeners(): void {
    // Example events to listen for
    const events = [
      'request.created',
      'request.updated',
      'user.registered',
      'appointment.scheduled',
      'appointment.upcoming'
    ];
    
    for (const event of events) {
      this.eventTriggerService.on(event, async (data) => {
        await this.handleEvent(event, data);
      });
    }
  }
  
  /**
   * Handle an event and trigger appropriate workflows
   * 
   * @param eventType - Type of event
   * @param data - Event data
   */
  private async handleEvent(eventType: string, data: any): Promise<void> {
    try {
      this.logger.info(`Handling event: ${eventType}`, { data });
      
      // TODO: Implement trigger lookup and workflow execution
      // This would find triggers configured for this event type and execute their workflows
    } catch (error) {
      this.logger.error(`Error handling event: ${eventType}`, {
        error: error instanceof Error ? error.message : String(error),
        data
      });
    }
  }
  
  /**
   * Trigger a workflow by name only
   * 
   * @param workflowName - Name of the workflow to trigger
   * @param data - Data to send to the workflow
   * @returns Execution information
   */
  async triggerWorkflowByName(
    workflowName: string,
    data: any = {}
  ): Promise<{ executionId: string; success: boolean }> {
    return await this.triggerWorkflow(0, workflowName, data);
  }
  
  /**
   * Trigger a workflow in N8N using its name
   * 
   * @param workflowName - Name of the N8N workflow
   * @param data - Data to send to the workflow
   * @returns Execution information
   */
  async triggerWorkflow(
    requestId: number,
    workflowName: string,
    data: any = {}
  ): Promise<{ executionId: string; success: boolean }> {
    try {
      // Get N8N configuration
      const config = await this.getN8NConfiguration();
      
      if (!config.baseUrl || !config.apiKey) {
        throw new Error('N8N configuration is incomplete');
      }
      
      // Step 1: Find the workflow ID by name
      const searchResponse = await fetch(`${config.baseUrl}/api/v1/workflows?name=${encodeURIComponent(workflowName)}`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': config.apiKey
        }
      });
      
      if (!searchResponse.ok) {
        throw new Error(`Failed to find N8N workflow: ${searchResponse.statusText}`);
      }
      
      const searchResult = await searchResponse.json();
      
      if (!searchResult.data || searchResult.data.length === 0) {
        throw new Error(`No workflow found with name: ${workflowName}`);
      }
      
      // Get the workflow ID
      const workflowId = searchResult.data[0].id;
      
      // Prepare the payload
      const payload = {
        data: {
          ...data,
          timestamp: new Date().toISOString()
        }
      };
      
      // Step 2: Activate the workflow using its ID
      const activateResponse = await fetch(`${config.baseUrl}/api/v1/workflows/${workflowId}/activate`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!activateResponse.ok) {
        throw new Error(`Failed to activate N8N workflow: ${activateResponse.statusText}`);
      }
      
      const activateResult = await activateResponse.json();
      
      // Create execution record
      await this.createExecutionRecord({
        externalId: activateResult.executionId,
        triggerType: 'manual',
        status: 'running',
        entityType: data.entityType || (requestId > 0 ? 'request' : undefined),
        entityId: data.entityId || (requestId > 0 ? requestId : undefined),
        workflowTemplateId: null, // We don't have a template ID for direct invocation
        workflowName
      });
      
      // If this was triggered for a request, update the request metadata
      if (requestId > 0) {
        await this.updateRequestMetadata(requestId, {
          workflowStatus: 'running',
          workflowId: workflowId,
          executionId: activateResult.executionId,
          startTimestamp: new Date().toISOString()
        });
      }
      
      return {
        executionId: activateResult.executionId,
        success: true
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.triggerWorkflow`, {
        error: error instanceof Error ? error.message : String(error),
        requestId,
        workflowName,
        data
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Trigger a workflow via webhook URL directly
   * 
   * @param webhookUrl - URL of the N8N webhook
   * @param data - Data to send to the workflow
   * @returns Response from the webhook
   */
  async triggerWebhookWorkflow(
    webhookUrl: string,
    data: any = {}
  ): Promise<{ success: boolean; response: any }> {
    try {
      // Prepare the payload
      const payload = {
        ...data,
        timestamp: new Date().toISOString()
      };
      
      // Call webhook URL directly
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to trigger webhook: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Create execution record for tracking
      await this.createExecutionRecord({
        externalId: `webhook-${Date.now()}`,
        triggerType: 'webhook',
        status: 'running',
        entityType: data.entityType,
        entityId: data.entityId,
        workflowTemplateId: null,
        webhookUrl
      });
      
      return {
        success: true,
        response: result
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.triggerWebhookWorkflow`, {
        error: error instanceof Error ? error.message : String(error),
        webhookUrl,
        data
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Get the status of a workflow execution
   * 
   * @param executionId - Execution ID to check
   * @returns Execution status details
   */
  async getWorkflowStatus(executionId: string): Promise<any> {
    try {
      // Get N8N configuration
      const config = await this.getN8NConfiguration();
      
      if (!config.baseUrl || !config.apiKey) {
        throw new Error('N8N configuration is incomplete');
      }
      
      const response = await fetch(`${config.baseUrl}/api/v1/executions/${executionId}`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': config.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch execution status: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getWorkflowStatus`, {
        error: error instanceof Error ? error.message : String(error),
        executionId
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Get list of available workflows from N8N
   * 
   * @returns List of available workflows
   */
  async getAvailableWorkflows(): Promise<any[]> {
    try {
      // Get N8N configuration
      const config = await this.getN8NConfiguration();
      
      if (!config.baseUrl || !config.apiKey) {
        throw new Error('N8N configuration is incomplete');
      }
      
      const response = await fetch(`${config.baseUrl}/api/v1/workflows?active=true`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': config.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Map to a simplified format
      return result.data.map((workflow: any) => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description || '',
        tags: workflow.tags || [],
        active: workflow.active
      }));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getAvailableWorkflows`, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Get saved webhook configurations
   * 
   * @returns List of webhooks
   */
  async getSavedWebhooks(): Promise<any[]> {
    try {
      return await this.webhookService.getWebhooks();
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getSavedWebhooks`, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Get registered API endpoints
   * 
   * @returns List of API endpoints
   */
  async getApiEndpoints(): Promise<any[]> {
    try {
      return await this.apiEndpointService.getApiEndpoints();
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getApiEndpoints`, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Get registered event triggers
   * 
   * @returns List of triggers
   */
  async getTriggers(): Promise<any[]> {
    try {
      // TODO: Implement trigger repository
      return [];
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getTriggers`, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Register a new webhook
   * 
   * @param webhook - Webhook configuration
   * @returns Created webhook
   */
  async registerWebhook(webhook: any): Promise<any> {
    try {
      return await this.webhookService.createWebhook(webhook);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.registerWebhook`, {
        error: error instanceof Error ? error.message : String(error),
        webhook
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Update an existing webhook
   * 
   * @param id - Webhook ID
   * @param webhook - Updated webhook configuration
   * @returns Updated webhook
   */
  async updateWebhook(id: number, webhook: any): Promise<any> {
    try {
      return await this.webhookService.updateWebhook(id, webhook);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.updateWebhook`, {
        error: error instanceof Error ? error.message : String(error),
        id,
        webhook
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Delete a webhook
   * 
   * @param id - Webhook ID
   * @returns Result of operation
   */
  async deleteWebhook(id: number): Promise<{ success: boolean }> {
    try {
      return await this.webhookService.deleteWebhook(id);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.deleteWebhook`, {
        error: error instanceof Error ? error.message : String(error),
        id
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Register an API endpoint
   * 
   * @param endpoint - API endpoint configuration
   * @returns Created API endpoint
   */
  async registerApiEndpoint(endpoint: any): Promise<any> {
    try {
      return await this.apiEndpointService.registerApiEndpoint(endpoint);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.registerApiEndpoint`, {
        error: error instanceof Error ? error.message : String(error),
        endpoint
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Register a trigger
   * 
   * @param trigger - Trigger configuration
   * @returns Created trigger
   */
  async registerTrigger(trigger: any): Promise<any> {
    try {
      // TODO: Implement trigger repository
      return trigger;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.registerTrigger`, {
        error: error instanceof Error ? error.message : String(error),
        trigger
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Get execution history
   * 
   * @param filters - Optional filters
   * @returns List of executions
   */
  async getExecutionHistory(filters: any = {}): Promise<any[]> {
    try {
      // TODO: Implement execution repository
      return [];
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getExecutionHistory`, {
        error: error instanceof Error ? error.message : String(error),
        filters
      });
      throw this.handleError(error);
    }
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
    try {
      // Handle different notification types
      switch (action) {
        case 'start':
          // Handle execution start
          return { success: true, message: 'Execution start recorded' };
          
        case 'update':
          // Handle execution update
          return { success: true, message: 'Execution update recorded' };
          
        case 'complete':
          // Handle execution completion
          return { success: true, message: 'Execution completion recorded' };
          
        case 'error':
          // Handle execution error
          return { success: true, message: 'Execution error recorded' };
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.handleWebhookNotification`, {
        error: error instanceof Error ? error.message : String(error),
        action,
        executionId,
        payload
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Handle workflow process start notification from N8N
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
    try {
      const request = await this.requestRepository.findById(requestId);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${requestId} not found`);
      }
      
      // Update request metadata
      await this.updateRequestMetadata(requestId, {
        workflowStatus: 'started',
        workflowId,
        executionId,
        startTimestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        message: 'Process start recorded',
        requestId
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.handleProcessStart`, {
        error: error instanceof Error ? error.message : String(error),
        requestId,
        workflowId,
        executionId
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Handle workflow process update notification from N8N
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
    try {
      // Find the request
      const request = await this.requestRepository.findById(requestId);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${requestId} not found`);
      }
      
      // Update progress metadata
      await this.updateRequestMetadata(requestId, {
        workflowStatus: 'in_progress',
        progress: payload.progress,
        currentStep: payload.step,
        updateTimestamp: new Date().toISOString()
      });
      
      // If the update includes extracted data, store it
      if (payload.extractedData) {
        await this.saveExtractedData(requestId, payload.extractedData, executionId);
      }
      
      return {
        success: true,
        message: 'Process update recorded',
        requestId
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.handleProcessUpdate`, {
        error: error instanceof Error ? error.message : String(error),
        requestId,
        executionId
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Handle workflow process completion notification from N8N
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
    try {
      // Find the request
      const request = await this.requestRepository.findById(requestId);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${requestId} not found`);
      }
      
      // Update request metadata
      await this.updateRequestMetadata(requestId, {
        workflowStatus: 'completed',
        completionTimestamp: new Date().toISOString(),
        results: payload.results || {}
      });
      
      // Store any final data
      if (payload.extractedData) {
        await this.saveExtractedData(requestId, payload.extractedData, executionId);
      }
      
      return {
        success: true,
        message: 'Process completion recorded',
        requestId
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.handleProcessComplete`, {
        error: error instanceof Error ? error.message : String(error),
        requestId,
        executionId
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Handle workflow process error notification from N8N
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
    try {
      // Find the request
      const request = await this.requestRepository.findById(requestId);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${requestId} not found`);
      }
      
      // Update request metadata
      await this.updateRequestMetadata(requestId, {
        workflowStatus: 'error',
        errorTimestamp: new Date().toISOString(),
        error: {
          message: payload.error?.message || 'Unknown error',
          code: payload.error?.code,
          details: payload.error?.details
        }
      });
      
      return {
        success: true,
        message: 'Process error recorded',
        requestId
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.handleProcessError`, {
        error: error instanceof Error ? error.message : String(error),
        requestId,
        executionId
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Update request metadata with N8N workflow information
   * 
   * @param requestId - ID of the request to update
   * @param metadataUpdates - Metadata updates to apply
   */
  private async updateRequestMetadata(
    requestId: number,
    metadataUpdates: Record<string, any>
  ): Promise<void> {
    const request = await this.requestRepository.findById(requestId);
    
    if (!request) {
      throw this.errorHandler.createNotFoundError(`Request with ID ${requestId} not found`);
    }
    
    // Initialize metadata if needed
    if (!request.metadata) {
      request.metadata = {};
    }
    
    // Initialize n8n section if needed
    if (!request.metadata.n8n) {
      request.metadata.n8n = {};
    }
    
    // Update with new values
    Object.entries(metadataUpdates).forEach(([key, value]) => {
      if (request.metadata && request.metadata.n8n) {
        request.metadata.n8n[key] = value;
      }
    });
    
    // Save the updated request
    await this.requestRepository.update(requestId, request);
  }
  
  /**
   * Save structured data extracted by a workflow
   * 
   * @param requestId - ID of the request
   * @param extractedData - Data extracted by the workflow
   * @param processedBy - Identifier of the processor
   */
  private async saveExtractedData(
    requestId: number,
    extractedData: Record<string, any>,
    processedBy: string
  ): Promise<void> {
    for (const [category, data] of Object.entries(extractedData)) {
      // Check if data for this category already exists
      const existingData = await this.requestDataRepository.findOne({
        criteria: {
          requestId,
          category
        }
      });
      
      if (existingData) {
        // Create history record
        await this.requestDataRepository.createHistory({
          requestDataId: existingData.id,
          data: existingData.data,
          changedBy: `n8n:${processedBy}`,
          changeReason: 'N8N workflow update',
          version: existingData.version
        });
        
        // Update existing data
        await this.requestDataRepository.update(existingData.id, {
          data,
          processedBy: `n8n:${processedBy}`,
          version: existingData.version + 1,
          updatedAt: new Date()
        });
      } else {
        // Create new data entry
        await this.requestDataRepository.create({
          requestId,
          category,
          label: this.getCategoryLabel(category),
          dataType: this.getDataType(data),
          data,
          processedBy: `n8n:${processedBy}`,
          version: 1,
          order: this.getDefaultOrder(category)
        });
      }
    }
  }
  
  /**
   * Get display label for a data category
   * 
   * @param category - Category identifier
   * @returns Human-readable label
   */
  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'customer-info': 'Customer Information',
      'product-details': 'Product Details',
      'appointment-preferences': 'Appointment Preferences',
      'conversation': 'Conversation History',
      'summary': 'Summary'
    };
    
    return labels[category] || category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
  }
  
  /**
   * Determine the data type based on content
   * 
   * @param data - Data to analyze
   * @returns Data type identifier
   */
  private getDataType(data: any): import('@/domain/entities/RequestData').RequestDataType {
    if (Array.isArray(data) && data.some(item => item.role && item.content)) {
      return 'conversation';
    }
    
    return 'json';
  }
  
  /**
   * Get default display order for a category
   * 
   * @param category - Category identifier
   * @returns Display order value
   */
  private getDefaultOrder(category: string): number {
    const orders: Record<string, number> = {
      'summary': 0,
      'customer-info': 10,
      'product-details': 20,
      'appointment-preferences': 30,
      'conversation': 40
    };
    
    return orders[category] || 100;
  }
  
  /**
   * Get N8N configuration
   * 
   * @returns N8N configuration
   */
  private async getN8NConfiguration() {
    // For now, use environment variables; later will use database
    return {
      baseUrl: this.configService.get('N8N_BASE_URL'),
      apiKey: this.configService.get('N8N_API_KEY')
    };
  }
  
  /**
   * Create execution record
   * 
   * @param execution - Execution data
   * @returns Created execution record
   */
  private async createExecutionRecord(execution: any) {
    // TODO: Implement execution repository
    return execution;
  }
  
  /**
   * Standardize error handling
   * 
   * @param error - Error to handle
   * @returns Standardized error
   */
  private handleError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  }
}