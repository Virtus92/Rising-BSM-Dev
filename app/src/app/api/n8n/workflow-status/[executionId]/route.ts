import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { apiPermissions } from '../../../helpers/apiPermissions';

/**
 * GET /api/n8n/workflow-status/[executionId]
 * Gets the status of a specific workflow execution
 */
export const GET = apiRouteHandler(
  apiPermissions.withPermission(
    async (req: NextRequest, { params }: { params: { executionId: string } }) => {
      const executionId = params.executionId;
      
      // We don't need to parse executionId as it's correctly handled as a string
      
      if (!executionId) {
        return formatResponse.error('Missing executionId parameter');
      }
      
      const logger = getLogger();
      logger.info('Retrieving N8N workflow execution status', { executionId });
      
      const serviceFactory = getServiceFactory();
      const n8nService = serviceFactory.createN8NIntegrationService();
      
      try {
        // Handle executionId as string since N8N expects a string
        // executionId is already a string, which is what the N8N service expects
        const status = await n8nService.getWorkflowStatus(executionId);
        
        return formatResponse.success(
          status,
          'Workflow status retrieved successfully'
        );
      } catch (error) {
        logger.error('Error retrieving workflow status', {
          error: error instanceof Error ? error.message : String(error),
          executionId
        });
        
        return formatResponse.error(
          'Failed to retrieve workflow status',
          error instanceof Error ? error.message : String(error)
        );
      }
    },
    SystemPermission.REQUESTS_VIEW
  ),
  { requiresAuth: true }
);