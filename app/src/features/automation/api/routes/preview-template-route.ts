/**
 * Preview Template API Route
 * 
 * POST /api/automation/webhooks/preview
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getAutomationService } from '../../lib/services/getAutomationService';
import { AutomationEntityType, AutomationOperation } from '@/domain/entities/AutomationWebhook';

interface PreviewTemplateRequest {
  template: Record<string, any>;
  entityType: AutomationEntityType;
  operation: AutomationOperation;
}

/**
 * Preview webhook template with sample data
 */
export async function previewTemplateRoute(request: NextRequest): Promise<NextResponse> {
  const logger = new LoggingService();
  
  try {
    logger.info('POST /api/automation/webhooks/preview - Previewing template');
    
    // Parse request body
    let body: PreviewTemplateRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.error('Failed to parse request body', { error: parseError });
      return formatResponse.error('Invalid JSON in request body', 400);
    }
    
    // Validate required fields
    if (!body.template || !body.entityType || !body.operation) {
      return formatResponse.error('Missing required fields: template, entityType, operation', 400);
    }
    
    // Validate entity type and operation
    if (!Object.values(AutomationEntityType).includes(body.entityType)) {
      return formatResponse.error('Invalid entityType', 400);
    }
    
    if (!Object.values(AutomationOperation).includes(body.operation)) {
      return formatResponse.error('Invalid operation', 400);
    }
    
    // Get automation service
    const automationService = await getAutomationService();
    
    if (!automationService) {
      logger.error('Automation service not available');
      return formatResponse.error('Service temporarily unavailable', 503);
    }
    
    // Preview template
    const preview = await automationService.previewTemplate(
      body.template,
      body.entityType,
      body.operation
    );
    
    logger.info('Template preview generated successfully');
    
    return formatResponse.success({ preview });
    
  } catch (error) {
    logger.error('Error previewing template', { 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to preview template';
    
    return formatResponse.error(message, statusCode);
  }
}
