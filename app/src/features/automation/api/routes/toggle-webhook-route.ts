/**
 * Toggle Webhook Active Status API Route
 * 
 * PATCH /api/automation/webhooks/[id]/toggle
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getAutomationService } from '../../lib/services/getAutomationService';

/**
 * Toggle webhook active status endpoint
 */
export async function toggleWebhookRoute(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const logger = new LoggingService();
  
  try {
    const params = await context.params;
    const webhookId = parseInt(params.id);
    
    logger.info('PATCH /api/automation/webhooks/[id]/toggle - Toggling webhook status', { webhookId });
    
    // Validate webhook ID
    if (isNaN(webhookId) || webhookId <= 0) {
      // FIXED: Return formatResponse directly
      return formatResponse.error('Invalid webhook ID', 400);
    }
    
    // Get automation service
    const automationService = await getAutomationService();
    
    // Toggle webhook status
    const webhook = await automationService.toggleWebhookActive(webhookId);
    
    logger.info('Webhook status toggled successfully', { 
      webhookId, 
      active: webhook.active 
    });
    
    // FIXED: Return the full webhook object, not a custom structure
    // The frontend expects the complete webhook object
    return formatResponse.success(
      webhook,
      `Webhook ${webhook.active ? 'activated' : 'deactivated'} successfully`
    );
    
  } catch (error) {
    const params = await context.params;
    logger.error('Error toggling webhook status', { error, webhookId: params.id });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to toggle webhook status';
    
    // FIXED: Return formatResponse directly
    return formatResponse.error(message, statusCode);
  }
}
