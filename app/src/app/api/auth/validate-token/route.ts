/**
 * Validate Token API Route
 * 
 * This file uses the handler from the features/auth module
 */
import { NextRequest } from 'next/server';
import { validateTokenHandler } from '@/features/auth/api';

/**
 * POST /api/auth/validate-token
 * Validates a password reset token
 */
export async function POST(request: NextRequest) {
  return validateTokenHandler(request);
}
