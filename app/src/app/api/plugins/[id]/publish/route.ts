/**
 * Publish plugin to marketplace API route
 * POST /api/plugins/[id]/publish
 */

import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getPluginService } from '@/core/factories/serviceFactory.server';
import { LoggingService } from '@/core/logging/LoggingService';
import { marketplaceConnector } from '@/features/plugins/lib/marketplace/MarketplaceConnector';
import * as fs from 'fs/promises';
import * as path from 'path';

export const runtime = 'nodejs';

const logger = new LoggingService();

export const POST = routeHandler(async (req: NextRequest, { params }: { params: { pluginId: string } }) => {
  try {
    logger.info(`POST /api/plugins/${params.pluginId}/publish - Publishing plugin to marketplace`);
    
    const service = getPluginService();
    const pluginId = parseInt(params.pluginId);
    
    if (isNaN(pluginId)) {
      return formatResponse.badRequest('Invalid plugin ID');
    }
    
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId) {
      return formatResponse.unauthorized('User not authenticated');
    }
    
    // Get plugin details
    const plugin = await service.getById(pluginId);
    if (!plugin) {
      return formatResponse.notFound('Plugin not found');
    }
    
    // Check ownership
    if (plugin.authorId !== userId && !req.headers.get('X-Auth-Is-Admin')) {
      return formatResponse.forbidden('Not authorized to publish this plugin');
    }
    
    // Check plugin status
    if (plugin.status !== 'approved') {
      return formatResponse.badRequest('Plugin must be approved before publishing');
    }
    
    // Get plugin bundle
    const bundlePath = path.join(process.env.PLUGIN_STORAGE_PATH || '/app/storage/plugins', 'bundles', `${pluginId}.bundle`);
    let bundleData: Buffer;
    
    try {
      bundleData = await fs.readFile(bundlePath);
    } catch {
      return formatResponse.badRequest('Plugin bundle not found. Please upload the bundle first.');
    }
    
    // Check if marketplace is configured
    if (!marketplaceConnector || !marketplaceConnector.isMarketplaceConfigured()) {
      return formatResponse.serviceUnavailable(
        'Marketplace integration is not configured. Please set MARKETPLACE_API_KEY and MARKETPLACE_API_SECRET environment variables.'
      );
    }
    
    // Publish to marketplace
    const marketplacePlugin = await marketplaceConnector.publishPlugin(
      plugin as any, // Convert DTO to entity format
      bundleData,
      {
        changelog: req.headers.get('X-Plugin-Changelog') || undefined,
        releaseNotes: req.headers.get('X-Plugin-Release-Notes') || undefined
      }
    );
    
    // Update plugin with marketplace ID
    await service.update(pluginId, {
      marketplaceId: marketplacePlugin.id
    });
    
    return formatResponse.success({
      ...plugin,
      marketplaceId: marketplacePlugin.id,
      marketplaceUrl: `https://dinel.at/plugins/${marketplacePlugin.id}`
    }, 'Plugin published to marketplace successfully');
  } catch (error) {
    logger.error('Error publishing plugin', { error });
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to publish plugin';
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.publish']
});
