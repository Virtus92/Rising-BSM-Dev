/**
 * Update Webhook API Route
 * 
 * PUT /api/automation/webhooks/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getAutomationService } from '../../lib/services/getAutomationService';
import { UpdateWebhookRequest } from '../models';

/**
 * Update webhook endpoint
 */
export async function updateWebhookRoute(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const logger = new LoggingService();
  
  try {
    const params = await context.params;
    const webhookId = parseInt(params.id);
    
    logger.info('PUT /api/automation/webhooks/[id] - Updating webhook', { webhookId });
    
    // Validate webhook ID
    if (isNaN(webhookId) || webhookId <= 0) {
      // FIXED: Return formatResponse directly
      return formatResponse.error('Invalid webhook ID', 400);
    }
    
    // Parse request body
    const body: UpdateWebhookRequest = await request.json();
    
    // Get automation service
    const automationService = await getAutomationService();
    
    // Update webhook
    const webhook = await automationService.updateWebhook(webhookId, body);
    
    logger.info('Webhook updated successfully', { webhookId });
    
    // FIXED: Return formatResponse directly
    return formatResponse.success(webhook, 'Webhook updated successfully');
    
  } catch (error) {
    const params = await context.params;
    logger.error('Error updating webhook', { error, webhookId: params.id });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to update webhook';
    
    // FIXED: Return formatResponse directly
    return formatResponse.error(message, statusCode);
  }
}
