import { NextRequest } from 'next/server';
import { createRouteHandler } from '@/core/api/server/route-handler';
import { getPluginService, getPluginLicenseService } from '@/core/factories/serviceFactory.server';
import { AppError } from '@/core/errors';

// POST /api/plugins/[pluginId]/bundle - Upload plugin bundle
export const POST = createRouteHandler({
  requiredPermissions: ['plugin.create'],
  handler: async (req: NextRequest, context: any) => {
    const service = getPluginService();
    const pluginId = parseInt(context.params.pluginId as string);
    
    if (isNaN(pluginId)) {
      throw new AppError('Invalid plugin ID', 400);
    }
    
    // Get form data
    const formData = await req.formData();
    const bundleFile = formData.get('bundle') as File;
    
    if (!bundleFile) {
      throw new AppError('Bundle file is required', 400);
    }
    
    // Validate file type
    if (!bundleFile.name.endsWith('.bundle') && !bundleFile.name.endsWith('.zip')) {
      throw new AppError('Invalid bundle file format', 400);
    }
    
    // Convert to buffer
    const arrayBuffer = await bundleFile.arrayBuffer();
    const bundle = Buffer.from(arrayBuffer);
    
    // Upload bundle
    const signature = await service.uploadPluginBundle(
      pluginId,
      bundle,
      context.user.id
    );
    
    return {
      success: true,
      data: {
        signature,
        size: bundle.length,
        uploadedAt: new Date()
      }
    };
  }
});

// GET /api/plugins/[pluginId]/bundle - Download plugin bundle
export const GET = createRouteHandler({
  requiredPermissions: ['plugin.download'],
  handler: async (req: NextRequest, context: any) => {
    const pluginService = getPluginService();
    const licenseService = getPluginLicenseService();
    const pluginId = parseInt(context.params.pluginId as string);
    
    if (isNaN(pluginId)) {
      throw new AppError('Invalid plugin ID', 400);
    }
    
    // Get license key from query or header
    const searchParams = new URL(req.url).searchParams;
    const licenseKey = searchParams.get('licenseKey') || 
                      req.headers.get('X-License-Key');
    
    if (!licenseKey) {
      throw new AppError('License key is required', 400);
    }
    
    // Verify license
    const license = await licenseService.getLicenseByKey(licenseKey);
    if (!license || license.pluginId !== pluginId || license.status !== 'active') {
      throw new AppError('Invalid or inactive license', 403);
    }
    
    // Check if user owns the license
    if (license.userId !== context.user.id) {
      throw new AppError('License not owned by user', 403);
    }
    
    // Get plugin
    const plugin = await pluginService.getById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }
    
    // Increment download count
    await pluginService.incrementDownloads(pluginId);
    
    // TODO: Get actual bundle from storage
    // For now, return a placeholder response
    return new Response('Plugin bundle content would be here', {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${plugin.name}-${plugin.version}.bundle"`,
        'X-Plugin-Signature': plugin.checksum || '',
        'X-Plugin-Version': plugin.version
      }
    });
  }
});
