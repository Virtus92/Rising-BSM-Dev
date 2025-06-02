/**
 * Reject plugin API route
 * POST /api/plugins/[id]/reject
 */

import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getPluginService } from '@/core/factories/serviceFactory.server';
import { LoggingService } from '@/core/logging/LoggingService';
import { z } from 'zod';

export const runtime = 'nodejs';

const logger = new LoggingService();

const rejectSchema = z.object({
  reason: z.string().min(10).max(500)
});

export const POST = routeHandler(async (req: NextRequest, { params }: { params: { pluginId: string } }) => {
  try {
    logger.info(`POST /api/plugins/${params.pluginId}/reject - Rejecting plugin`);
    
    const service = getPluginService();
    const pluginId = parseInt(params.pluginId);
    
    if (isNaN(pluginId)) {
      return formatResponse.badRequest('Invalid plugin ID');
    }
    
    const body = await req.json();
    const { reason } = rejectSchema.parse(body);
    
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId) {
      return formatResponse.unauthorized('User not authenticated');
    }
    
    await service.rejectPlugin(pluginId, userId, reason);
    
    const plugin = await service.getById(pluginId);
    return formatResponse.success(plugin, 'Plugin rejected');
  } catch (error) {
    logger.error('Error rejecting plugin', { error });
    
    if (error instanceof z.ZodError) {
      return formatResponse.validationError(error.flatten().fieldErrors);
    }
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to reject plugin';
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.approve']
});
