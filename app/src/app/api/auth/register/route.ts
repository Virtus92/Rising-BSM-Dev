/**
 * Register API Route
 * 
 * This file uses the handler from the features/auth module
 */
import { NextRequest } from 'next/server';
import { registerHandler } from '@/features/auth/api';

/**
 * POST /api/auth/register
 * Processes registration requests and creates new user accounts
 */
export async function POST(request: NextRequest) {
  return registerHandler(request);
}
