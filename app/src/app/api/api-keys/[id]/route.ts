import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { getApiKeyService } from '@/core/factories/serviceFactory.server';
import { formatResponse } from '@/core/errors';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UpdateApiKeyDto } from '@/domain/dtos/ApiKeyDtos';

/**
 * GET /api/api-keys/[id]
 * Get a specific API key by ID
 */
export const GET = routeHandler(
  async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const apiKeyId = parseInt(id);

    if (isNaN(apiKeyId)) {
      return formatResponse.error('Invalid API key ID', 400);
    }

    const apiKeyService = getApiKeyService();
    const apiKey = await apiKeyService.getById(apiKeyId, { userId: req.auth?.userId });

    if (!apiKey) {
      return formatResponse.error('API key not found', 404);
    }

    return formatResponse.success(apiKey);
  },
  { 
    requiresAuth: true,
    requiredPermission: [SystemPermission.API_KEYS_VIEW]
  }
);

/**
 * PUT /api/api-keys/[id]
 * Update an API key
 */
export const PUT = routeHandler(
  async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const apiKeyId = parseInt(id);

    if (isNaN(apiKeyId)) {
      return formatResponse.error('Invalid API key ID', 400);
    }

    const body = await req.json();
    
    const updateData: UpdateApiKeyDto = {
      name: body.name,
      description: body.description,
      status: body.status,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      permissions: body.permissions
    };

    const apiKeyService = getApiKeyService();
    const updatedApiKey = await apiKeyService.update(apiKeyId, updateData, { userId: req.auth?.userId });

    return formatResponse.success(updatedApiKey);
  },
  { 
    requiresAuth: true,
    requiredPermission: [SystemPermission.API_KEYS_EDIT]
  }
);

/**
 * DELETE /api/api-keys/[id]
 * Delete an API key
 */
export const DELETE = routeHandler(
  async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const apiKeyId = parseInt(id);

    if (isNaN(apiKeyId)) {
      return formatResponse.error('Invalid API key ID', 400);
    }

    const apiKeyService = getApiKeyService();
    const success = await apiKeyService.delete(apiKeyId, { userId: req.auth?.userId });

    if (!success) {
      return formatResponse.error('Failed to delete API key', 500);
    }

    return formatResponse.success({ deleted: true });
  },
  { 
    requiresAuth: true,
    requiredPermission: [SystemPermission.API_KEYS_DELETE]
  }
);
