/**
 * Token Validation API Route
 * 
 * Validates the current authentication token
 * Optimized for performance with reduced database load
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { cookies } from 'next/headers';
import { validateHandler } from '@/features/auth/api';

/**
 * GET /api/auth/validate
 * Validates an authentication token or a one-time token
 */
export async function GET(request: NextRequest) {
  try {
    // Log incoming request details for debugging
    const logger = getLogger();
    logger.debug('Token validation request received', {
      url: request.url,
      method: request.method,
      hasAuthHeader: !!request.headers.get('Authorization'),
      hasCookies: request.cookies.size > 0,
      cookieNames: [...request.cookies.getAll()].map(c => c.name)
    });
    
    return await validateHandler(request);
  } catch (error) {
    const logger = getLogger();
    logger.error('Error in validate route:', error instanceof Error ? error : String(error));
    
    return NextResponse.json(
      formatResponse.error('Error validating token', 500),
      { status: 500 }
    );
  }
}
