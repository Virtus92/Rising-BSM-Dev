import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

/**
 * GET /api/n8n/triggers
 * Get all triggers
 */
export const GET = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const logger = getLogger();
      logger.info('Getting N8N triggers');
      
      const serviceFactory = getServiceFactory();
      const n8nService = serviceFactory.createN8NIntegrationService();
      
      try {
        const triggers = await n8nService.getTriggers();
        
        return formatResponse.success(
          triggers,
          'Triggers retrieved successfully'
        );
      } catch (error) {
        logger.error('Error retrieving N8N triggers', {
          error: error instanceof Error ? error.message : String(error)
        });
        
        return formatResponse.error(
          'Failed to retrieve triggers: ' + (error instanceof Error ? error.message : String(error)),
          500
        );
      }
    },
    SystemPermission.AUTOMATION_VIEW
  ),
  { requiresAuth: true }
);

/**
 * POST /api/n8n/triggers
 * Create a new trigger
 */
export const POST = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const trigger = await req.json();
      const logger = getLogger();
      
      logger.info('Creating N8N trigger', { name: trigger.name, eventType: trigger.eventType });
      
      // Validate trigger
      if (!trigger.name) {
        return formatResponse.error('Trigger name is required');
      }
      
      if (!trigger.eventType) {
        return formatResponse.error('Event type is required');
      }
      
      if (!trigger.workflowTemplateId) {
        return formatResponse.error('Workflow template ID is required');
      }
      
      try {
        const serviceFactory = getServiceFactory();
        const n8nService = serviceFactory.createN8NIntegrationService();
        
        const createdTrigger = await n8nService.registerTrigger(trigger);
        
        return formatResponse.success(
          createdTrigger,
          'Trigger created successfully'
        );
      } catch (error) {
        logger.error('Error creating N8N trigger', {
          error: error instanceof Error ? error.message : String(error),
          trigger
        });
        
        return formatResponse.error(
          'Failed to create trigger: ' + (error instanceof Error ? error.message : String(error)),
          500
        );
      }
    },
    SystemPermission.AUTOMATION_MANAGE
  ),
  { requiresAuth: true }
);