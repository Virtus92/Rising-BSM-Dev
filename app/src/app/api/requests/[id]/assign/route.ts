import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UserRole } from '@/domain/enums/UserEnums';

type RequestParams = {
  params: {
    id: string;
  };
};

/**
 * POST /api/requests/[id]/assign
 * 
 * Assigns a contact request to a user with proper permission checks.
 */
export const POST = routeHandler(
  async (req: NextRequest, { params }: RequestParams) => {
    const logger = getLogger();
    const serviceFactory = getServiceFactory();

    const requestId = parseInt(params.id);
    if (isNaN(requestId)) {
      return formatResponse.error('Invalid request ID', 400);
    }
    
    // Parse request body
    const body = await req.json();
    const { userId, note } = body;
    
    if (!userId) {
      return formatResponse.error('User ID is required', 400);
    }
    
    // Create context for service calls
    const context = {
      userId: req.auth?.userId,
      userRole: req.auth?.role
    };
    
    // Get request service and user service
    const requestService = serviceFactory.createRequestService();
    const userService = serviceFactory.createUserService();
    
    // Verify user exists and has proper permissions
    try {
      const user = await userService.getById(userId);
      
      if (!user) {
        return formatResponse.error('User not found', 404);
      }
      
      // Check if user has appropriate permissions to process requests
      const permissionService = serviceFactory.createPermissionService();
      const userPermissions = await permissionService.getUserPermissions(userId);
      
      // Check if user can view and edit requests
      const canProcessRequests = userPermissions.permissions.some((p: string) => 
        p === SystemPermission.REQUESTS_VIEW || 
        p === SystemPermission.REQUESTS_EDIT
      );
      
      if (!canProcessRequests && user.role !== UserRole.ADMIN) {
        return formatResponse.error('User does not have permission to process requests', 403);
      }
      
      // Assign request to user
      const updatedRequest = await requestService.assignRequest(requestId, userId, note, { context });
      
      return formatResponse.success(updatedRequest, 'Request assigned successfully');
    } catch (error) {
      logger.error('Error assigning request:', error as Error);
      return formatResponse.error('Failed to assign request', 500);
    }
  },
  { 
    requiresAuth: true,
    requiredPermission: [SystemPermission.REQUESTS_ASSIGN]
  }
);
