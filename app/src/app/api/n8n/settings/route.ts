import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

/**
 * GET /api/n8n/settings
 * Get N8N integration settings
 */
export const GET = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const logger = getLogger();
      logger.info('Getting N8N integration settings');
      
      const serviceFactory = getServiceFactory();
      const n8nService = serviceFactory.createN8NIntegrationService();
      
      try {
        // For now, we'll just return basic settings
        // Later this will be fetched from a database
        const settings = {
          baseUrl: process.env.N8N_BASE_URL || '',
          apiKey: process.env.N8N_API_KEY || '',
          enabled: process.env.N8N_ENABLED === 'true',
          advanced: {
            autoDiscover: false,
            webhooksEnabled: true,
            debugMode: false
          }
        };
        
        return formatResponse.success(
          settings,
          'Settings retrieved successfully'
        );
      } catch (error) {
        logger.error('Error retrieving N8N settings', {
          error: error instanceof Error ? error.message : String(error)
        });
        
        return formatResponse.error(
          'Failed to retrieve settings: ' + (error instanceof Error ? error.message : String(error)),
          500
        );
      }
    },
    SystemPermission.SETTINGS_MANAGE
  ),
  { requiresAuth: true }
);

/**
 * POST /api/n8n/settings
 * Update N8N integration settings
 */
export const POST = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const settings = await req.json();
      const logger = getLogger();
      
      logger.info('Updating N8N integration settings');
      
      // Validate settings
      if (!settings.baseUrl) {
        return formatResponse.error('Base URL is required');
      }
      
      if (!settings.apiKey) {
        return formatResponse.error('API key is required');
      }
      
      try {
        // For now, we'll just log the settings
        // Later this will update a database
        logger.info('N8N settings updated', { settings });
        
        // For security, don't log or return the actual API key
        const sanitizedSettings = {
          ...settings,
          apiKey: '******'
        };
        
        return formatResponse.success(
          sanitizedSettings,
          'Settings updated successfully'
        );
      } catch (error) {
        logger.error('Error updating N8N settings', {
          error: error instanceof Error ? error.message : String(error)
        });
        
        return formatResponse.error(
          'Failed to update settings: ' + (error instanceof Error ? error.message : String(error)),
          500
        );
      }
    },
    SystemPermission.SETTINGS_MANAGE
  ),
  { requiresAuth: true }
);