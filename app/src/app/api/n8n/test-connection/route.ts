import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

/**
 * POST /api/n8n/test-connection
 * Test connection to N8N server
 */
export const POST = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const { baseUrl, apiKey } = await req.json();
      const logger = getLogger();
      
      logger.info('Testing N8N connection', { baseUrl });
      
      // Validate parameters
      if (!baseUrl) {
        return formatResponse.error('Base URL is required');
      }
      
      if (!apiKey) {
        return formatResponse.error('API key is required');
      }
      
      try {
        // Test the connection by fetching workflows
        const response = await fetch(`${baseUrl}/api/v1/workflows?active=true`, {
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': apiKey
          }
        });
        
        if (!response.ok) {
          throw new Error(`Connection failed: ${response.statusText}`);
        }
        
        // Successfully connected
        return formatResponse.success(
          { connected: true },
          'Connection successful'
        );
      } catch (error) {
        logger.error('Error testing N8N connection', {
          error: error instanceof Error ? error.message : String(error),
          baseUrl
        });
        
        return formatResponse.error(
          'Connection failed: ' + (error instanceof Error ? error.message : String(error)),
          500
        );
      }
    },
    SystemPermission.SETTINGS_MANAGE
  ),
  { requiresAuth: true }
);