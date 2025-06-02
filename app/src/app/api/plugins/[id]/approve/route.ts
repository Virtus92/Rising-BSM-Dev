/**
 * Approve plugin API route
 * POST /api/plugins/[id]/approve
 */

import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getPluginService } from '@/core/factories/serviceFactory.server';
import { LoggingService } from '@/core/logging/LoggingService';

export const runtime = 'nodejs';

const logger = new LoggingService();

export const POST = routeHandler(async (req: NextRequest, { params }: { params: { pluginId: string } }) => {
  try {
    logger.info(`POST /api/plugins/${params.pluginId}/approve - Approving plugin`);
    
    const service = getPluginService();
    const pluginId = parseInt(params.pluginId);
    
    if (isNaN(pluginId)) {
      return formatResponse.badRequest('Invalid plugin ID');
    }
    
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId) {
      return formatResponse.unauthorized('User not authenticated');
    }
    
    await service.approvePlugin(pluginId, userId);
    
    const plugin = await service.getById(pluginId);
    return formatResponse.success(plugin, 'Plugin approved successfully');
  } catch (error) {
    logger.error('Error approving plugin', { error });
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to approve plugin';
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.approve']
});
