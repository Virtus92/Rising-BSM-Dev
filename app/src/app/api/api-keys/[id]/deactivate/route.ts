import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { getApiKeyService } from '@/core/factories/serviceFactory.server';
import { formatResponse } from '@/core/errors';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * PATCH /api/api-keys/[id]/deactivate
 * Deactivate an API key
 */
export const PATCH = routeHandler(
  async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const apiKeyId = parseInt(id);

    if (isNaN(apiKeyId)) {
      return formatResponse.error('Invalid API key ID', 400);
    }

    const apiKeyService = getApiKeyService();
    const success = await apiKeyService.deactivateApiKey(apiKeyId, { userId: req.auth?.userId });

    if (!success) {
      return formatResponse.error('Failed to deactivate API key', 500);
    }

    return formatResponse.success({ deactivated: true });
  },
  { 
    requiresAuth: true,
    requiredPermission: [SystemPermission.API_KEYS_MANAGE]
  }
);
