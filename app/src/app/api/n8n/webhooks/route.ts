import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

/**
 * GET /api/n8n/webhooks
 * Get all webhooks
 */
export const GET = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const logger = getLogger();
      logger.info('Getting N8N webhooks');
      
      const serviceFactory = getServiceFactory();
      const n8nService = serviceFactory.createN8NIntegrationService();
      
      try {
        const webhooks = await n8nService.getSavedWebhooks();
        
        return formatResponse.success(
          webhooks,
          'Webhooks retrieved successfully'
        );
      } catch (error) {
        logger.error('Error retrieving N8N webhooks', {
          error: error instanceof Error ? error.message : String(error)
        });
        
        return formatResponse.error(
          'Failed to retrieve webhooks: ' + (error instanceof Error ? error.message : String(error)),
          500
        );
      }
    },
    SystemPermission.AUTOMATION_VIEW
  ),
  { requiresAuth: true }
);

/**
 * POST /api/n8n/webhooks
 * Create a new webhook
 */
export const POST = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const webhook = await req.json();
      const logger = getLogger();
      
      logger.info('Creating N8N webhook', { name: webhook.name });
      
      // Validate webhook
      if (!webhook.name) {
        return formatResponse.error('Webhook name is required');
      }
      
      if (!webhook.path) {
        return formatResponse.error('Webhook path is required');
      }
      
      try {
        const serviceFactory = getServiceFactory();
        const n8nService = serviceFactory.createN8NIntegrationService();
        
        const createdWebhook = await n8nService.registerWebhook(webhook);
        
        return formatResponse.success(
          createdWebhook,
          'Webhook created successfully'
        );
      } catch (error) {
        logger.error('Error creating N8N webhook', {
          error: error instanceof Error ? error.message : String(error),
          webhook
        });
        
        return formatResponse.error(
          'Failed to create webhook: ' + (error instanceof Error ? error.message : String(error)),
          500
        );
      }
    },
    SystemPermission.AUTOMATION_MANAGE
  ),
  { requiresAuth: true }
);