import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { getApiKeyService } from '@/core/factories/serviceFactory.server';
import { formatResponse } from '@/core/errors';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UpdateApiKeyPermissionsDto } from '@/domain/dtos/ApiKeyDtos';

/**
 * GET /api/api-keys/[id]/permissions
 * Get permissions for an API key
 */
export const GET = routeHandler(
  async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const apiKeyId = parseInt(id);

    if (isNaN(apiKeyId)) {
      return formatResponse.error('Invalid API key ID', 400);
    }

    const apiKeyService = getApiKeyService();
    const permissions = await apiKeyService.getApiKeyPermissions(apiKeyId, { userId: req.auth?.userId });

    return formatResponse.success({ permissions });
  },
  { 
    requiresAuth: true,
    requiredPermission: [SystemPermission.API_KEYS_VIEW]
  }
);

/**
 * PUT /api/api-keys/[id]/permissions
 * Update permissions for an API key
 */
export const PUT = routeHandler(
  async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const apiKeyId = parseInt(id);

    if (isNaN(apiKeyId)) {
      return formatResponse.error('Invalid API key ID', 400);
    }

    const body = await req.json();
    
    if (!Array.isArray(body.permissions)) {
      return formatResponse.error('Permissions must be an array', 400);
    }

    const updateData: UpdateApiKeyPermissionsDto = {
      apiKeyId,
      permissions: body.permissions
    };

    const apiKeyService = getApiKeyService();
    const success = await apiKeyService.updateApiKeyPermissions(updateData, { userId: req.auth?.userId });

    if (!success) {
      return formatResponse.error('Failed to update API key permissions', 500);
    }

    return formatResponse.success({ updated: true });
  },
  { 
    requiresAuth: true,
    requiredPermission: [SystemPermission.API_KEYS_MANAGE]
  }
);
