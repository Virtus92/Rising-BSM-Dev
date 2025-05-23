/**
 * Delete Webhook API Route
 * 
 * DELETE /api/automation/webhooks/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getAutomationService } from '../../lib/services/getAutomationService';

/**
 * Delete webhook endpoint
 */
export async function deleteWebhookRoute(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const logger = new LoggingService();
  
  try {
    const params = await context.params;
    const webhookId = parseInt(params.id);
    
    logger.info('DELETE /api/automation/webhooks/[id] - Deleting webhook', { webhookId });
    
    // Validate webhook ID
    if (isNaN(webhookId) || webhookId <= 0) {
      // FIXED: Return formatResponse directly
      return formatResponse.error('Invalid webhook ID', 400);
    }
    
    // Get automation service
    const automationService = await getAutomationService();
    
    // Delete webhook
    const deleted = await automationService.deleteWebhook(webhookId);
    
    if (!deleted) {
      // FIXED: Return formatResponse directly
      return formatResponse.error('Webhook not found', 404);
    }
    
    logger.info('Webhook deleted successfully', { webhookId });
    
    // FIXED: Return formatResponse directly
    return formatResponse.success(
      { success: true, message: 'Webhook deleted successfully' },
      'Webhook deleted successfully'
    );
    
  } catch (error) {
    const params = await context.params;
    logger.error('Error deleting webhook', { error, webhookId: params.id });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to delete webhook';
    
    // FIXED: Return formatResponse directly
    return formatResponse.error(message, statusCode);
  }
}
