import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

/**
 * GET /api/n8n/workflows
 * Retrieves available N8N workflows
 */
export const GET = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const logger = getLogger();
      logger.info('Retrieving available N8N workflows');
      
      const serviceFactory = getServiceFactory();
      const n8nService = serviceFactory.createN8NIntegrationService();
      
      try {
        const workflows = await n8nService.getAvailableWorkflows();
        
        return formatResponse.success(
          workflows,
          'Workflows retrieved successfully'
        );
      } catch (error) {
        logger.error('Error retrieving N8N workflows', {
          error: error instanceof Error ? error.message : String(error)
        });
        
        return formatResponse.error(
          'Failed to retrieve workflows: ' + (error instanceof Error ? error.message : String(error)),
          500
        );
      }
    },
    SystemPermission.REQUESTS_VIEW
  ),
  { requiresAuth: true }
);