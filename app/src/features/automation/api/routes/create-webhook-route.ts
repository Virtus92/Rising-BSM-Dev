/**
 * Create Webhook API Route
 * 
 * POST /api/automation/webhooks
 */

import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getAutomationService } from '../../lib/services/getAutomationService';
import { CreateWebhookRequest } from '../models';

/**
 * Create webhook endpoint
 */
export async function createWebhookRoute(request: NextRequest) {
  const logger = new LoggingService();
  
  try {
    logger.info('POST /api/automation/webhooks - Creating webhook');
    
    // Parse request body
    let body: CreateWebhookRequest;
    try {
      const rawBody = await request.text();
      logger.debug('Raw request body', { 
        bodyLength: rawBody.length,
        bodyPreview: rawBody.substring(0, 200)
      });
      
      body = JSON.parse(rawBody);
      logger.info('Request body parsed successfully', { 
        bodyKeys: Object.keys(body || {}),
        hasRequiredFields: {
          name: !!body?.name,
          webhookUrl: !!body?.webhookUrl,
          entityType: !!body?.entityType,
          operation: !!body?.operation
        }
      });
    } catch (parseError) {
      logger.error('Failed to parse request body', { 
        error: parseError,
        errorMessage: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      });
      // FIXED: Return formatResponse directly, don't wrap with NextResponse.json
      return formatResponse.error('Invalid JSON in request body', 400);
    }
    
    // Validate required fields
    if (!body || typeof body !== 'object') {
      logger.error('Invalid request body type', { bodyType: typeof body });
      return formatResponse.error('Invalid request body', 400);
    }
    
    const missingFields = [];
    if (!body.name) missingFields.push('name');
    if (!body.webhookUrl) missingFields.push('webhookUrl');
    if (!body.entityType) missingFields.push('entityType');
    if (!body.operation) missingFields.push('operation');
    
    if (missingFields.length > 0) {
      logger.error('Missing required fields', { 
        missingFields,
        providedFields: Object.keys(body)
      });
      return formatResponse.error(`Missing required fields: ${missingFields.join(', ')}`, 400);
    }
    
    // Get automation service
    const automationService = await getAutomationService();
    
    // Ensure service is available
    if (!automationService) {
      logger.error('Automation service not available');
      return formatResponse.error('Service temporarily unavailable', 503);
    }
    
    // Create webhook
    logger.info('Creating webhook with service', {
      name: body.name,
      entityType: body.entityType,
      operation: body.operation,
      webhookUrl: body.webhookUrl
    });
    
    const webhook = await automationService.createWebhook({
      name: body.name,
      description: body.description || '',
      entityType: body.entityType,
      operation: body.operation,
      webhookUrl: body.webhookUrl,
      headers: body.headers || {},
      payloadTemplate: body.payloadTemplate || {},
      active: body.active !== undefined ? body.active : true,
      retryCount: body.retryCount || 3,
      retryDelaySeconds: body.retryDelaySeconds || 30
    });
    
    if (!webhook) {
      logger.error('Service returned null webhook');
      return formatResponse.error('Failed to create webhook', 500);
    }
    
    logger.info('Webhook created successfully', { 
      webhookId: webhook.id,
      webhookName: webhook.name
    });
    
    // FIXED: Return formatResponse directly with 201 status
    return formatResponse.success(webhook, 'Webhook created successfully', 201);
    
  } catch (error) {
    logger.error('Error creating webhook', { 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to create webhook';
    
    // FIXED: Return formatResponse directly
    return formatResponse.error(message, statusCode);
  }
}
