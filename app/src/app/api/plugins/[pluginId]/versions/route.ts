import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { routeHandler } from '@/core/api';
import { serviceFactory } from '@/core/factories';

export const runtime = 'nodejs';

/**
 * GET /api/plugins/[pluginId]/versions
 * Get available versions for a plugin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pluginId: string }> }
) {
  return routeHandler(
    request,
    {
      requiredPermissions: ['plugins.view']
    },
    async ({ user }) => {
      const { pluginId } = await params;
      const distributionService = await serviceFactory.getPluginDistributionService();

      try {
        const versions = await distributionService.getAvailableVersions(Number(pluginId));
        
        return NextResponse.json(
          formatResponse.success({
            pluginId: Number(pluginId),
            versions,
            latest: versions[0] || null,
            count: versions.length
          }),
          { status: 200 }
        );
      } catch (error) {
        return NextResponse.json(
          formatResponse.error('Failed to get plugin versions', 500),
          { status: 500 }
        );
      }
    }
  );
}