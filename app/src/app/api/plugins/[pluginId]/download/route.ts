import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { routeHandler } from '@/core/api';
import { serviceFactory } from '@/core/factories';
import { z } from 'zod';

export const runtime = 'nodejs';

const downloadSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format'),
  licenseKey: z.string().optional()
});

/**
 * GET /api/plugins/[pluginId]/download
 * Download a plugin bundle
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pluginId: string }> }
) {
  return routeHandler(
    request,
    {
      requiredPermissions: ['plugins.download'],
      validationSchema: downloadSchema,
      isQuery: true
    },
    async ({ query, user }) => {
      const { pluginId } = await params;
      const { version, licenseKey } = query;

      const pluginService = await serviceFactory.getPluginService();
      const distributionService = await serviceFactory.getPluginDistributionService();

      // Verify plugin exists
      const plugin = await pluginService.findById(Number(pluginId));
      if (!plugin) {
        return NextResponse.json(
          formatResponse.error('Plugin not found', 404),
          { status: 404 }
        );
      }

      try {
        // Download bundle
        const bundle = await distributionService.downloadBundle(
          Number(pluginId),
          version,
          licenseKey
        );

        // Return bundle as JSON (in production, might stream as binary)
        return NextResponse.json(
          formatResponse.success(bundle),
          { status: 200 }
        );
      } catch (error) {
        return NextResponse.json(
          formatResponse.error(
            error instanceof Error ? error.message : 'Failed to download plugin',
            400
          ),
          { status: 400 }
        );
      }
    }
  );
}

/**
 * POST /api/plugins/[pluginId]/download/stream
 * Stream download a plugin bundle (for large files)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pluginId: string }> }
) {
  return routeHandler(
    request,
    {
      requiredPermissions: ['plugins.download'],
      validationSchema: downloadSchema
    },
    async ({ body, user }) => {
      const { pluginId } = await params;
      const { version, licenseKey } = body;

      const pluginService = await serviceFactory.getPluginService();
      const distributionService = await serviceFactory.getPluginDistributionService();

      // Verify plugin exists
      const plugin = await pluginService.findById(Number(pluginId));
      if (!plugin) {
        return NextResponse.json(
          formatResponse.error('Plugin not found', 404),
          { status: 404 }
        );
      }

      try {
        // Get bundle metadata
        const metadata = await distributionService.getBundleMetadata(
          Number(pluginId),
          version
        );

        if (!metadata) {
          return NextResponse.json(
            formatResponse.error('Bundle not found', 404),
            { status: 404 }
          );
        }

        // Create download URL (in production, might generate signed URL)
        const downloadUrl = metadata.cdnUrl || `/api/plugins/${pluginId}/bundle/${version}`;

        return NextResponse.json(
          formatResponse.success({
            downloadUrl,
            size: metadata.size,
            checksum: metadata.checksum,
            expiresIn: 3600 // 1 hour
          }),
          { status: 200 }
        );
      } catch (error) {
        return NextResponse.json(
          formatResponse.error(
            error instanceof Error ? error.message : 'Failed to get download URL',
            400
          ),
          { status: 400 }
        );
      }
    }
  );
}