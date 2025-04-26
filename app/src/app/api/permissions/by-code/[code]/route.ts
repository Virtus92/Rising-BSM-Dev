/**
 * Permission by Code API Route
 * 
 * This file uses the handler from the features/permissions module
 */
import { NextRequest } from 'next/server';
import { getPermissionByCodeHandler } from '@/features/permissions/api';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';

/**
 * GET /api/permissions/by-code/[code]
 * Get permission by code
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { code: string } }
) => {
  return getPermissionByCodeHandler(request, params.code);
});
