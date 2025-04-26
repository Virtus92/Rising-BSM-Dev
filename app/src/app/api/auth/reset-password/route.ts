/**
 * Reset Password API Route
 * 
 * This file uses the handler from the features/auth module
 */
import { NextRequest } from 'next/server';
import { resetPasswordHandler } from '@/features/auth/api';

/**
 * POST /api/auth/reset-password
 * Processes password reset with a valid token
 */
export async function POST(request: NextRequest) {
  return resetPasswordHandler(request);
}
