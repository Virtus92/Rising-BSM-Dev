import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { getApiKeyService } from '@/core/factories/serviceFactory.server';
import { formatResponse } from '@/core/errors';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { RevokeApiKeyDto } from '@/domain/dtos/ApiKeyDtos';

/**
 * POST /api/api-keys/[id]/revoke
 * Revoke an API key
 */
export const POST = routeHandler(
  async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const apiKeyId = parseInt(id);

    if (isNaN(apiKeyId)) {
      return formatResponse.error('Invalid API key ID', 400);
    }

    const body = await req.json();
    
    const revokeData: RevokeApiKeyDto = {
      reason: body.reason
    };

    const apiKeyService = getApiKeyService();
    const success = await apiKeyService.revokeApiKey(apiKeyId, revokeData, { userId: req.auth?.userId });

    if (!success) {
      return formatResponse.error('Failed to revoke API key', 500);
    }

    return formatResponse.success({ revoked: true });
  },
  { 
    requiresAuth: true,
    requiredPermission: [SystemPermission.API_KEYS_MANAGE]
  }
);
