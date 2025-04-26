/**
 * API Route Handler for Default Permissions by Role
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { UserRole } from '@/domain/enums/UserEnums';

/**
 * Get default permissions for a specific role
 */
export async function getRoleDefaultsHandler(
  req: NextRequest,
  role: string
): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    if (!role) {
      return NextResponse.json(
        formatResponse.error('Invalid or missing role', 400),
        { status: 400 }
      );
    }

    // Validate role parameter before proceeding
    // Convert to lowercase for case-insensitive comparison
    const normalizedRole = role.toLowerCase();
    
    // Check if role is valid
    const validRoles = Object.values(UserRole).map(r => r.toLowerCase());
    if (!validRoles.includes(normalizedRole)) {
      return NextResponse.json(
        formatResponse.error(`Invalid role: ${role}. Valid roles are: ${Object.values(UserRole).join(', ')}`, 400),
        { status: 400 }
      );
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
      role
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to fetch default permissions',
      500
    );
  }
}
