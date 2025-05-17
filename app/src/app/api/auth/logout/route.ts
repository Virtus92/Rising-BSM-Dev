/**
 * Logout API Route
 * 
 * Uses the clean logout handler
 */
import { NextRequest } from 'next/server';
import { logoutHandler } from '@/features/auth/api/handlers/logoutHandler';

/**
 * POST /api/auth/logout
 * Logs out the user and clears tokens
 */
export async function POST(request: NextRequest) {
  return logoutHandler(request);
}
