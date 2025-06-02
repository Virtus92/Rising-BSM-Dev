/**
 * Plugin Detail API Routes
 * 
 * GET /api/plugins/[id] - Get plugin details
 * PUT /api/plugins/[id] - Update plugin
 * DELETE /api/plugins/[id] - Delete plugin
 */

import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getPluginService } from '@/core/factories/serviceFactory.server';
import { LoggingService } from '@/core/logging/LoggingService';
import { z } from 'zod';
import { marketplaceConnector } from '@/features/plugins/lib/marketplace/MarketplaceConnector';

export const runtime = 'nodejs';

const logger = new LoggingService();

// GET /api/plugins/[id] - Get plugin details
export const GET = routeHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    logger.info(`GET /api/plugins/${params.id} - Getting plugin details`);
    
    const service = getPluginService();
    const pluginId = parseInt(params.id);
    
    if (isNaN(pluginId)) {
      return formatResponse.badRequest('Invalid plugin ID');
    }
    
    const plugin = await service.getById(pluginId);
    
    if (!plugin) {
      return formatResponse.notFound('Plugin not found');
    }
    
    // If plugin is published, get additional data from marketplace
    if (plugin.status === 'approved' && plugin.marketplaceId) {
      try {
        const marketplaceData = await marketplaceConnector.getPlugin(plugin.marketplaceId);
        plugin.downloads = marketplaceData.downloads;
        plugin.rating = marketplaceData.rating;
      } catch (error) {
        logger.warn('Failed to fetch marketplace data', error as Error);
      }
    }
    
    return formatResponse.success(plugin);
  } catch (error) {
    logger.error('Error getting plugin', { error });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to get plugin';
    
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.view']
});

const updatePluginSchema = z.object({
  displayName: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  icon: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  permissions: z.array(z.object({
    code: z.string(),
    name: z.string().optional(),
    description: z.string(),
    required: z.boolean().optional()
  })).optional(),
  dependencies: z.array(z.object({
    name: z.string(),
    version: z.string()
  })).optional(),
  minAppVersion: z.string().optional(),
  maxAppVersion: z.string().optional(),
  pricing: z.object({
    trial: z.number().optional(),
    basic: z.number().optional(),
    premium: z.number().optional(),
    enterprise: z.number().optional()
  }).optional(),
  trialDays: z.number().min(0).max(90).optional()
});

// PUT /api/plugins/[id] - Update plugin
export const PUT = routeHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    logger.info(`PUT /api/plugins/${params.id} - Updating plugin`);
    
    const service = getPluginService();
    const pluginId = parseInt(params.id);
    
    if (isNaN(pluginId)) {
      return formatResponse.badRequest('Invalid plugin ID');
    }
    
    const body = await req.json();
    const validated = updatePluginSchema.parse(body);
    
    // Get user ID from authenticated context
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId) {
      return formatResponse.unauthorized('User not authenticated');
    }
    
    // Update plugin
    const plugin = await service.updatePlugin(pluginId, validated, userId);
    
    // If plugin is published, update marketplace
    if (plugin.status === 'approved' && plugin.marketplaceId) {
      try {
        await marketplaceConnector.updatePlugin(plugin.marketplaceId, {
          displayName: plugin.displayName,
          description: plugin.description,
          category: plugin.category,
          tags: plugin.tags,
          icon: plugin.icon,
          screenshots: plugin.screenshots,
          pricing: plugin.pricing
        });
      } catch (error) {
        logger.error('Failed to update marketplace', error as Error);
      }
    }
    
    return formatResponse.success(plugin, 'Plugin updated successfully');
  } catch (error) {
    logger.error('Error updating plugin', { error });
    
    if (error instanceof z.ZodError) {
      return formatResponse.validationError(error.flatten().fieldErrors);
    }
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to update plugin';
    
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.update']
});

// DELETE /api/plugins/[id] - Delete plugin
export const DELETE = routeHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    logger.info(`DELETE /api/plugins/${params.id} - Deleting plugin`);
    
    const service = getPluginService();
    const pluginId = parseInt(params.id);
    
    if (isNaN(pluginId)) {
      return formatResponse.badRequest('Invalid plugin ID');
    }
    
    // Get user ID from authenticated context
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId) {
      return formatResponse.unauthorized('User not authenticated');
    }
    
    // Get plugin to check marketplace status
    const plugin = await service.getById(pluginId);
    if (!plugin) {
      return formatResponse.notFound('Plugin not found');
    }
    
    // Check ownership or admin
    if (plugin.authorId !== userId && !req.headers.get('X-Auth-Is-Admin')) {
      return formatResponse.forbidden('Not authorized to delete this plugin');
    }
    
    // If plugin is in marketplace, remove it
    if (plugin.marketplaceId) {
      try {
        await marketplaceConnector.deletePlugin(plugin.marketplaceId);
      } catch (error) {
        logger.error('Failed to delete from marketplace', error as Error);
      }
    }
    
    // Delete plugin
    const deleted = await service.delete(pluginId);
    
    if (!deleted) {
      return formatResponse.error('Failed to delete plugin', 500);
    }
    
    return formatResponse.success(null, 'Plugin deleted successfully');
  } catch (error) {
    logger.error('Error deleting plugin', { error });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to delete plugin';
    
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.delete']
});
