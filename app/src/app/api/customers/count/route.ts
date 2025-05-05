import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

/**
 * GET /api/customers/count
 * Returns the total count of customers in the system
 */
export const GET = routeHandler(
  permissionMiddleware.withPermission(
    async (request: NextRequest) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
      
      try {
        // Get customer service
        const customerService = serviceFactory.createCustomerService();
        
        // Context for service calls
        const context = { userId: request.auth?.userId };
        
        // Try to get count from service first
        try {
          const result = await customerService.count();
          
          // Ensure we have a proper count response
          let count = 0;
          
          if (result && typeof result === 'object' && 'count' in result) {
            count = result.count as number;
          } else if (typeof result === 'number') {
            count = result;
          } else if (result && typeof result === 'object' && 'total' in result) {
            count = (result as any).total as number;
          }
          
          return formatSuccess({ count }, 'Customer count retrieved successfully');
        } catch (serviceError) {
          logger.warn('Error retrieving customer count from service, trying repository directly:', {
            error: serviceError instanceof Error ? serviceError.message : String(serviceError)
          });
          
          // Fallback to repository if service fails
          const repositoryResult = await customerService.getRepository().count();
          
          // Ensure we have a proper count response from repository
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
          
          return formatSuccess({ count }, 'Customer count retrieved successfully');
        }
      } catch (error) {
        logger.error('Error counting customers:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        return formatError(
          error instanceof Error ? error.message : 'Failed to retrieve customer count',
          500
        );
      }
    },
    SystemPermission.CUSTOMERS_VIEW
  ),
  {
    // Secure this endpoint
    requiresAuth: true
  }
);
