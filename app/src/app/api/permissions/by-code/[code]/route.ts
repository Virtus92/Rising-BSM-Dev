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
// Initialize the GET handler by awaiting the withAuth middleware
const initHandler = async () => {
  return await withAuth(async (
    request: NextRequest,
    { params }: { params: { code: string } }
  ) => {
    return getPermissionByCodeHandler(request, params.code);
  });
};

// Export the handler after awaiting middleware initialization
export const GET = await initHandler();
