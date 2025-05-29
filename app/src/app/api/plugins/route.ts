import { NextRequest } from 'next/server';
import { createRouteHandler } from '@/core/api/server/route-handler';
import { getPluginService } from '@/core/factories/serviceFactory.server';
import { z } from 'zod';
import { AppError } from '@/core/errors';

const searchSchema = z.object({
  query: z.string().optional(),
  type: z.enum(['ui', 'api', 'automation', 'mixed']).optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional()
});

// GET /api/plugins - Get all plugins
export const GET = createRouteHandler({
  requiredPermissions: ['plugin.view'],
  handler: async (req: NextRequest, context: any) => {
    const service = getPluginService();
    const searchParams = new URL(req.url).searchParams;
    
    // Parse query parameters
    const params = {
      query: searchParams.get('query') || undefined,
      type: searchParams.get('type') as any || undefined,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || undefined,
      sortDirection: searchParams.get('sortDirection') as any || undefined
    };
    
    // Validate parameters
    const validated = searchSchema.parse(params);
    
    // If search query is provided, use search
    if (validated.query) {
      const result = await service.searchPlugins(validated);
      return {
        success: true,
        data: result.data,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / validated.limit)
        }
      };
    }
    
    // Otherwise, get all with filters
    const result = await service.getAll({
      page: validated.page,
      limit: validated.limit,
      filters: {
        type: validated.type,
        category: validated.category,
        status: validated.status
      },
      sort: validated.sortBy ? {
        field: validated.sortBy,
        direction: validated.sortDirection || 'desc'
      } : undefined
    });
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    };
  }
});

const createPluginSchema = z.object({
  name: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(3).max(100),
  description: z.string().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  type: z.enum(['ui', 'api', 'automation', 'mixed']),
  category: z.string(),
  tags: z.array(z.string()).optional(),
  icon: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  permissions: z.array(z.object({
    code: z.string(),
    name: z.string().optional(),
    description: z.string(),
    required: z.boolean().optional()
  })).optional(),
  dependencies: z.array(z.object({
    name: z.string(),
    version: z.string()
  })).optional(),
  minAppVersion: z.string().min(1), // Required field
  maxAppVersion: z.string().optional(),
  pricing: z.object({
    trial: z.number().optional(),
    basic: z.number().optional(),
    premium: z.number().optional(),
    enterprise: z.number().optional()
  }).optional(),
  trialDays: z.number().min(0).max(90).optional()
});

// POST /api/plugins - Create a new plugin
export const POST = createRouteHandler({
  requiredPermissions: ['plugin.create'],
  handler: async (req: NextRequest, context: any) => {
    const service = getPluginService();
    const body = await req.json();
    
    // Validate request body
    const validated = createPluginSchema.parse(body);
    
    // Create plugin
    const plugin = await service.createPlugin(validated, context.user.id);
    
    return {
      success: true,
      data: plugin
    };
  }
});
