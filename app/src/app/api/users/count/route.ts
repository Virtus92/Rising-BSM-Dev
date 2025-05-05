import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

/**
 * GET /api/users/count
 * Get user count
 */
export const GET = routeHandler(
  permissionMiddleware.withPermission(
    async (request: NextRequest) => {
      const logger = getLogger();
      
      try {
        // Get the user service from service factory
        const serviceFactory = getServiceFactory();
        const userService = serviceFactory.createUserService();
        
        // Get user count from the service
        try {
          const result = await userService.count();
          
          // Ensure we have a proper count response
          let count = 0;
          
          if (result && typeof result === 'object' && 'count' in result) {
            count = result.count as number;
          } else if (typeof result === 'number') {
            count = result;
          } else if (result && typeof result === 'object' && 'total' in result) {
            count = (result as any).total as number;
          }
          
          return formatSuccess({ count }, 'User count retrieved successfully');
        } catch (error) {
          logger.error('Error retrieving user count from service:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          
          // Use repository directly as fallback
          const repositoryResult = await userService.getRepository().count();
          
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
          
          return formatSuccess({ count }, 'User count retrieved successfully');
        }
      } catch (error) {
        logger.error('Error retrieving user count:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        return formatError(
          error instanceof Error ? error.message : 'Failed to retrieve user count',
          500
        );
      }
    },
    SystemPermission.USERS_VIEW
  ),
  {
    // Secure this endpoint
    requiresAuth: true
  }
);
