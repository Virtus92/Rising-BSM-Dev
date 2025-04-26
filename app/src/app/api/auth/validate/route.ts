/**
 * Validate Token API Route
 * 
 * This file uses the handler from the features/auth module
 */
import { NextRequest } from 'next/server';
import { validateHandler } from '@/features/auth/api';

/**
 * GET /api/auth/validate
 * Validates an authentication token or a one-time token
 */
export async function GET(request: NextRequest) {
  return validateHandler(request);
}
