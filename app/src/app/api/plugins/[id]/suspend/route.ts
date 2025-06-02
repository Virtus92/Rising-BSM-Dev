/**
 * Plugin Suspend API Route
 * 
 * POST /api/plugins/[pluginId]/suspend - Suspend a plugin
 */

import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getPluginService } from '@/core/factories/serviceFactory.server';
import { LoggingService } from '@/core/logging/LoggingService';
import { z } from 'zod';

export const runtime = 'nodejs';

const logger = new LoggingService();

const suspendSchema = z.object({
  reason: z.string().min(1, 'Suspension reason is required')
});

// POST /api/plugins/[pluginId]/suspend - Suspend a plugin
export const POST = routeHandler(async (req: NextRequest, context: any) => {
  try {
    const params = await context.params;
    const pluginId = parseInt(params.pluginId as string);
    
    logger.info(`POST /api/plugins/${pluginId}/suspend - Suspending plugin`);
    
    if (isNaN(pluginId)) {
      return formatResponse.badRequest('Invalid plugin ID');
    }
    
    const body = await req.json();
    
    // Validate request body
    const validated = suspendSchema.parse(body);
    
    // Get user ID from authenticated context
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId) {
      return formatResponse.unauthorized('User not authenticated');
    }
    
    const service = getPluginService();
    await service.suspendPlugin(pluginId, userId, validated.reason);
    
    return formatResponse.success(null, 'Plugin suspended');
  } catch (error) {
    logger.error('Error suspending plugin', { error });
    
    if (error instanceof z.ZodError) {
      return formatResponse.validationError(error.flatten().fieldErrors);
    }
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to suspend plugin';
    
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.approve']
});