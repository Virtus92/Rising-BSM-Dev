/**
 * Verify User API Route
 * 
 * This file uses the handler from the features/auth module
 */
import { NextRequest } from 'next/server';
import { verifyUserHandler } from '@/features/auth/api';

/**
 * POST /api/auth/verify-user
 * Verifies if a user exists and is active
 */
export async function POST(request: NextRequest) {
  return verifyUserHandler(request);
}
