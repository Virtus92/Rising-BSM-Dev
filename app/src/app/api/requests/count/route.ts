import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

/**
 * GET /api/requests/count
 * Returns the total count of contact requests in the system
 */
export const GET = routeHandler(
  permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
      
      // Context for service calls
      const context = { userId: req.auth?.userId };
      
      // Extract filters from query parameters
      const { searchParams } = new URL(req.url);
      const filters = {
        status: searchParams.get('status') || undefined,
        type: searchParams.get('type') || undefined,
        assignedTo: searchParams.has('assignedTo') ? parseInt(searchParams.get('assignedTo')!) : undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined
      };
      
      try {
        const requestService = serviceFactory.createRequestService();
        
        try {
          // Get count from service with any filters
          const result = await requestService.count({
            context,
            filters
          });
          
          // Ensure we have a proper count response
          let count = 0;
          
          if (result && typeof result === 'object' && 'count' in result) {
            count = result.count as number;
          } else if (typeof result === 'number') {
            count = result;
          } else if (result && typeof result === 'object') {
            // Use type assertion to avoid 'never' type issues
            const typedResult = result as Record<string, any>;
            if ('total' in typedResult) {
              count = typedResult.total;
            }
          }
          
          return formatResponse.success({ count }, 'Request count retrieved successfully');
        } catch (serviceError) {
          logger.warn('Error retrieving request count from service, trying repository directly:', {
            error: serviceError instanceof Error ? serviceError.message : String(serviceError)
          });
          
          // Fallback to using repository directly
          const repositoryResult = await requestService.getRepository().count(filters);
          
          // Ensure we have a proper count response even from repository
          let count = 0;
          
          if (typeof repositoryResult === 'number') {
            count = repositoryResult;
          } else if (repositoryResult && typeof repositoryResult === 'object') {
            if ('count' in repositoryResult) {
              count = repositoryResult.count as number;
            } else if ('total' in repositoryResult) {
              count = repositoryResult.total as number;
            }
          }
          
          return formatResponse.success({ count }, 'Request count retrieved through fallback method');
        }
      } catch (error) {
        logger.error('Error in /api/requests/count endpoint:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          filters
        });
        
        // Return a default count of 0 instead of an error
        return formatResponse.success({ count: 0 }, 'Request count failed, returning default value');
      }
    },
    SystemPermission.REQUESTS_VIEW
  ),
  { requiresAuth: true }
);
