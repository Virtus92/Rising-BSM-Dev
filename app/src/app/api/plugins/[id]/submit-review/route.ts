/**
 * Plugin Submit for Review API Route
 * 
 * POST /api/plugins/[pluginId]/submit-review - Submit plugin for review
 */

import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getPluginService } from '@/core/factories/serviceFactory.server';
import { LoggingService } from '@/core/logging/LoggingService';

export const runtime = 'nodejs';

const logger = new LoggingService();

// POST /api/plugins/[pluginId]/submit-review - Submit plugin for review
export const POST = routeHandler(async (req: NextRequest, context: any) => {
  try {
    const params = await context.params;
    const pluginId = parseInt(params.pluginId as string);
    
    logger.info(`POST /api/plugins/${pluginId}/submit-review - Submitting plugin for review`);
    
    if (isNaN(pluginId)) {
      return formatResponse.badRequest('Invalid plugin ID');
    }
    
    // Get user ID from authenticated context
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId) {
      return formatResponse.unauthorized('User not authenticated');
    }
    
    const service = getPluginService();
    await service.submitForReview(pluginId, userId);
    
    return formatResponse.success(null, 'Plugin submitted for review');
  } catch (error) {
    logger.error('Error submitting plugin for review', { error });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to submit plugin for review';
    
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.create']
});