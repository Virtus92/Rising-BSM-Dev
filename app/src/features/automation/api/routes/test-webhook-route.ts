/**
 * Test Webhook API Route
 * 
 * POST /api/automation/webhooks/test
 */

import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getAutomationService } from '../../lib/services/getAutomationService';
import { TestWebhookRequest } from '../models';

/**
 * Test webhook endpoint
 */
export async function testWebhookRoute(request: NextRequest) {
  const logger = new LoggingService();
  
  try {
    logger.info('POST /api/automation/webhooks/test - Testing webhook');
    
    // Parse request body
    let body: TestWebhookRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.error('Failed to parse request body', { error: parseError });
      return formatResponse.error('Invalid JSON in request body', 400);
    }
    
    // Validate required fields
    if (!body || !body.webhookUrl) {
      logger.error('Missing required field: webhookUrl');
      return formatResponse.error('Missing required field: webhookUrl', 400);
    }
    
    // Get automation service
    const automationService = await getAutomationService();
    
    // Ensure service is available
    if (!automationService) {
      logger.error('Automation service not available');
      return formatResponse.error('Service temporarily unavailable', 503);
    }
    
    // Test webhook
    logger.info('Testing webhook', { 
      webhookUrl: body.webhookUrl,
      hasHeaders: !!body.headers,
      hasPayload: !!body.payload
    });
    
    const result = await automationService.testWebhook({
      webhookUrl: body.webhookUrl,
      headers: body.headers || {},
      payload: body.payload
    });
    
    logger.info('Webhook test completed', {
      url: body.webhookUrl,
      success: result.success,
      status: result.responseStatus,
      executionTime: result.executionTimeMs,
      totalTime: Date.now()
    });
    
    // FIXED: Return the test result directly in the data field
    // The frontend expects the test result in the data property
    return formatResponse.success(result, result.success ? 'Webhook test successful' : 'Webhook test failed');
    
  } catch (error) {
    logger.error('Error testing webhook', { 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to test webhook';
    
    return formatResponse.error(message, statusCode);
  }
}
