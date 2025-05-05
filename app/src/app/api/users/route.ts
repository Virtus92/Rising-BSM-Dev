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
export async function GET(request: NextRequest) {
  const authHandler = await withAuth(async (req: NextRequest) => {
    return listUsersHandler(req);
  });
  return authHandler(request);
}

/**
 * POST /api/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  const authHandler = await withAuth(async (req: NextRequest) => {
    return createUserHandler(req);
  });
  return authHandler(request);
}
