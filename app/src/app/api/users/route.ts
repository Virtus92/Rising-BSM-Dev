/**
 * Users API Routes
 * 
 * These routes use the handlers from the features/users module
 */
import { NextRequest } from 'next/server';
import { listUsersHandler, createUserHandler } from '@/features/users/api';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';

/**
 * GET /api/users
 * Get users with optional filtering and pagination
 */
export const GET = withAuth(async (request: NextRequest) => {
  return listUsersHandler(request);
});

/**
 * POST /api/users
 * Create a new user
 */
export const POST = withAuth(async (request: NextRequest) => {
  return createUserHandler(request);
});
