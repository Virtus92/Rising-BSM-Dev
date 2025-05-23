/**
 * Get Webhook By ID API Route
 * 
 * GET /api/automation/webhooks/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getAutomationService } from '../../lib/services/getAutomationService';

/**
 * Get webhook by ID endpoint
 */
export async function getWebhookByIdRoute(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const logger = new LoggingService();
  
  try {
    const params = await context.params;
    const webhookId = parseInt(params.id);
    
    logger.info('GET /api/automation/webhooks/[id] - Getting webhook by ID', { webhookId });
    
    // Validate webhook ID
    if (isNaN(webhookId) || webhookId <= 0) {
      // FIXED: Return formatResponse directly
      return formatResponse.error('Invalid webhook ID', 400);
    }
    
    // Get automation service
    const automationService = await getAutomationService();
    
    // Get webhook
    const webhook = await automationService.getWebhookById(webhookId);
    
    if (!webhook) {
      // FIXED: Return formatResponse directly
      return formatResponse.error('Webhook not found', 404);
    }
    
    logger.info('Webhook retrieved successfully', { webhookId });
    
    // FIXED: Return formatResponse directly
    return formatResponse.success(webhook);
    
  } catch (error) {
    const params = await context.params;
    logger.error('Error getting webhook by ID', { error, webhookId: params.id });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to get webhook';
    
    // FIXED: Return formatResponse directly
    return formatResponse.error(message, statusCode);
  }
}
