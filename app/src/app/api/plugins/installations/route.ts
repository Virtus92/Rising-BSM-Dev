import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { withAuth } from '@/features/auth/middleware';
import { getPluginInstallationService } from '@/core/factories/index.server';
import { InstallPluginDto } from '@/domain/dtos/PluginDtos';
import { z } from 'zod';
import { getLogger } from '@/core/logging';

export const runtime = 'nodejs';

// GET /api/plugins/installations - Get user's installations
export const GET = withAuth(
  async (request: NextRequest) => {
    const logger = getLogger();
    try {
      const userId = (request as any).auth?.userId;
      if (!userId) {
        return NextResponse.json(
          formatResponse.error('User ID not found in auth context', 401),
          { status: 401 }
        );
      }
      
      const installationService = getPluginInstallationService();
      const installations = await installationService.getUserInstallations(userId);

      return NextResponse.json(
        formatResponse.success(installations, 'Installations retrieved successfully'),
        { status: 200 }
      );
    } catch (error: any) {
      logger.error('Error retrieving installations:', error);
      return NextResponse.json(
        formatResponse.error(error instanceof Error ? error.message : 'Failed to retrieve installations', 500),
        { status: 500 }
      );
    }
  },
  {
    requiredPermission: ['plugin.install.view']
  }
);

// POST /api/plugins/installations - Install a plugin
const installPluginSchema = z.object({
  pluginId: z.number().positive(),
  licenseKey: z.string(),
  hardwareId: z.string().regex(/^[a-f0-9]{64}$/i)
});

export const POST = withAuth(
  async (request: NextRequest) => {
    const logger = getLogger();
    try {
      const body = await request.json();
      const validatedData = installPluginSchema.parse(body);
      
      const installDto: InstallPluginDto = validatedData;
      const userId = (request as any).auth?.userId;
      if (!userId) {
        return NextResponse.json(
          formatResponse.error('User ID not found in auth context', 401),
          { status: 401 }
        );
      }
      
      const installationService = getPluginInstallationService();
      const result = await installationService.installPlugin(installDto, userId);

      if (!result.success) {
        return NextResponse.json(
          formatResponse.error(result.error || 'Installation failed', 400),
          { status: 400 }
        );
      }

      return NextResponse.json(
        formatResponse.success(result.installation, 'Plugin installed successfully'),
        { status: 201 }
      );
    } catch (error: any) {
      logger.error('Error installing plugin:', error);
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          formatResponse.error('Invalid installation data', 400),
          { status: 400 }
        );
      }
      return NextResponse.json(
        formatResponse.error(error instanceof Error ? error.message : 'Failed to install plugin', 500),
        { status: 500 }
      );
    }
  },
  {
    requiredPermission: ['plugin.install']
  }
);