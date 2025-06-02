/**
 * Plugin Versions API Route
 * 
 * GET /api/plugins/[pluginId]/versions - Get available versions for a plugin
 */

import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getPluginService } from '@/core/factories/serviceFactory.server';
import { LoggingService } from '@/core/logging/LoggingService';

export const runtime = 'nodejs';

const logger = new LoggingService();

// GET /api/plugins/[pluginId]/versions - Get available versions for a plugin
export const GET = routeHandler(async (req: NextRequest, context: any) => {
  try {
    const params = await context.params;
    const pluginId = parseInt(params.pluginId as string);
    
    logger.info(`GET /api/plugins/${pluginId}/versions - Getting plugin versions`);
    
    if (isNaN(pluginId)) {
      return formatResponse.badRequest('Invalid plugin ID');
    }
    
    const service = getPluginService();
    
    // Get plugin to verify it exists
    const plugin = await service.getById(pluginId);
    if (!plugin) {
      return formatResponse.notFound('Plugin not found');
    }
    
    // TODO: Implement version history tracking
    // For now, return the current version
    const versions = [{
      version: plugin.version,
      releaseDate: plugin.updatedAt,
      changes: 'Current version',
      downloads: plugin.downloads || 0
    }];
    
    return formatResponse.success({
      pluginId: pluginId,
      versions,
      latest: plugin.version,
      count: versions.length
    });
  } catch (error) {
    logger.error('Error getting plugin versions', { error });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to get plugin versions';
    
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.view']
});