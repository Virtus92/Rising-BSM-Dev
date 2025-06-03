import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { getApiKeyService } from '@/core/factories/serviceFactory.server';
import { formatResponse } from '@/core/errors';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * GET /api/api-keys/stats
 * Get API key usage statistics
 */
export const GET = routeHandler(
  async (req: NextRequest, user) => {
    const apiKeyService = getApiKeyService();
    const stats = await apiKeyService.getUsageStats({ userId: user.id });

    return formatResponse.success(stats);
  },
  { 
    requiresAuth: true,
    requiredPermission: [SystemPermission.API_KEYS_VIEW]
  }
);
