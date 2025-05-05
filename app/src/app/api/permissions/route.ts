/**
 * Permissions API Route
 * 
 * This file implements Next.js route handlers for permissions
 */
import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { API_PERMISSIONS } from '@/features/permissions/api/middleware/permissionMiddleware';

/**
 * GET /api/permissions
 * Get permissions with optional filtering
 */
export const GET = routeHandler(
  permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const serviceFactory = getServiceFactory();
      const permissionService = serviceFactory.createPermissionService();
      
      // Get query parameters
      const { searchParams } = new URL(req.url);
      const filters = {
        code: searchParams.get('code') || undefined,
        name: searchParams.get('name') || undefined,
        type: searchParams.get('type') || undefined,
        page: searchParams.has('page') ? parseInt(searchParams.get('page')!) : 1,
        limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : 10
      };
      
      // Get all permissions
      const result = await permissionService.findAll({ filters });
      
      return formatResponse.success(result, 'Permissions retrieved successfully');
    },
    API_PERMISSIONS.SYSTEM.ADMIN
  ),
  { requiresAuth: true }
);

/**
 * POST /api/permissions
 * Create a new permission
 */
export const POST = routeHandler(
  permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const serviceFactory = getServiceFactory();
      const permissionService = serviceFactory.createPermissionService();
      
      // Get request body
      const data = await req.json();
      
      // Create permission
      const result = await permissionService.create(data, {
        context: { userId: req.auth?.userId }
      });
      
      return formatResponse.success(result, 'Permission created successfully');
    },
    API_PERMISSIONS.SYSTEM.ADMIN
  ),
  { requiresAuth: true }
);
