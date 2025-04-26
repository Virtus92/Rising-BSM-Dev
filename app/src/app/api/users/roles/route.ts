/**
 * API route for getting available user roles
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { UserRole } from '@/domain/enums/UserEnums';

/**
 * GET /api/users/roles
 * Get all available user roles
 */
export const GET = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();

  try {
    // Get all role values from the UserRole enum
    const roles = Object.values(UserRole);
    
    return formatResponse.success(roles, 'User roles retrieved successfully');
  } catch (error) {
    logger.error('Error fetching user roles:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to fetch user roles',
      500
    );
  }
}, {
  requiresAuth: true
});
