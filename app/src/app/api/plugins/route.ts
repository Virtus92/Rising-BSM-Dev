import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { withAuth } from '@/features/auth/middleware';
import { getPluginService } from '@/core/factories/index.server';
import { PluginSearchDto, CreatePluginDto } from '@/domain/dtos/PluginDtos';
import { z } from 'zod';
import { getLogger } from '@/core/logging';

// GET /api/plugins - Search/list plugins
const searchSchema = z.object({
  query: z.string().optional(),
  type: z.enum(['ui', 'api', 'automation', 'mixed']).optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  sortBy: z.enum(['downloads', 'rating', 'name', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().positive().optional(),
  limit: z.number().positive().max(100).optional()
});

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const logger = getLogger();
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    
    // Parse and validate search parameters
    const validatedParams = searchSchema.parse({
      ...searchParams,
      minRating: searchParams.minRating ? Number(searchParams.minRating) : undefined,
      page: searchParams.page ? Number(searchParams.page) : undefined,
      limit: searchParams.limit ? Number(searchParams.limit) : undefined
    });

    const searchDto: PluginSearchDto = validatedParams;
    
    const pluginService = getPluginService();
    const result = await pluginService.searchPlugins(searchDto);

    return NextResponse.json(
      formatResponse.success({
        data: result.data,
        meta: {
          total: result.total,
          page: searchDto.page || 1,
          limit: searchDto.limit || 20,
          totalPages: Math.ceil(result.total / (searchDto.limit || 20))
        }
      }, 'Plugins retrieved successfully'),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error retrieving plugins:', error as Error);
    return NextResponse.json(
      formatResponse.error(error instanceof Error ? error.message : 'Failed to retrieve plugins', 500),
      { status: 500 }
    );
  }
}

// POST /api/plugins - Create a new plugin (requires authentication)
const createPluginSchema = z.object({
  name: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(3).max(100),
  description: z.string().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  type: z.enum(['ui', 'api', 'automation', 'mixed']),
  category: z.string().min(3).max(50),
  tags: z.array(z.string()).optional(),
  icon: z.string().url().optional(),
  minAppVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  maxAppVersion: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  pricing: z.record(z.any()).optional(),
  trialDays: z.number().min(0).max(90).optional(),
  permissions: z.array(z.object({
    code: z.string(),
    name: z.string(),
    description: z.string(),
    required: z.boolean()
  })).optional(),
  dependencies: z.array(z.object({
    pluginName: z.string(),
    minVersion: z.string().optional(),
    maxVersion: z.string().optional()
  })).optional()
});

export const POST = withAuth(
  async (request: NextRequest) => {
    const logger = getLogger();
    try {
      const body = await request.json();
      const validatedData = createPluginSchema.parse(body);
      
      const createDto: CreatePluginDto = validatedData;
      
      // Get user ID from auth context
      const userId = (request as any).auth?.userId;
      if (!userId) {
        return NextResponse.json(
          formatResponse.error('User ID not found in auth context', 401),
          { status: 401 }
        );
      }

      const pluginService = getPluginService();
      const plugin = await pluginService.createPlugin(createDto, userId);

      return NextResponse.json(
        formatResponse.success(plugin, 'Plugin created successfully'),
        { status: 201 }
      );
    } catch (error) {
      logger.error('Error creating plugin:', error as Error);
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          formatResponse.error('Invalid plugin data', 400),
          { status: 400 }
        );
      }
      return NextResponse.json(
        formatResponse.error(error instanceof Error ? error.message : 'Failed to create plugin', 500),
        { status: 500 }
      );
    }
  },
  {
    requiredPermission: ['plugins.create']
  }
);