/**
 * Plugin License API Routes
 * 
 * GET /api/plugins/licenses - Get user's licenses
 * POST /api/plugins/licenses - Generate new license
 */

import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getPluginLicenseService } from '@/core/factories/serviceFactory.server';
import { LoggingService } from '@/core/logging/LoggingService';
import { marketplaceConnector } from '@/features/plugins/lib/marketplace/MarketplaceConnector';
import { z } from 'zod';

export const runtime = 'nodejs';

const logger = new LoggingService();

// GET /api/plugins/licenses - Get user's licenses
export const GET = routeHandler(async (req: NextRequest) => {
  try {
    logger.info('GET /api/plugins/licenses - Getting user licenses');
    
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId) {
      return formatResponse.unauthorized('User not authenticated');
    }
    
    // Get user ID from query params if admin
    const searchParams = new URL(req.url).searchParams;
    const targetUserId = searchParams.get('userId');
    const isAdmin = req.headers.get('X-Auth-Is-Admin') === 'true';
    
    let finalUserId = userId;
    if (targetUserId && isAdmin) {
      finalUserId = parseInt(targetUserId);
      if (isNaN(finalUserId)) {
        return formatResponse.badRequest('Invalid user ID');
      }
    }
    
    // Get licenses from marketplace if configured
    let marketplaceLicenses: any[] = [];
    if (marketplaceConnector && marketplaceConnector.isMarketplaceConfigured()) {
      try {
        marketplaceLicenses = await marketplaceConnector.getUserLicenses(finalUserId.toString());
      } catch (error) {
        logger.warn('Failed to fetch marketplace licenses', { error });
        // Continue with local licenses only
      }
    }
    
    // Get local licenses
    const service = getPluginLicenseService();
    const localLicenses = await service.getLicensesByUser(finalUserId);
    
    // Merge licenses (marketplace takes precedence)
    const licenseMap = new Map();
    
    // Add local licenses first
    localLicenses.forEach(license => {
      licenseMap.set(license.licenseKey, license);
    });
    
    // Override with marketplace licenses
    marketplaceLicenses.forEach(license => {
      licenseMap.set(license.licenseKey, {
        id: parseInt(license.id),
        licenseKey: license.licenseKey,
        pluginId: parseInt(license.pluginId),
        userId: parseInt(license.userId),
        type: license.type,
        status: license.status,
        expiresAt: license.expiresAt,
        hardwareId: license.hardwareId,
        maxInstalls: license.maxInstalls,
        currentInstalls: license.currentInstalls,
        isFromMarketplace: true
      });
    });
    
    const allLicenses = Array.from(licenseMap.values());
    
    return formatResponse.success(allLicenses);
  } catch (error) {
    logger.error('Error getting licenses', { error });
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to get licenses';
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.license.view']
});

const generateLicenseSchema = z.object({
  pluginId: z.number(),
  type: z.enum(['trial', 'basic', 'premium', 'enterprise']),
  userId: z.number().optional(),
  expiresAt: z.string().datetime().optional(),
  hardwareId: z.string().optional(),
  maxInstalls: z.number().min(1).default(1)
});

// POST /api/plugins/licenses - Generate new license
export const POST = routeHandler(async (req: NextRequest) => {
  try {
    logger.info('POST /api/plugins/licenses - Generating license');
    
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId) {
      return formatResponse.unauthorized('User not authenticated');
    }
    
    const body = await req.json();
    const validated = generateLicenseSchema.parse(body);
    
    // Use target user ID if provided and user is admin
    const isAdmin = req.headers.get('X-Auth-Is-Admin') === 'true';
    const targetUserId = validated.userId || userId;
    
    if (targetUserId !== userId && !isAdmin) {
      return formatResponse.forbidden('Not authorized to generate license for another user');
    }
    
    // Check if plugin uses marketplace
    const service = getPluginLicenseService();
    const pluginService = (await import('@/core/factories/serviceFactory.server')).getPluginService();
    const plugin = await pluginService.getById(validated.pluginId);
    
    if (!plugin) {
      return formatResponse.notFound('Plugin not found');
    }
    
    // Generate license through marketplace if plugin is published there and marketplace is configured
    if (plugin.marketplaceId && marketplaceConnector && marketplaceConnector.isMarketplaceConfigured()) {
      const marketplaceLicense = await marketplaceConnector.generateLicense({
        pluginId: plugin.marketplaceId,
        userId: targetUserId.toString(),
        type: validated.type,
        expiresAt: validated.expiresAt,
        hardwareId: validated.hardwareId,
        maxInstalls: validated.maxInstalls
      });
      
      // Save reference locally
      const localLicense = await service.generateLicense(
        validated.pluginId,
        targetUserId,
        validated.type,
        {
          expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
          hardwareId: validated.hardwareId,
          maxInstalls: validated.maxInstalls,
          marketplaceLicenseId: marketplaceLicense.id
        }
      );
      
      return formatResponse.success({
        ...localLicense,
        marketplaceLicenseId: marketplaceLicense.id
      }, 'License generated successfully');
    }
    
    // Generate local license for non-marketplace plugins
    const license = await service.generateLicense(
      validated.pluginId,
      targetUserId,
      validated.type,
      {
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
        hardwareId: validated.hardwareId,
        maxInstalls: validated.maxInstalls
      }
    );
    
    return formatResponse.success(license, 'License generated successfully');
  } catch (error) {
    logger.error('Error generating license', { error });
    
    if (error instanceof z.ZodError) {
      return formatResponse.validationError(error.flatten().fieldErrors);
    }
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to generate license';
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.license.create']
});
