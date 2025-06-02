/**
 * Plugin Installation Heartbeat API Route
 * 
 * POST /api/plugins/installations/[id]/heartbeat - Update heartbeat
 */

import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getPluginInstallationService } from '@/core/factories/serviceFactory.server';
import { LoggingService } from '@/core/logging/LoggingService';

export const runtime = 'nodejs';

const logger = new LoggingService();

// POST /api/plugins/installations/[id]/heartbeat - Update heartbeat
export const POST = routeHandler(async (req: NextRequest, context: any) => {
  try {
    const params = await context.params;
    const { id: installationId } = params;
    
    logger.info(`POST /api/plugins/installations/${installationId}/heartbeat - Updating heartbeat`);
    
    const installationService = getPluginInstallationService();
    
    // Verify installation exists and user owns it
    const installation = await installationService.getInstallation(installationId);
    if (!installation) {
      return formatResponse.notFound('Installation not found');
    }

    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId || installation.userId !== userId) {
      return formatResponse.forbidden('Unauthorized access to this installation');
    }

    await installationService.updateHeartbeat(installationId);

    return formatResponse.success({
      installationId,
      lastHeartbeat: new Date()
    }, 'Heartbeat updated successfully');
  } catch (error) {
    logger.error('Error updating heartbeat', { error });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to update heartbeat';
    
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.install.update']
});