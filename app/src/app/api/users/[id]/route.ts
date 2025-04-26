/**
 * User By ID API Routes
 * 
 * These routes use the handlers from the features/users module
 */
import { NextRequest } from 'next/server';
import { getUserHandler, updateUserHandler, deleteUserHandler } from '@/features/users/api';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';

/**
 * GET /api/users/[id]
 * Get a specific user by ID
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return getUserHandler(request, { params });
});

/**
 * PUT /api/users/[id]
 * Update a user
 */
export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return updateUserHandler(request, { params });
});

/**
 * DELETE /api/users/[id]
 * Delete a user
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return deleteUserHandler(request, { params });
});
