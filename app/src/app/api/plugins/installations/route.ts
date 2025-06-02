/**
 * Plugin Installation API Routes
 * 
 * GET /api/plugins/installations - List user installations
 * POST /api/plugins/installations - Install plugin
 */

import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getPluginInstallationService, getPluginLicenseService } from '@/core/factories/serviceFactory.server';
import { LoggingService } from '@/core/logging/LoggingService';
import { z } from 'zod';

export const runtime = 'nodejs';

const logger = new LoggingService();

// GET /api/plugins/installations - List user installations
export const GET = routeHandler(async (req: NextRequest) => {
  try {
    logger.info('GET /api/plugins/installations - Getting user installations');
    
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId) {
      return formatResponse.unauthorized('User not authenticated');
    }
    
    const service = getPluginInstallationService();
    const installations = await service.getInstallationsByUser(userId);
    
    return formatResponse.success(installations);
  } catch (error) {
    logger.error('Error getting installations', { error });
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to get installations';
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.install']
});

const installPluginSchema = z.object({
  pluginId: z.number(),
  licenseKey: z.string(),
  hardwareId: z.string()
});

// POST /api/plugins/installations - Install plugin
export const POST = routeHandler(async (req: NextRequest) => {
  try {
    logger.info('POST /api/plugins/installations - Installing plugin');
    
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId) {
      return formatResponse.unauthorized('User not authenticated');
    }
    
    const body = await req.json();
    const validated = installPluginSchema.parse(body);
    
    // Verify license ownership
    const licenseService = getPluginLicenseService();
    const license = await licenseService.getLicenseByKey(validated.licenseKey);
    
    if (!license) {
      return formatResponse.notFound('License not found');
    }
    
    if (license.userId !== userId) {
      return formatResponse.forbidden('License belongs to another user');
    }
    
    if (license.pluginId !== validated.pluginId) {
      return formatResponse.badRequest('License is for a different plugin');
    }
    
    // Install plugin
    const service = getPluginInstallationService();
    const installation = await service.installPlugin(
      validated.pluginId,
      license.id!,
      userId,
      validated.hardwareId
    );
    
    return formatResponse.success(installation, 'Plugin installed successfully');
  } catch (error) {
    logger.error('Error installing plugin', { error });
    
    if (error instanceof z.ZodError) {
      return formatResponse.validationError(error.flatten().fieldErrors);
    }
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to install plugin';
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.install']
});
