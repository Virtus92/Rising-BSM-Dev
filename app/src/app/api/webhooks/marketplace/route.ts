/**
 * Marketplace Webhook Handler
 * POST /api/webhooks/marketplace
 * 
 * Receives webhook events from dinel.at marketplace
 */

import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { marketplaceConnector } from '@/features/plugins/lib/marketplace/MarketplaceConnector';
import { getPluginLicenseService, getPluginService } from '@/core/factories/serviceFactory.server';
import { LoggingService } from '@/core/logging/LoggingService';

export const runtime = 'nodejs';

const logger = new LoggingService();

export async function POST(req: NextRequest) {
  try {
    // Check if marketplace is configured
    if (!marketplaceConnector || !marketplaceConnector.isMarketplaceConfigured()) {
      logger.warn('Marketplace webhook received but marketplace is not configured');
      return formatResponse.serviceUnavailable('Marketplace integration not configured');
    }
    
    // Get webhook signature from headers
    const signature = req.headers.get('X-Marketplace-Signature');
    if (!signature) {
      logger.error('Marketplace webhook missing signature');
      return formatResponse.unauthorized('Missing signature');
    }
    
    // Parse webhook payload
    const payload = await req.json();
    logger.info('Marketplace webhook received', { event: payload.event });
    
    // Verify webhook signature
    try {
      await marketplaceConnector.processWebhook(signature, payload);
    } catch (error) {
      logger.error('Marketplace webhook verification failed', error as Error);
      return formatResponse.unauthorized('Invalid signature');
    }
    
    // Process webhook events
    switch (payload.event) {
      case 'license.created':
        await handleLicenseCreated(payload.data);
        break;
        
      case 'license.updated':
        await handleLicenseUpdated(payload.data);
        break;
        
      case 'license.revoked':
        await handleLicenseRevoked(payload.data);
        break;
        
      case 'plugin.downloaded':
        await handlePluginDownloaded(payload.data);
        break;
        
      case 'plugin.reviewed':
        await handlePluginReviewed(payload.data);
        break;
        
      case 'plugin.suspended':
        await handlePluginSuspended(payload.data);
        break;
        
      case 'payment.completed':
        await handlePaymentCompleted(payload.data);
        break;
        
      default:
        logger.warn(`Unknown marketplace webhook event: ${payload.event}`);
    }
    
    return formatResponse.success({ received: true });
  } catch (error) {
    logger.error('Error processing marketplace webhook', error as Error);
    
    // Return success to avoid webhook retries for processing errors
    return formatResponse.success({ received: true, error: true });
  }
}

// Webhook event handlers

async function handleLicenseCreated(data: any) {
  try {
    const licenseService = getPluginLicenseService();
    
    // Find local plugin by marketplace ID
    const pluginService = getPluginService();
    const plugins = await pluginService.findByCriteria({ marketplaceId: data.pluginId });
    const plugin = plugins[0];
    
    if (!plugin) {
      logger.warn(`Plugin not found for marketplace ID: ${data.pluginId}`);
      return;
    }
    
    // Create local license reference
    await licenseService.generateLicense(
      plugin.id!,
      parseInt(data.userId),
      data.type,
      {
        licenseKey: data.licenseKey,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        hardwareId: data.hardwareId,
        maxInstalls: data.maxInstalls,
        marketplaceLicenseId: data.id
      }
    );
    
    logger.info(`License created locally for marketplace license ${data.id}`);
  } catch (error) {
    logger.error('Error handling license.created webhook', error as Error);
  }
}

async function handleLicenseUpdated(data: any) {
  try {
    const licenseService = getPluginLicenseService();
    const license = await licenseService.getLicenseByKey(data.licenseKey);
    
    if (!license) {
      logger.warn(`License not found for key: ${data.licenseKey}`);
      return;
    }
    
    // Update local license
    await licenseService.updateLicense(license.id!, {
      status: data.status,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      maxInstalls: data.maxInstalls,
      currentInstalls: data.currentInstalls
    });
    
    logger.info(`License updated locally: ${data.licenseKey}`);
  } catch (error) {
    logger.error('Error handling license.updated webhook', error as Error);
  }
}

async function handleLicenseRevoked(data: any) {
  try {
    const licenseService = getPluginLicenseService();
    await licenseService.revokeLicense(data.licenseKey, 'Revoked by marketplace');
    
    logger.info(`License revoked locally: ${data.licenseKey}`);
  } catch (error) {
    logger.error('Error handling license.revoked webhook', error as Error);
  }
}

async function handlePluginDownloaded(data: any) {
  try {
    const pluginService = getPluginService();
    const plugins = await pluginService.findByCriteria({ marketplaceId: data.pluginId });
    const plugin = plugins[0];
    
    if (!plugin) {
      logger.warn(`Plugin not found for marketplace ID: ${data.pluginId}`);
      return;
    }
    
    // Update download count
    await pluginService.incrementDownloads(plugin.id!);
    
    logger.info(`Plugin download recorded: ${plugin.name}`);
  } catch (error) {
    logger.error('Error handling plugin.downloaded webhook', error as Error);
  }
}

async function handlePluginReviewed(data: any) {
  try {
    const pluginService = getPluginService();
    const plugins = await pluginService.findByCriteria({ marketplaceId: data.pluginId });
    const plugin = plugins[0];
    
    if (!plugin) {
      logger.warn(`Plugin not found for marketplace ID: ${data.pluginId}`);
      return;
    }
    
    // Update plugin rating
    await pluginService.update(plugin.id!, {
      rating: data.averageRating
    });
    
    logger.info(`Plugin rating updated: ${plugin.name} -> ${data.averageRating}`);
  } catch (error) {
    logger.error('Error handling plugin.reviewed webhook', error as Error);
  }
}

async function handlePluginSuspended(data: any) {
  try {
    const pluginService = getPluginService();
    const plugins = await pluginService.findByCriteria({ marketplaceId: data.pluginId });
    const plugin = plugins[0];
    
    if (!plugin) {
      logger.warn(`Plugin not found for marketplace ID: ${data.pluginId}`);
      return;
    }
    
    // Suspend plugin locally
    await pluginService.suspendPlugin(plugin.id!, 1, data.reason || 'Suspended by marketplace');
    
    logger.info(`Plugin suspended locally: ${plugin.name}`);
  } catch (error) {
    logger.error('Error handling plugin.suspended webhook', error as Error);
  }
}

async function handlePaymentCompleted(data: any) {
  try {
    // Handle payment completion
    // This could trigger license generation or other actions
    logger.info('Payment completed webhook received', data);
    
    // Implementation depends on your payment flow
  } catch (error) {
    logger.error('Error handling payment.completed webhook', error as Error);
  }
}
