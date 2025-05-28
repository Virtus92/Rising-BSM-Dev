import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { withAuth } from '@/features/auth/middleware';
import { getPluginInstallationService } from '@/core/factories/index.server';
import { getLogger } from '@/core/logging';

export const runtime = 'nodejs';

// POST /api/plugins/installations/[installationId]/heartbeat - Update heartbeat
export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ installationId: string }> }
  ) => {
    const logger = getLogger();
    try {
      const { installationId } = await params;
      
      const installationService = getPluginInstallationService();
      
      // Verify installation exists and user owns it
      const installation = await installationService.getInstallation(installationId);
      if (!installation) {
        return NextResponse.json(
          formatResponse.error('Installation not found', 404),
          { status: 404 }
        );
      }

      const userId = (request as any).auth?.userId;
      if (!userId || installation.userId !== userId) {
        return NextResponse.json(
          formatResponse.error('Unauthorized', 403),
          { status: 403 }
        );
      }

      await installationService.updateHeartbeat(installationId);

      return NextResponse.json(
        formatResponse.success({
          installationId,
          lastHeartbeat: new Date()
        }, 'Heartbeat updated successfully'),
        { status: 200 }
      );
    } catch (error: any) {
      logger.error('Error updating heartbeat:', error);
      return NextResponse.json(
        formatResponse.error(error instanceof Error ? error.message : 'Failed to update heartbeat', 500),
        { status: 500 }
      );
    }
  },
  {
    requiredPermission: ['plugin.install.update']
  }
);