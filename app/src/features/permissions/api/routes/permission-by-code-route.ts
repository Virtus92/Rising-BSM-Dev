/**
 * API Route Handler for Getting Permission by Code
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';

/**
 * Get permission by code
 */
export async function getPermissionByCodeHandler(
  req: NextRequest,
  code: string
): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    if (!code) {
      return NextResponse.json(
        formatResponse.error('Invalid or missing permission code', 400),
        { status: 400 }
      );
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
      code
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to fetch permission',
      500
    );
  }
}
