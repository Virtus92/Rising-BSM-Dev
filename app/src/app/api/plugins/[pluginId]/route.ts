import { NextRequest } from 'next/server';
import { createRouteHandler } from '@/core/api/server/route-handler';
import { getPluginService } from '@/core/factories/serviceFactory.server';
import { z } from 'zod';
import { AppError } from '@/core/errors';

const updatePluginSchema = z.object({
  displayName: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  category: z.string().optional(),
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
  minAppVersion: z.string().optional(),
  maxAppVersion: z.string().optional(),
  pricing: z.object({
    trial: z.number().optional(),
    basic: z.number().optional(),
    premium: z.number().optional(),
    enterprise: z.number().optional()
  }).optional(),
  trialDays: z.number().min(0).max(90).optional()
});

// GET /api/plugins/[pluginId] - Get a specific plugin
export const GET = createRouteHandler({
  requiredPermissions: ['plugin.view'],
  handler: async (req: NextRequest, context: any) => {
    const service = getPluginService();
    const pluginId = parseInt(context.params.pluginId as string);
    
    if (isNaN(pluginId)) {
      throw new AppError('Invalid plugin ID', 400);
    }
    
    const plugin = await service.getById(pluginId);
    
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }
    
    return {
      success: true,
      data: plugin
    };
  }
});

// PUT /api/plugins/[pluginId] - Update a plugin
export const PUT = createRouteHandler({
  requiredPermissions: ['plugin.update'],
  handler: async (req: NextRequest, context: any) => {
    const service = getPluginService();
    const pluginId = parseInt(context.params.pluginId as string);
    const body = await req.json();
    
    if (isNaN(pluginId)) {
      throw new AppError('Invalid plugin ID', 400);
    }
    
    // Validate request body
    const validated = updatePluginSchema.parse(body);
    
    // Update plugin
    const plugin = await service.updatePlugin(pluginId, validated, context.user.id);
    
    return {
      success: true,
      data: plugin
    };
  }
});

// DELETE /api/plugins/[pluginId] - Delete a plugin
export const DELETE = createRouteHandler({
  requiredPermissions: ['plugin.delete'],
  handler: async (req: NextRequest, context: any) => {
    const service = getPluginService();
    const pluginId = parseInt(context.params.pluginId as string);
    
    if (isNaN(pluginId)) {
      throw new AppError('Invalid plugin ID', 400);
    }
    
    // Check if user is admin or plugin author
    const plugin = await service.getById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }
    
    if (plugin.authorId !== context.user.id && !context.user.permissions.includes('admin')) {
      throw new AppError('Unauthorized to delete this plugin', 403);
    }
    
    const result = await service.delete(pluginId);
    
    return {
      success: true,
      data: { deleted: result }
    };
  }
});

// POST /api/plugins/[pluginId]/submit - Submit plugin for review
export const submitForReview = createRouteHandler({
  requiredPermissions: ['plugin.create'],
  handler: async (req: NextRequest, context: any) => {
    const service = getPluginService();
    const pluginId = parseInt(context.params.pluginId as string);
    
    if (isNaN(pluginId)) {
      throw new AppError('Invalid plugin ID', 400);
    }
    
    await service.submitForReview(pluginId, context.user.id);
    
    return {
      success: true,
      message: 'Plugin submitted for review'
    };
  }
});

// POST /api/plugins/[pluginId]/approve - Approve a plugin
export const approvePlugin = createRouteHandler({
  requiredPermissions: ['plugin.approve'],
  handler: async (req: NextRequest, context: any) => {
    const service = getPluginService();
    const pluginId = parseInt(context.params.pluginId as string);
    
    if (isNaN(pluginId)) {
      throw new AppError('Invalid plugin ID', 400);
    }
    
    await service.approvePlugin(pluginId, context.user.id);
    
    return {
      success: true,
      message: 'Plugin approved'
    };
  }
});

// POST /api/plugins/[pluginId]/reject - Reject a plugin
export const rejectPlugin = createRouteHandler({
  requiredPermissions: ['plugin.approve'],
  handler: async (req: NextRequest, context: any) => {
    const service = getPluginService();
    const pluginId = parseInt(context.params.pluginId as string);
    const { reason } = await req.json();
    
    if (isNaN(pluginId)) {
      throw new AppError('Invalid plugin ID', 400);
    }
    
    if (!reason) {
      throw new AppError('Rejection reason is required', 400);
    }
    
    await service.rejectPlugin(pluginId, context.user.id, reason);
    
    return {
      success: true,
      message: 'Plugin rejected'
    };
  }
});

// POST /api/plugins/[pluginId]/suspend - Suspend a plugin
export const suspendPlugin = createRouteHandler({
  requiredPermissions: ['plugin.approve'],
  handler: async (req: NextRequest, context: any) => {
    const service = getPluginService();
    const pluginId = parseInt(context.params.pluginId as string);
    const { reason } = await req.json();
    
    if (isNaN(pluginId)) {
      throw new AppError('Invalid plugin ID', 400);
    }
    
    if (!reason) {
      throw new AppError('Suspension reason is required', 400);
    }
    
    await service.suspendPlugin(pluginId, context.user.id, reason);
    
    return {
      success: true,
      message: 'Plugin suspended'
    };
  }
});
