import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { withPermission } from '@/app/api/helpers/apiPermissions';

/**
 * POST /api/n8n/trigger-workflow
 * Triggers an N8N workflow by name for a specific request
 */
export const POST = routeHandler(
  withPermission(
    async (req: NextRequest) => {
      const { requestId, workflowName, data } = await req.json();
      
      if (!requestId) {
        return formatResponse.error('Missing requestId parameter');
      }
      
      if (!workflowName) {
        return formatResponse.error('Missing workflowName parameter');
      }
      
      const logger = getLogger();
      logger.info('Triggering N8N workflow', { requestId, workflowName });
      
      const serviceFactory = getServiceFactory();
      const n8nService = serviceFactory.createN8NIntegrationService();
      
      try {
        // Validate and parse requestId to number
        const parsedRequestId = parseInt(requestId, 10);
        if (isNaN(parsedRequestId)) {
          return formatResponse.error('Invalid requestId parameter: must be a number');
        }
        
        const result = await n8nService.triggerWorkflow(
          parsedRequestId, 
          workflowName, 
          data || {}
        );
        
        return formatResponse.success(
          result,
          'Workflow triggered successfully'
        );
      } catch (error) {
        logger.error('Error triggering N8N workflow', {
          error: error instanceof Error ? error.message : String(error),
          requestId,
          workflowName
        });
        
        return formatResponse.error(
          'Failed to trigger workflow',
          error instanceof Error ? error.message : String(error)
        );
      }
    },
    SystemPermission.REQUESTS_MANAGE
  ),
  { requiresAuth: true }
);