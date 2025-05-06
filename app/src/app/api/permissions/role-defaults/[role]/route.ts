/**
 * Role Defaults API Route
 * 
 * This file uses the handler from the features/permissions module
 */
import { NextRequest } from 'next/server';
import { getRoleDefaultsHandler } from '@/features/permissions/api';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';

/**
 * GET /api/permissions/role-defaults/[role]
 * Get default permissions for a specific role
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ role: string }> }
) {
  // Await the params before accessing properties
  const params = await context.params;
  
  const authHandler = await withAuth(async (req: NextRequest) => {
    return getRoleDefaultsHandler(req, params.role);
  });
  return authHandler(request);
}
