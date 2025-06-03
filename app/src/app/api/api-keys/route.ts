import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { getApiKeyService } from '@/core/factories/serviceFactory.server';
import { formatResponse } from '@/core/errors';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { ApiKeyFilterParamsDto, CreateApiKeyDto } from '@/domain/dtos/ApiKeyDtos';
import { ApiKeyType, ApiKeyEnvironment } from '@/domain/entities/ApiKey';

/**
 * GET /api/api-keys
 * Get API keys with filtering and pagination
 */
export const GET = routeHandler(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    
    // Parse filter parameters
    const filters: ApiKeyFilterParamsDto = {
      type: searchParams.get('type') as ApiKeyType || undefined,
      status: searchParams.get('status') as any || undefined,
      environment: searchParams.get('environment') as ApiKeyEnvironment || undefined,
      search: searchParams.get('search') || undefined,
      createdBy: searchParams.get('createdBy') ? parseInt(searchParams.get('createdBy')!) : undefined,
      expirationFilter: searchParams.get('expirationFilter') as any || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    };

    const apiKeyService = getApiKeyService();
    const result = await apiKeyService.findApiKeys(filters, { userId: req.auth?.userId });

    return formatResponse.success(result);
  },
  { 
    requiresAuth: true,
    requiredPermission: [SystemPermission.API_KEYS_VIEW]
  }
);

/**
 * POST /api/api-keys
 * Create a new API key
 */
export const POST = routeHandler(
  async (req: NextRequest) => {
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.type || !body.environment) {
      return formatResponse.error('Missing required fields: name, type, environment', 400);
    }

    const createData: CreateApiKeyDto = {
      name: body.name,
      description: body.description,
      type: body.type as ApiKeyType,
      environment: body.environment as ApiKeyEnvironment,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      permissions: body.permissions || []
    };

    const apiKeyService = getApiKeyService();
    const result = await apiKeyService.createApiKey(createData, { userId: req.auth?.userId });

    return formatResponse.success(result, 'API key created successfully', 201);
  },
  { 
    requiresAuth: true,
    requiredPermission: [SystemPermission.API_KEYS_CREATE]
  }
);
