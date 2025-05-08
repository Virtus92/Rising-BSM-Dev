import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

/**
 * GET /api/n8n/executions
 * Get execution history with optional filters
 */
export const GET = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const logger = getLogger();
      const url = new URL(req.url);
      
      // Extract query parameters
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
      const status = url.searchParams.get('status') || undefined;
      const triggerType = url.searchParams.get('triggerType') || undefined;
      const workflowTemplateId = url.searchParams.get('workflowTemplateId')
        ? parseInt(url.searchParams.get('workflowTemplateId')!, 10)
        : undefined;
      const search = url.searchParams.get('search') || undefined;
      
      logger.info('Getting N8N execution history', { page, pageSize, status, triggerType, workflowTemplateId, search });
      
      const serviceFactory = getServiceFactory();
      const n8nService = serviceFactory.createN8NIntegrationService();
      
      try {
        const executions = await n8nService.getExecutionHistory({
          page,
          pageSize,
          status,
          triggerType,
          workflowTemplateId,
          search
        });
        
        // For now, we'll just return dummy data
        const totalCount = 4; // Total number of executions (mock)
        const totalPages = Math.ceil(totalCount / pageSize);
        
        return formatResponse.success(
          {
            data: executions,
            totalCount,
            totalPages,
            page,
            pageSize
          },
          'Execution history retrieved successfully'
        );
      } catch (error) {
        logger.error('Error retrieving N8N execution history', {
          error: error instanceof Error ? error.message : String(error)
        });
        
        return formatResponse.error(
          'Failed to retrieve execution history: ' + (error instanceof Error ? error.message : String(error)),
          500
        );
      }
    },
    SystemPermission.AUTOMATION_VIEW
  ),
  { requiresAuth: true }
);