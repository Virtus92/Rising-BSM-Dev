/**
 * Get Default Template API Route
 * 
 * GET /api/automation/webhooks/default-template
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getAutomationService } from '../../lib/services/getAutomationService';
import { AutomationEntityType, AutomationOperation } from '@/domain/entities/AutomationWebhook';

/**
 * Get default template for entity type and operation
 */
export async function getDefaultTemplateRoute(request: NextRequest): Promise<NextResponse> {
  const logger = new LoggingService();
  
  try {
    logger.info('GET /api/automation/webhooks/default-template - Getting default template');
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const operation = searchParams.get('operation');
    
    // Validate parameters
    if (!entityType || !Object.values(AutomationEntityType).includes(entityType as AutomationEntityType)) {
      return formatResponse.error('Invalid or missing entityType', 400);
    }
    
    if (!operation || !Object.values(AutomationOperation).includes(operation as AutomationOperation)) {
      return formatResponse.error('Invalid or missing operation', 400);
    }
    
    // Get automation service
    const automationService = await getAutomationService();
    
    if (!automationService) {
      logger.error('Automation service not available');
      return formatResponse.error('Service temporarily unavailable', 503);
    }
    
    // Get default template
    const template = await automationService.getDefaultTemplateForEntity(
      entityType as AutomationEntityType,
      operation as AutomationOperation
    );
    
    logger.info('Default template retrieved successfully', { entityType, operation });
    
    return formatResponse.success({ template });
    
  } catch (error) {
    logger.error('Error getting default template', { 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to get default template';
    
    return formatResponse.error(message, statusCode);
  }
}
