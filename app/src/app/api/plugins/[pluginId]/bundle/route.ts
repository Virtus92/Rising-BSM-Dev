import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { withAuth } from '@/features/auth/middleware';
import { getPluginService, getPluginInstallationService } from '@/core/factories/index.server';
import { getLogger } from '@/core/logging';

export const runtime = 'nodejs';

// POST /api/plugins/[pluginId]/bundle - Upload plugin bundle
export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ pluginId: string }> }
  ) => {
    const logger = getLogger();
    try {
      const { pluginId } = await params;
      const id = parseInt(pluginId);
      
      if (isNaN(id)) {
        return NextResponse.json(
          formatResponse.error('Invalid plugin ID', 400),
          { status: 400 }
        );
      }

      // Get the uploaded file
      const formData = await request.formData();
      const file = formData.get('bundle') as File;
      
      if (!file) {
        return NextResponse.json(
          formatResponse.error('No bundle file provided', 400),
          { status: 400 }
        );
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          formatResponse.error('Bundle file too large (max 50MB)', 400),
          { status: 400 }
        );
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const bundle = Buffer.from(arrayBuffer);

      const userId = (request as any).auth?.userId;
      if (!userId) {
        return NextResponse.json(
          formatResponse.error('User ID not found in auth context', 401),
          { status: 401 }
        );
      }

      const pluginService = getPluginService();
      const signature = await pluginService.uploadPluginBundle(id, bundle, userId);

      return NextResponse.json(
        formatResponse.success({
          signature,
          size: file.size,
          filename: file.name
        }, 'Bundle uploaded successfully'),
        { status: 200 }
      );
    } catch (error: any) {
      logger.error('Error uploading plugin bundle:', error);
      return NextResponse.json(
        formatResponse.error(error instanceof Error ? error.message : 'Failed to upload plugin bundle', 500),
        { status: 500 }
      );
    }
  },
  {
    requiredPermission: ['plugin.update']
  }
);

// GET /api/plugins/[pluginId]/bundle - Download plugin bundle (for installations)
export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ pluginId: string }> }
  ) => {
    const logger = getLogger();
    try {
      const { pluginId } = await params;
      const id = parseInt(pluginId);
      const installationId = request.nextUrl.searchParams.get('installationId');
      
      if (isNaN(id)) {
        return NextResponse.json(
          formatResponse.error('Invalid plugin ID', 400),
          { status: 400 }
        );
      }

      if (!installationId) {
        return NextResponse.json(
          formatResponse.error('Installation ID required', 400),
          { status: 400 }
        );
      }

      const userId = (request as any).auth?.userId;
      if (!userId) {
        return NextResponse.json(
          formatResponse.error('User ID not found in auth context', 401),
          { status: 401 }
        );
      }

      const installationService = getPluginInstallationService();
      
      // This will verify the user owns the installation and return encrypted bundle
      const encryptedBundle = await installationService.getEncryptedBundle(installationId, userId);

      // Return as binary response
      return new NextResponse(encryptedBundle, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="plugin-${id}.bundle"`
        }
      });
    } catch (error: any) {
      logger.error('Error downloading plugin bundle:', error);
      return NextResponse.json(
        formatResponse.error(error instanceof Error ? error.message : 'Failed to download plugin bundle', 500),
        { status: 500 }
      );
    }
  },
  {
    requiredPermission: ['plugin.install']
  }
);