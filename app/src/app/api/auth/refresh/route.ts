/**
 * Token Refresh API Route
 * 
 * This file uses the handler from the features/auth module
 */
import { NextRequest } from 'next/server';
import { refreshHandler } from '@/features/auth/api';
import { withRateLimit } from '@/core/api/middleware/rate-limit';

/**
 * POST /api/auth/refresh
 * Refreshes access tokens using a valid refresh token
 */
export const POST = withRateLimit(refreshHandler);
