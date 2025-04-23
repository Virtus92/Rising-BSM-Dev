import { NextRequest, NextResponse } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatResponse } from '@/infrastructure/api/response-formatter';

/**
 * DEBUG ENDPOINT: Returns authentication status information.
 * 
 * WARNING: This endpoint should be disabled in production.
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  // Always disable in production for security
  if (process.env.NODE_ENV === 'production') {
    return formatResponse.error('This endpoint is disabled in production', 404);
  }

  // This endpoint should require authentication to prevent information disclosure
  return formatResponse.success({
    message: 'Authentication successful',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}, {
  // Make this endpoint require authentication
  requiresAuth: true,
  // Optionally restrict to admin role
  requiresRole: ['admin']
});
