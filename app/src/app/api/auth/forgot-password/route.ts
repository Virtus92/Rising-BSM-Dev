/**
 * Forgot Password API Route
 * 
 * This file uses the handler from the features/auth module
 */
import { NextRequest } from 'next/server';
import { forgotPasswordHandler } from '@/features/auth/api';

/**
 * POST /api/auth/forgot-password
 * Processes password reset requests and sends reset emails
 */
export async function POST(request: NextRequest) {
  return forgotPasswordHandler(request);
}
