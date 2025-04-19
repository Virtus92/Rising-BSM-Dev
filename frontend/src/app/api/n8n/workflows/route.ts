import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { apiPermissions } from '../../helpers/apiPermissions';

/**
 * GET /api/n8n/workflows
 * Retrieves available N8N workflows
 */
export const GET = apiRouteHandler(
  apiPermissions.withPermission(
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
          'Failed to retrieve workflows',
          error instanceof Error ? error.message : String(error)
        );
      }
    },
    SystemPermission.REQUESTS_VIEW
  ),
  { requiresAuth: true }
);