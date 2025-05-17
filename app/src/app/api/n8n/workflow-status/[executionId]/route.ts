import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

/**
 * GET /api/n8n/workflow-status/[executionId]
 * Gets the status of a specific workflow execution
 */
export const GET = routeHandler(
  await permissionMiddleware.withPermission(
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
          'Failed to retrieve workflow status: ' + (error instanceof Error ? error.message : String(error)),
          500
        );
      }
    },
    SystemPermission.REQUESTS_VIEW
  ),
  { requiresAuth: true }
);