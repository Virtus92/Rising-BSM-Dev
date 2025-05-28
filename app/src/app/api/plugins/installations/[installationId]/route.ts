import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { withAuth } from '@/features/auth/middleware';
import { getPluginInstallationService } from '@/core/factories/index.server';
import { getLogger } from '@/core/logging';

export const runtime = 'nodejs';

// GET /api/plugins/installations/[installationId] - Get installation details
export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ installationId: string }> }
  ) => {
    const logger = getLogger();
    try {
      const { installationId } = await params;
      
      const installationService = getPluginInstallationService();
      const installation = await installationService.getInstallation(installationId);

      if (!installation) {
        return NextResponse.json(
          formatResponse.error('Installation not found', 404),
          { status: 404 }
        );
      }

      // Verify user owns this installation
      const userId = (request as any).auth?.userId;
      if (installation.userId !== userId) {
        return NextResponse.json(
          formatResponse.error('Unauthorized', 403),
          { status: 403 }
        );
      }

      return NextResponse.json(
        formatResponse.success(installation, 'Installation retrieved successfully'),
        { status: 200 }
      );
    } catch (error: any) {
      logger.error('Error retrieving installation:', error);
      return NextResponse.json(
        formatResponse.error(error instanceof Error ? error.message : 'Failed to retrieve installation', 500),
        { status: 500 }
      );
    }
  },
  {
    requiredPermission: ['plugin.install.view']
  }
);

// PATCH /api/plugins/installations/[installationId] - Update installation (activate/deactivate)
export const PATCH = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ installationId: string }> }
  ) => {
    const logger = getLogger();
    try {
      const { installationId } = await params;
      const body = await request.json();
      const { action } = body;
      
      if (!['activate', 'deactivate'].includes(action)) {
        return NextResponse.json(
          formatResponse.error('Invalid action. Must be "activate" or "deactivate"', 400),
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

      if (action === 'activate') {
        await installationService.activatePlugin(installationId, userId);
      } else {
        await installationService.deactivatePlugin(installationId, userId);
      }

      return NextResponse.json(
        formatResponse.success(null, `Plugin ${action}d successfully`),
        { status: 200 }
      );
    } catch (error: any) {
      logger.error('Error updating plugin installation:', error);
      return NextResponse.json(
        formatResponse.error(error instanceof Error ? error.message : 'Failed to update installation', 500),
        { status: 500 }
      );
    }
  },
  {
    requiredPermission: ['plugin.install.update']
  }
);

// DELETE /api/plugins/installations/[installationId] - Uninstall plugin
export const DELETE = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ installationId: string }> }
  ) => {
    const logger = getLogger();
    try {
      const { installationId } = await params;
      const userId = (request as any).auth?.userId;
      if (!userId) {
        return NextResponse.json(
          formatResponse.error('User ID not found in auth context', 401),
          { status: 401 }
        );
      }
      
      const installationService = getPluginInstallationService();
      await installationService.uninstallPlugin(installationId, userId);

      return NextResponse.json(
        formatResponse.success(null, 'Plugin uninstalled successfully'),
        { status: 200 }
      );
    } catch (error: any) {
      logger.error('Error uninstalling plugin:', error);
      return NextResponse.json(
        formatResponse.error(error instanceof Error ? error.message : 'Failed to uninstall plugin', 500),
        { status: 500 }
      );
    }
  },
  {
    requiredPermission: ['plugin.install.delete']
  }
);