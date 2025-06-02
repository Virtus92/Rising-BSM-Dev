/**
 * Plugin API Routes
 * 
 * GET /api/plugins - List all plugins
 * POST /api/plugins - Create a new plugin
 */

import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getPluginService } from '@/core/factories/serviceFactory.server';
import { LoggingService } from '@/core/logging/LoggingService';
import { z } from 'zod';
import { PluginType, PluginStatus } from '@/domain/entities/Plugin';

export const runtime = 'nodejs';

const logger = new LoggingService();

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
export const GET = routeHandler(async (req: NextRequest) => {
  try {
    logger.info('GET /api/plugins - Getting plugins');
    
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
    
    // Validate enum values
    if (validated.type && !Object.values(PluginType).includes(validated.type as PluginType)) {
      return formatResponse.badRequest('Invalid plugin type');
    }
    
    if (validated.status && !Object.values(PluginStatus).includes(validated.status as PluginStatus)) {
      return formatResponse.badRequest('Invalid plugin status');
    }
    
    // If search query is provided, use search
    if (validated.query) {
      const result = await service.searchPlugins(validated);
      
      return formatResponse.success({
        data: result.data,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / validated.limit)
        }
      });
    }
    
    // Otherwise, get all with filters
    const result = await service.getAll({
      page: validated.page,
      limit: validated.limit,
      filters: {
        type: validated.type as PluginType,
        category: validated.category,
        status: validated.status as PluginStatus
      },
      sort: validated.sortBy ? {
        field: validated.sortBy,
        direction: validated.sortDirection || 'desc'
      } : undefined
    });
    
    return formatResponse.success({
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error getting plugins', { error });
    
    if (error instanceof z.ZodError) {
      return formatResponse.validationError(error.flatten().fieldErrors);
    }
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to get plugins';
    
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.view']
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
  minAppVersion: z.string().min(1),
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
export const POST = routeHandler(async (req: NextRequest) => {
  try {
    logger.info('POST /api/plugins - Creating plugin');
    
    const service = getPluginService();
    const body = await req.json();
    
    // Validate request body
    const validated = createPluginSchema.parse(body);
    
    // Get user ID from authenticated context
    const userId = parseInt(req.headers.get('X-Auth-User-ID') || '0');
    if (!userId) {
      return formatResponse.unauthorized('User not authenticated');
    }
    
    // Create plugin
    const plugin = await service.createPlugin(validated, userId);
    
    return formatResponse.success(plugin, 'Plugin created successfully');
  } catch (error) {
    logger.error('Error creating plugin', { error });
    
    if (error instanceof z.ZodError) {
      return formatResponse.validationError(error.flatten().fieldErrors);
    }
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to create plugin';
    
    return formatResponse.error(message, statusCode);
  }
}, {
  requiredPermissions: ['plugin.create']
});
