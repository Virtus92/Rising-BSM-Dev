/**
 * Permissions API Route
 *
 * Enhanced implementation with improved middleware integration and error handling
 */
import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors/formatting/response-formatter';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { withPermission } from '@/app/api/middleware/permission-middleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getLogger } from '@/core/logging';

// Get logger for better error tracking
const logger = getLogger();

/**
 * GET /api/permissions
 * Get permissions with optional filtering
 */
export const GET = routeHandler(
  async (req: NextRequest) => {
    // Create a handler function with the right signature
    const permissionHandler = async (req: NextRequest, user: any): Promise<NextResponse> => {
        // Extract userId from the auth object directly
        const userId = req.auth?.userId || user?.id;
        try {
          // Get the service factory and create permission service
          const serviceFactory = getServiceFactory();
          const permissionService = serviceFactory.createPermissionService();

          // Extract query parameters for filtering
          const { searchParams } = new URL(req.url);
          const filters = {
            code: searchParams.get('code') || undefined,
            name: searchParams.get('name') || undefined,
            type: searchParams.get('type') || undefined,
            page: searchParams.has('page') ? parseInt(searchParams.get('page')!) : 1,
            limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : 100 // Use a reasonable limit that can still show all permissions
          };
          
          // Always ensure we're getting ALL permissions by setting a high enough limit
          // Minimum of 100 to capture the complete set
          if (filters.limit < 100) {
            filters.limit = 100;
          }

          // Request additional metadata
          const requestInfo = {
            userId: userId,
            requestId: searchParams.get('requestId') || `perm-list-${Date.now()}`,
            includeDetails: searchParams.get('includeDetails') === 'true'
          };

          // Get permissions with filtering
          const result = await permissionService.findAll({
            filters,
            context: { userId }
          });

          // Return formatted success response
          return formatResponse.success(result, 'Permissions retrieved successfully');
        } catch (error) {
          // Log the error with context
          logger.error('Error retrieving permissions', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId
          });

          // Let the permission middleware handle the error formatting
          throw error;
        }
      };
  
    // Apply permission middleware with proper signature
    // Using PERMISSIONS_MANAGE permission which already exists in the system
    const handler = await withPermission(permissionHandler, SystemPermission.PERMISSIONS_MANAGE);
return await handler(req);
  },
  { requiresAuth: true }
);

/**
 * POST /api/permissions
 * Create a new permission
 */
export const POST = routeHandler(
  async (req: NextRequest) => {
    // Create a handler function with the right signature
    const permissionHandler = async (req: NextRequest, user: any): Promise<NextResponse> => {
        const userId = user?.id;
        try {
          // Get the service factory and create permission service
          const serviceFactory = getServiceFactory();
          const permissionService = serviceFactory.createPermissionService();

          // Parse the request body
          const data = await req.json();

          // Create the permission
          const result = await permissionService.create(data, {
            context: { userId }
          });

          // Return formatted success response
          return formatResponse.success(result, 'Permission created successfully', 201);
        } catch (error) {
          // Log the error with context
          logger.error('Error creating permission', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId
          });

          // Let the permission middleware handle the error formatting
          throw error;
        }
      };
    
    // Apply permission middleware with proper signature
    // Using PERMISSIONS_MANAGE permission which already exists in the system
    const handler = await withPermission(permissionHandler, SystemPermission.PERMISSIONS_MANAGE);
    return await handler(req);
  },
  { requiresAuth: true }
);

/**
 * PATCH /api/permissions
 * Update existing permissions (bulk update)
 */
export const PATCH = routeHandler(
  async (req: NextRequest) => {
    // Create a handler function with the right signature
    const permissionHandler = async (req: NextRequest, user: any): Promise<NextResponse> => {
        const userId = user?.id;
        try {
          // Get the service factory and create permission service
          const serviceFactory = getServiceFactory();
          const permissionService = serviceFactory.createPermissionService();

          // Parse the request body
          const data = await req.json();

          if (!Array.isArray(data)) {
            return formatResponse.error('Request body must be an array of permissions', 400);
          }

          // Update the permissions
          // Update in batch - using available methods instead of updateBulk
          const results = [];
          for (const item of data) {
            if (item.id) {
              const result = await permissionService.update(item.id, item, {
                context: { userId }
              });
              results.push(result);
            }
          }
          const result = results;

          // Return formatted success response
          return formatResponse.success(result, 'Permissions updated successfully');
        } catch (error) {
          // Log the error with context
          logger.error('Error updating permissions', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId
          });

          // Let the permission middleware handle the error formatting
          throw error;
        }
      };
    
    // Apply permission middleware with proper signature
    // Using PERMISSIONS_MANAGE permission which already exists in the system
    const handler = await withPermission(permissionHandler, SystemPermission.PERMISSIONS_MANAGE);
    return await handler(req);
  },
  { requiresAuth: true }
);

/**
 * DELETE /api/permissions
 * Delete a permission
 */
export const DELETE = routeHandler(
  async (req: NextRequest) => {
    // Create a handler function with the right signature
    const permissionHandler = async (req: NextRequest, user: any): Promise<NextResponse> => {
        const userId = user?.id;
        try {
          // Get the service factory and create permission service
          const serviceFactory = getServiceFactory();
          const permissionService = serviceFactory.createPermissionService();

          // Get permission ID from search params
          const { searchParams } = new URL(req.url);
          const id = searchParams.get('id');

          if (!id) {
            return formatResponse.error('Permission ID is required', 400);
          }

          // Delete the permission
          const result = await permissionService.delete(parseInt(id, 10), {
            context: { userId }
          });

          // Check if deletion was successful
          if (!result) {
            return formatResponse.error(`Permission with ID ${id} not found`, 404);
          }

          // Return formatted success response
          return formatResponse.success(null, 'Permission deleted successfully');
        } catch (error) {
          // Log the error with context
          logger.error('Error deleting permission', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId
          });

          // Let the permission middleware handle the error formatting
          throw error;
        }
      };
    
    // Apply permission middleware with proper signature
    // Using PERMISSIONS_MANAGE permission which already exists in the system
    const handler = await withPermission(permissionHandler, SystemPermission.PERMISSIONS_MANAGE);
return await handler(req);
  },
  { requiresAuth: true }
);