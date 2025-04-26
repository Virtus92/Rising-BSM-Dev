/**
 * Change Password API Route
 * 
 * This file uses the handler from the features/auth module
 */
import { NextRequest } from 'next/server';
import { changePasswordHandler } from '@/features/auth/api';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';

/**
 * POST /api/auth/change-password
 * Processes password change requests for authenticated users
 */
export const POST = withAuth(async (request: NextRequest) => {
  return changePasswordHandler(request);
});
