/**
 * Change Password API Route
 * 
 * This file uses the handler from the features/auth module
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { changePasswordHandler } from '@/features/auth/api';
import AuthService from '@/features/auth/core';
import { formatResponse } from '@/core/errors';

/**
 * POST /api/auth/change-password
 * Processes password change requests for authenticated users
 */
export async function POST(request: NextRequest) {
  try {
    // Get cookie token and validate it through AuthService
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        formatResponse.error('Authentication required', 401),
        { status: 401 }
      );
    }
    
    // Verify token is valid
    const isValid = await AuthService.validateToken();
    if (!isValid) {
      return NextResponse.json(
        formatResponse.error('Invalid authentication token', 401),
        { status: 401 }
      );
    }
    
    // Get user from AuthService
    const user = AuthService.getUser();
    
    if (!user || !user.id) {
      return NextResponse.json(
        formatResponse.error('Invalid authentication token', 401),
        { status: 401 }
      );
    }
    
    // Create a new request with authentication headers
    const headers = new Headers(request.headers);
    headers.set('x-user-id', user.id.toString());
    if (user.role) headers.set('x-user-role', user.role);
    if (user.email) headers.set('x-user-email', user.email);
    
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
