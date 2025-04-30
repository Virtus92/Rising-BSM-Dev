import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';

/**
 * POST /api/webhooks/n8n
 * Webhook endpoint for N8N to send updates and processing results
 */
export const POST = routeHandler(async (req: NextRequest) => {
  const { action, requestId, payload, workflowId, executionId } = await req.json();
  const logger = getLogger();
  
  logger.info('N8N Webhook received', { action, requestId, workflowId, executionId });
  
  if (!requestId) {
    return formatResponse.error('Missing requestId parameter');
  }
  
  // Validate requestId is a valid number
  const parsedRequestId = parseInt(requestId, 10);
  if (isNaN(parsedRequestId)) {
    return formatResponse.error('Invalid requestId parameter: must be a number');
  }
  
  if (!action) {
    return formatResponse.error('Missing action parameter');
  }
  
  const serviceFactory = getServiceFactory();
  const n8nService = serviceFactory.createN8NIntegrationService();
  
  try {
    switch (action) {
      case 'process-start':
        if (!workflowId || !executionId) {
          return formatResponse.error('Missing required parameters for process-start action');
        }
        
        return formatResponse.success(
          await n8nService.handleProcessStart(
            parsedRequestId,
            workflowId,
            executionId,
            payload || {}
          ),
          'Process start recorded'
        );
        
      case 'process-update':
        if (!executionId) {
          return formatResponse.error('Missing executionId parameter for process-update action');
        }
        
        return formatResponse.success(
          await n8nService.handleProcessUpdate(
            parsedRequestId,
            executionId,
            payload || {}
          ),
          'Process update recorded'
        );
        
      case 'process-complete':
        if (!executionId) {
          return formatResponse.error('Missing executionId parameter for process-complete action');
        }
        
        return formatResponse.success(
          await n8nService.handleProcessComplete(
            parsedRequestId,
            executionId,
            payload || {}
          ),
          'Process completion recorded'
        );
        
      case 'process-error':
        if (!executionId) {
          return formatResponse.error('Missing executionId parameter for process-error action');
        }
        
        return formatResponse.success(
          await n8nService.handleProcessError(
            parsedRequestId,
            executionId,
            payload || {}
          ),
          'Process error recorded'
        );
      
      default:
        return formatResponse.error(`Unknown action: ${action}`);
    }
  } catch (error) {
    logger.error('Error processing N8N webhook', {
      error: error instanceof Error ? error.message : String(error),
      action,
      requestId
    });
    
    return formatResponse.error(
      'Error processing webhook: ' + (error instanceof Error ? error.message : String(error)),
      500
    );
  }
}, { requiresAuth: false });