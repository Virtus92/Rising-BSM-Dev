/**
 * API route for getting default permissions for a role
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * GET /api/permissions/role-defaults/[role]
 * Get default permissions for a specific role
 */
export const GET = apiRouteHandler(async (
  req: NextRequest,
  { params }: { params: { role: string } }
) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Ensure params is properly resolved before using
    const resolvedParams = await params;
    const role = resolvedParams.role;
    
    if (!role) {
      return formatResponse.error('Invalid or missing role', 400);
    }

    // Validate role parameter before proceeding
    // Import UserRole enum to check against valid roles
    const { UserRole } = await import('@/domain/enums/UserEnums');
    
    // Convert to lowercase for case-insensitive comparison
    const normalizedRole = role.toLowerCase();
    
    // Check if role is valid
    const validRoles = Object.values(UserRole).map(r => r.toLowerCase());
    if (!validRoles.includes(normalizedRole)) {
      return formatResponse.error(`Invalid role: ${role}. Valid roles are: ${Object.values(UserRole).join(', ')}`, 400);
    }

    // Create permission service
    const permissionService = serviceFactory.createPermissionService();
    
    // Get default permissions for the role
    const permissions = await permissionService.getDefaultPermissionsForRole(normalizedRole);
    
    return formatResponse.success({
      role: normalizedRole,
      permissions
    }, 'Default permissions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching default permissions for role:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      role: params.role
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to fetch default permissions',
      500
    );
  }
}, {
  requiresAuth: true
});
