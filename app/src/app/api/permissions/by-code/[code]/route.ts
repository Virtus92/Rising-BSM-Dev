/**
 * API route for getting permission by code
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * GET /api/permissions/by-code/[code]
 * Get permission by code
 */
export const GET = apiRouteHandler(async (
  req: NextRequest,
  { params }: { params: { code: string } }
) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    const code = params.code;
    
    if (!code) {
      return formatResponse.error('Invalid or missing permission code', 400);
    }

    // Create permission service
    const permissionService = serviceFactory.createPermissionService();
    
    // Get permission by code
    const permission = await permissionService.findByCode(code);
    
    if (!permission) {
      return formatResponse.notFound('Permission not found');
    }
    
    return formatResponse.success(permission, 'Permission retrieved successfully');
  } catch (error) {
    logger.error('Error fetching permission by code:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: params.code
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to fetch permission',
      500
    );
  }
}, {
  requiresAuth: true
});
