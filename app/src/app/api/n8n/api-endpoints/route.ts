import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

/**
 * GET /api/n8n/api-endpoints
 * Get all API endpoints
 */
export const GET = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const logger = getLogger();
      logger.info('Getting API endpoints');
      
      const serviceFactory = getServiceFactory();
      const n8nService = serviceFactory.createN8NIntegrationService();
      
      try {
        const endpoints = await n8nService.getApiEndpoints();
        
        return formatResponse.success(
          endpoints,
          'API endpoints retrieved successfully'
        );
      } catch (error) {
        logger.error('Error retrieving API endpoints', {
          error: error instanceof Error ? error.message : String(error)
        });
        
        return formatResponse.error(
          'Failed to retrieve API endpoints: ' + (error instanceof Error ? error.message : String(error)),
          500
        );
      }
    },
    SystemPermission.AUTOMATION_VIEW
  ),
  { requiresAuth: true }
);

/**
 * POST /api/n8n/api-endpoints
 * Register a new API endpoint
 */
export const POST = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const endpoint = await req.json();
      const logger = getLogger();
      
      logger.info('Registering API endpoint', { path: endpoint.path, method: endpoint.method });
      
      // Validate endpoint
      if (!endpoint.path) {
        return formatResponse.error('API endpoint path is required');
      }
      
      if (!endpoint.method) {
        return formatResponse.error('API endpoint method is required');
      }
      
      try {
        const serviceFactory = getServiceFactory();
        const n8nService = serviceFactory.createN8NIntegrationService();
        
        const registeredEndpoint = await n8nService.registerApiEndpoint(endpoint);
        
        return formatResponse.success(
          registeredEndpoint,
          'API endpoint registered successfully'
        );
      } catch (error) {
        logger.error('Error registering API endpoint', {
          error: error instanceof Error ? error.message : String(error),
          endpoint
        });
        
        return formatResponse.error(
          'Failed to register API endpoint: ' + (error instanceof Error ? error.message : String(error)),
          500
        );
      }
    },
    SystemPermission.AUTOMATION_MANAGE
  ),
  { requiresAuth: true }
);