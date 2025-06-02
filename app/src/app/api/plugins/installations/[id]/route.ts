/**
 * Plugin Installation API Routes - Single Installation Operations
 * 
 * GET /api/plugins/installations/[id] - Get installation details
 * PATCH /api/plugins/installations/[id] - Update installation (activate/deactivate)
 * DELETE /api/plugins/installations/[id] - Uninstall plugin
 */

import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getPluginInstallationService } from '@/core/factories/serviceFactory.server';
import { LoggingService } from '@/core/logging/LoggingService';
import { z } from 'zod';

export const runtime = 'nodejs';

const logger = new LoggingService();

// GET /api/plugins/installations/[id] - Get installation details
export const GET = routeHandler(async (req: NextRequest, context: any) => {
  try {
    const params = await context.params;
    const { id: installationId } = params;
    
    logger.info(`GET /api/plugins/installations/${installationId} - Getting installation details`);
    
    const installationService = getPluginInstallationService();
    const installation = await installationService.getInstallation(installationId);

    if (!installation) {
      return formatResponse.notFound('Installation not found');
    }

    // Verify user owns this installation
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (installation.userId !== userId) {
      return formatResponse.forbidden('Unauthorized access to this installation');
    }

    return formatResponse.success(installation, 'Installation retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving installation', { error });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to retrieve installation';
    
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.install.view']
});

const updateSchema = z.object({
  action: z.enum(['activate', 'deactivate'])
});

// PATCH /api/plugins/installations/[id] - Update installation (activate/deactivate)
export const PATCH = routeHandler(async (req: NextRequest, context: any) => {
  try {
    const params = await context.params;
    const { id: installationId } = params;
    
    logger.info(`PATCH /api/plugins/installations/${installationId} - Updating installation`);
    
    const body = await req.json();
    const validated = updateSchema.parse(body);
    
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId) {
      return formatResponse.unauthorized('User not authenticated');
    }

    const installationService = getPluginInstallationService();

    if (validated.action === 'activate') {
      await installationService.activatePlugin(installationId, userId);
    } else {
      await installationService.deactivatePlugin(installationId, userId);
    }

    return formatResponse.success(null, `Plugin ${validated.action}d successfully`);
  } catch (error) {
    logger.error('Error updating plugin installation', { error });
    
    if (error instanceof z.ZodError) {
      return formatResponse.validationError(error.flatten().fieldErrors);
    }
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to update installation';
    
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.install.update']
});

// DELETE /api/plugins/installations/[id] - Uninstall plugin
export const DELETE = routeHandler(async (req: NextRequest, context: any) => {
  try {
    const params = await context.params;
    const { id: installationId } = params;
    
    logger.info(`DELETE /api/plugins/installations/${installationId} - Uninstalling plugin`);
    
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId) {
      return formatResponse.unauthorized('User not authenticated');
    }
    
    const installationService = getPluginInstallationService();
    await installationService.uninstallPlugin(installationId, userId);

    return formatResponse.success(null, 'Plugin uninstalled successfully');
  } catch (error) {
    logger.error('Error uninstalling plugin', { error });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to uninstall plugin';
    
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.install.delete']
});