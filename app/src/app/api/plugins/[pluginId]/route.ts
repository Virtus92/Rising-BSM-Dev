import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { withAuth } from '@/features/auth/middleware';
import { getPluginService } from '@/core/factories/index.server';
import { UpdatePluginDto } from '@/domain/dtos/PluginDtos';
import { z } from 'zod';
import { getLogger } from '@/core/logging';

export const runtime = 'nodejs';

// GET /api/plugins/[pluginId] - Get plugin details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pluginId: string }> }
) {
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

    const pluginService = getPluginService();
    const plugin = await pluginService.getById(id);

    if (!plugin) {
      return NextResponse.json(
        formatResponse.error('Plugin not found', 404),
        { status: 404 }
      );
    }

    return NextResponse.json(
      formatResponse.success(plugin, 'Plugin retrieved successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Error retrieving plugin:', error);
    return NextResponse.json(
      formatResponse.error(error instanceof Error ? error.message : 'Failed to retrieve plugin', 500),
      { status: 500 }
    );
  }
}

// PATCH /api/plugins/[pluginId] - Update plugin
const updatePluginSchema = z.object({
  displayName: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  category: z.string().min(3).max(50).optional(),
  tags: z.array(z.string()).optional(),
  icon: z.string().url().optional(),
  screenshots: z.array(z.string().url()).optional(),
  pricing: z.record(z.any()).optional(),
  trialDays: z.number().min(0).max(90).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional(),
  maxAppVersion: z.string().regex(/^\d+\.\d+\.\d+$/).optional()
});

export const PATCH = withAuth(
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

      const body = await request.json();
      const validatedData = updatePluginSchema.parse(body);
      
      const updateDto: UpdatePluginDto = validatedData;
      const userId = (request as any).auth?.userId;

      const pluginService = getPluginService();
      const updatedPlugin = await pluginService.updatePlugin(id, updateDto, userId);

      return NextResponse.json(
        formatResponse.success(updatedPlugin, 'Plugin updated successfully'),
        { status: 200 }
      );
    } catch (error: any) {
      logger.error('Error updating plugin:', error);
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          formatResponse.error('Invalid plugin data', 400),
          { status: 400 }
        );
      }
      return NextResponse.json(
        formatResponse.error(error instanceof Error ? error.message : 'Failed to update plugin', 500),
        { status: 500 }
      );
    }
  },
  {
    requiredPermission: ['plugins.update']
  }
);

// DELETE /api/plugins/[pluginId] - Delete plugin (admin only)
export const DELETE = withAuth(
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

      const pluginService = getPluginService();
      await pluginService.delete(id);

      return NextResponse.json(
        formatResponse.success(null, 'Plugin deleted successfully'),
        { status: 200 }
      );
    } catch (error: any) {
      logger.error('Error deleting plugin:', error);
      return NextResponse.json(
        formatResponse.error(error instanceof Error ? error.message : 'Failed to delete plugin', 500),
        { status: 500 }
      );
    }
  },
  {
    requiredPermission: ['plugins.delete']
  }
);