/**
 * Change Password API Route
 * 
 * This file uses the handler from the features/auth module
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { changePasswordHandler } from '@/features/auth/api';
import { formatResponse } from '@/core/errors';
import { verifyAuthToken } from '@/features/auth/lib/server/ServerAuthUtils';

/**
 * POST /api/auth/change-password
 * Processes password change requests for authenticated users
 */
export async function POST(request: NextRequest) {
  try {
    // Get token from various possible sources
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    const jsToken = cookieStore.get('js_token')?.value;
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    // Try all token sources
    const token = authToken || jsToken || bearerToken;
    
    if (!token) {
      return NextResponse.json(
        formatResponse.error('Authentication required', 401),
        { status: 401 }
      );
    }
    
    // Use server-side token verification
    const verification = verifyAuthToken(token);
    
    if (!verification.valid) {
      return NextResponse.json(
        formatResponse.error(`Invalid authentication token: ${verification.reason || 'Validation failed'}`, 401),
        { status: 401 }
      );
    }
    
    // Ensure we have a user ID
    if (!verification.userId) {
      return NextResponse.json(
        formatResponse.error('Invalid user information in token', 401),
        { status: 401 }
      );
    }
    
    // Create a new request with authentication headers
    const headers = new Headers(request.headers);
    headers.set('x-user-id', verification.userId.toString());
    if (verification.role) headers.set('x-user-role', verification.role);
    if (verification.email) headers.set('x-user-email', verification.email);
    
    // Create a new request with the updated headers
    const authenticatedRequest = new NextRequest(request.url, {
      method: request.method,
      headers: headers,
      body: request.body,
      cache: request.cache,
      credentials: request.credentials,
      integrity: request.integrity,
      keepalive: request.keepalive,
      mode: request.mode,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      signal: request.signal,
    });
    
    // Pass the modified request to the handler
    return changePasswordHandler(authenticatedRequest);
  } catch (error) {
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'Authentication processing error',
        500
      ),
      { status: 500 }
    );
  }
}
