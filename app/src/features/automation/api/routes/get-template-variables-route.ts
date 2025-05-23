/**
 * Get Template Variables API Route
 * 
 * GET /api/automation/webhooks/variables
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getAutomationService } from '../../lib/services/getAutomationService';
import { AutomationEntityType } from '@/domain/entities/AutomationWebhook';

/**
 * Get available variables for webhook templates
 */
export async function getTemplateVariablesRoute(request: NextRequest): Promise<NextResponse> {
  const logger = new LoggingService();
  
  try {
    logger.info('GET /api/automation/webhooks/variables - Getting template variables');
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    
    // Validate entity type
    if (!entityType || !Object.values(AutomationEntityType).includes(entityType as AutomationEntityType)) {
      return formatResponse.error('Invalid or missing entityType', 400);
    }
    
    // Get automation service
    const automationService = await getAutomationService();
    
    if (!automationService) {
      logger.error('Automation service not available');
      return formatResponse.error('Service temporarily unavailable', 503);
    }
    
    // Get available variables
    const variables = await automationService.getAvailableVariables(entityType as AutomationEntityType);
    
    logger.info('Template variables retrieved successfully', { entityType });
    
    return formatResponse.success(variables);
    
  } catch (error) {
    logger.error('Error getting template variables', { 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to get template variables';
    
    return formatResponse.error(message, statusCode);
  }
}
