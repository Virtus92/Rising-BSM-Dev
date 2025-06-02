/**
 * Plugin License Verification API Route
 * POST /api/plugins/licenses/verify
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

const verifyLicenseSchema = z.object({
  licenseKey: z.string(),
  pluginId: z.number(),
  hardwareId: z.string(),
  timestamp: z.number().optional(),
  signature: z.string().optional()
});

export const POST = routeHandler(async (req: NextRequest) => {
  try {
    logger.info('POST /api/plugins/licenses/verify - Verifying license');
    
    const body = await req.json();
    const validated = verifyLicenseSchema.parse(body);
    
    // Get plugin to check if it uses marketplace
    const pluginService = (await import('@/core/factories/serviceFactory.server')).getPluginService();
    const plugin = await pluginService.getById(validated.pluginId);
    
    if (!plugin) {
      return formatResponse.notFound('Plugin not found');
    }
    
    // Verify through marketplace if plugin is published there
    if (plugin.marketplaceId) {
      const marketplaceResult = await marketplaceConnector.verifyLicense({
        licenseKey: validated.licenseKey,
        pluginId: plugin.marketplaceId,
        hardwareId: validated.hardwareId,
        timestamp: validated.timestamp || Date.now(),
        signature: validated.signature
      });
      
      if (marketplaceResult.valid && marketplaceResult.license) {
        // Update local license cache
        const service = getPluginLicenseService();
        try {
          await service.updateLastVerified(validated.licenseKey);
        } catch {
          // Ignore local update errors
        }
        
        return formatResponse.success({
          valid: true,
          license: {
            licenseKey: marketplaceResult.license.licenseKey,
            pluginId: validated.pluginId,
            userId: parseInt(marketplaceResult.license.userId),
            type: marketplaceResult.license.type,
            status: marketplaceResult.license.status,
            expiresAt: marketplaceResult.license.expiresAt,
            hardwareId: marketplaceResult.license.hardwareId,
            maxInstalls: marketplaceResult.license.maxInstalls,
            currentInstalls: marketplaceResult.license.currentInstalls
          },
          offline: false
        });
      }
      
      return formatResponse.success({
        valid: false,
        error: marketplaceResult.error || 'License verification failed',
        offline: false
      });
    }
    
    // Verify local license for non-marketplace plugins
    const service = getPluginLicenseService();
    const result = await service.verifyLicense({
      licenseKey: validated.licenseKey,
      pluginId: validated.pluginId,
      hardwareId: validated.hardwareId,
      timestamp: validated.timestamp,
      signature: validated.signature
    });
    
    return formatResponse.success(result);
  } catch (error) {
    logger.error('Error verifying license', { error });
    
    if (error instanceof z.ZodError) {
      return formatResponse.validationError(error.flatten().fieldErrors);
    }
    
    // Return offline verification response on error
    return formatResponse.success({
      valid: false,
      error: 'License verification service unavailable',
      offline: true
    });
  }
}, {
  // Public endpoint - no authentication required
  // But rate limited to prevent abuse
  rateLimit: {
    requests: 100,
    windowMs: 60000 // 1 minute
  }
});
