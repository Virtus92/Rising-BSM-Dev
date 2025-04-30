/**
 * Login API Route
 * 
 * This file uses the handler from the features/auth module
 */
import { NextRequest } from 'next/server';
import { loginHandler } from '@/features/auth/api';
import { getLogger } from '@/core/logging';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';

/**
 * POST /api/auth/login
 * Authenticates a user and returns access and refresh tokens
 */
export async function POST(request: NextRequest) {
  // All error handling is delegated to the loginHandler, which will properly
  // throw AppError subclasses as needed
  return loginHandler(request);
}
