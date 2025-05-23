/**
 * Simplified Webhook Execution Service
 * 
 * Removes unnecessary complexity and provides clear, consistent webhook execution
 */

import { AutomationEntityType, AutomationOperation } from '@/domain/entities/AutomationWebhook';
import { buildPayload } from './payload-template';

/**
 * Execute a webhook with proper error handling and logging
 */
export async function executeWebhook(
  webhook: {
    id: number;
    name: string;
    webhookUrl: string;
    headers: Record<string, string>;
    payloadTemplate: Record<string, any>;
    entityType: AutomationEntityType;
    operation: AutomationOperation;
  },
  entityData: any,
  entityId?: number
): Promise<{
  success: boolean;
  executionId?: number;
  statusCode?: number;
  responseTime: number;
  error?: string;
  responseBody?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Build the payload
    const payload = buildPayload(webhook.payloadTemplate, entityData, {
      entityType: webhook.entityType,
      operation: webhook.operation,
      webhookName: webhook.name,
      webhookId: webhook.id
    });
    
    console.log(`[Webhook Execution] Executing webhook: ${webhook.name}`, {
      url: webhook.webhookUrl,
      entityType: webhook.entityType,
      operation: webhook.operation,
      entityId
    });
    
    // Make the HTTP request
    const response = await fetch(webhook.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Rising-BSM/1.0',
        ...webhook.headers
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    let responseBody = '';
    
    try {
      responseBody = await response.text();
    } catch (e) {
      console.warn('[Webhook Execution] Could not read response body');
    }
    
    const success = response.ok;
    
    console.log(`[Webhook Execution] Completed`, {
      webhookId: webhook.id,
      success,
      statusCode: response.status,
      responseTime
    });
    
    return {
      success,
      statusCode: response.status,
      responseTime,
      responseBody,
      error: success ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[Webhook Execution] Failed`, {
      webhookId: webhook.id,
      error: errorMessage,
      responseTime
    });
    
    return {
      success: false,
      responseTime,
      error: errorMessage
    };
  }
}

/**
 * Test a webhook URL with appropriate payload
 */
export async function testWebhookUrl(
  url: string,
  headers?: Record<string, string>,
  customPayload?: Record<string, any>
): Promise<{
  success: boolean;
  statusCode?: number;
  responseTime: number;
  error?: string;
  responseBody?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Use custom payload or default test payload
    const payload = customPayload || {
      test: true,
      source: 'Rising-BSM',
      timestamp: new Date().toISOString(),
      message: 'Webhook connection test'
    };
    
    console.log(`[Webhook Test] Testing webhook URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Rising-BSM/1.0',
        ...headers
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    let responseBody = '';
    
    try {
      responseBody = await response.text();
    } catch (e) {
      console.warn('[Webhook Test] Could not read response body');
    }
    
    const success = response.ok;
    
    console.log(`[Webhook Test] Completed`, {
      url,
      success,
      statusCode: response.status,
      responseTime
    });
    
    return {
      success,
      statusCode: response.status,
      responseTime,
      responseBody,
      error: success ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[Webhook Test] Failed`, {
      url,
      error: errorMessage,
      responseTime
    });
    
    return {
      success: false,
      responseTime,
      error: errorMessage
    };
  }
}

/**
 * Batch execute multiple webhooks for the same event
 */
export async function batchExecuteWebhooks(
  webhooks: Array<{
    id: number;
    name: string;
    webhookUrl: string;
    headers: Record<string, string>;
    payloadTemplate: Record<string, any>;
    entityType: AutomationEntityType;
    operation: AutomationOperation;
  }>,
  entityData: any,
  entityId?: number
): Promise<Array<{
  webhookId: number;
  webhookName: string;
  success: boolean;
  error?: string;
}>> {
  console.log(`[Webhook Batch] Executing ${webhooks.length} webhooks`);
  
  // Execute all webhooks in parallel
  const results = await Promise.allSettled(
    webhooks.map(webhook => executeWebhook(webhook, entityData, entityId))
  );
  
  // Process results
  return results.map((result, index) => {
    const webhook = webhooks[index];
    
    if (result.status === 'fulfilled') {
      return {
        webhookId: webhook.id,
        webhookName: webhook.name,
        success: result.value.success,
        error: result.value.error
      };
    } else {
      return {
        webhookId: webhook.id,
        webhookName: webhook.name,
        success: false,
        error: result.reason?.message || 'Execution failed'
      };
    }
  });
}
