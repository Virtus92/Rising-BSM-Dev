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
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { role: string } }
) => {
  return getRoleDefaultsHandler(request, params.role);
});
