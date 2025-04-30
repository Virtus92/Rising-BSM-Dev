/**
 * Verify User API Route
 * 
 * This file uses the handler from the features/auth module
 */
import { NextRequest } from 'next/server';
import { verifyUserHandler } from '@/features/auth/api';

/**
 * /api/auth/verify-user
 * Verifies if a user exists and is active
 * Supports both GET and POST methods
 */
export async function POST(request: NextRequest) {
  return verifyUserHandler(request);
}

/**
 * GET handler for user verification
 * This is used by the middleware for more efficient verification
 */
export async function GET(request: NextRequest) {
  return verifyUserHandler(request);
}
