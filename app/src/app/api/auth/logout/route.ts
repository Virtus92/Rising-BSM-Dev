/**
 * Logout API Route
 * 
 * This file uses the handler from the features/auth module
 */
import { NextRequest } from 'next/server';
import { logoutHandler } from '@/features/auth/api';

/**
 * POST /api/auth/logout
 * Handles logging out users and cleaning up sessions
 */
export async function POST(request: NextRequest) {
  return logoutHandler(request);
}
