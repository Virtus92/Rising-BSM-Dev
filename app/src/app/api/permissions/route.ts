/**
 * Permissions API Route
 * 
 * This file uses the handlers from the features/permissions module
 */
import { NextRequest } from 'next/server';
import { getPermissionsHandler, createPermissionHandler } from '@/features/permissions/api';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';

/**
 * GET /api/permissions
 * Get permissions with optional filtering
 */
export const GET = withAuth(async (request: NextRequest) => {
  return getPermissionsHandler(request);
});

/**
 * POST /api/permissions
 * Create a new permission
 */
export const POST = withAuth(async (request: NextRequest) => {
  return createPermissionHandler(request);
}, {
  // In production, only admins would have this permission
  allowedRoles: process.env.NODE_ENV === 'production' ? ['ADMIN'] : undefined
});
