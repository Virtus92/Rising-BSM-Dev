/**
 * Plugin bundle API routes
 * POST /api/plugins/[id]/bundle - Upload plugin bundle
 * GET /api/plugins/[id]/bundle - Download plugin bundle
 */

import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getPluginService, getPluginLicenseService } from '@/core/factories/serviceFactory.server';
import { LoggingService } from '@/core/logging/LoggingService';
import { marketplaceConnector } from '@/features/plugins/lib/marketplace/MarketplaceConnector';
import * as path from 'path';
import * as fs from 'fs/promises';

export const runtime = 'nodejs';

const logger = new LoggingService();

// POST /api/plugins/[id]/bundle - Upload plugin bundle
export const POST = routeHandler(async (req: NextRequest, { params }: { params: { pluginId: string } }) => {
  try {
    logger.info(`POST /api/plugins/${params.pluginId}/bundle - Uploading plugin bundle`);
    
    const service = getPluginService();
    const pluginId = parseInt(params.pluginId);
    
    if (isNaN(pluginId)) {
      return formatResponse.badRequest('Invalid plugin ID');
    }
    
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId) {
      return formatResponse.unauthorized('User not authenticated');
    }
    
    // Get plugin to check ownership
    const plugin = await service.getById(pluginId);
    if (!plugin) {
      return formatResponse.notFound('Plugin not found');
    }
    
    if (plugin.authorId !== userId) {
      return formatResponse.forbidden('Not authorized to upload bundle for this plugin');
    }
    
    // Get bundle data from request
    const formData = await req.formData();
    const bundleFile = formData.get('bundle') as File;
    
    if (!bundleFile) {
      return formatResponse.badRequest('Bundle file is required');
    }
    
    // Validate file size (max 50MB)
    if (bundleFile.size > 50 * 1024 * 1024) {
      return formatResponse.badRequest('Bundle file too large. Maximum size is 50MB');
    }
    
    // Read bundle data
    const arrayBuffer = await bundleFile.arrayBuffer();
    const bundleData = Buffer.from(arrayBuffer);
    
    // Upload bundle and get signature
    const signature = await service.uploadPluginBundle(pluginId, bundleData, userId);
    
    return formatResponse.success({
      signature,
      checksum: plugin.checksum,
      size: bundleFile.size
    }, 'Plugin bundle uploaded successfully');
  } catch (error) {
    logger.error('Error uploading plugin bundle', { error });
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to upload plugin bundle';
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.create']
});

// GET /api/plugins/[id]/bundle - Download plugin bundle
export const GET = routeHandler(async (req: NextRequest, { params }: { params: { pluginId: string } }) => {
  try {
    logger.info(`GET /api/plugins/${params.pluginId}/bundle - Downloading plugin bundle`);
    
    const service = getPluginService();
    const licenseService = getPluginLicenseService();
    const pluginId = parseInt(params.pluginId);
    
    if (isNaN(pluginId)) {
      return formatResponse.badRequest('Invalid plugin ID');
    }
    
    // Get license key from query
    const licenseKey = new URL(req.url).searchParams.get('licenseKey');
    if (!licenseKey) {
      return formatResponse.badRequest('License key is required');
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
    
    // If plugin is in marketplace, download from there
    if (plugin.marketplaceId) {
      // Get hardware ID from headers
      const hardwareId = req.headers.get('X-Hardware-ID') || 'unknown';
      
      // Get download token from marketplace
      const downloadToken = await marketplaceConnector.getDownloadToken(
        plugin.marketplaceId,
        licenseKey,
        hardwareId
      );
      
      // Return redirect to marketplace download URL
      return new Response(null, {
        status: 302,
        headers: {
          'Location': downloadToken.url,
          'X-Download-Token': downloadToken.token,
          'X-Expires-At': downloadToken.expiresAt.toISOString()
        }
      });
    }
    
    // For local plugins, check license and serve file
    const license = await licenseService.getLicenseByKey(licenseKey);
    if (!license || license.pluginId !== pluginId) {
      return formatResponse.forbidden('Invalid license for this plugin');
    }
    
    if (license.userId !== userId) {
      return formatResponse.forbidden('License belongs to another user');
    }
    
    // Get bundle path
    const bundlePath = path.join(
      process.env.PLUGIN_STORAGE_PATH || '/app/storage/plugins',
      'bundles',
      `${pluginId}.bundle`
    );
    
    try {
      const bundleData = await fs.readFile(bundlePath);
      
      // Increment download count
      await service.incrementDownloads(pluginId);
      
      // Return bundle as download
      return new Response(bundleData, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${plugin.name}-${plugin.version}.bundle"`,
          'X-Plugin-Checksum': plugin.checksum,
          'X-Plugin-Version': plugin.version
        }
      });
    } catch {
      return formatResponse.notFound('Plugin bundle not found');
    }
  } catch (error) {
    logger.error('Error downloading plugin bundle', { error });
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to download plugin bundle';
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.download']
});
