/**
 * Global API Error Handler
 * 
 * This file provides a centralized error handling mechanism for all API routes.
 * It ensures consistent error responses and proper logging.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/core/logging';

/**
 * Standardized error response format
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    type: string;
    path?: string;
    requestId?: string;
  };
  timestamp: string;
}

/**
 * Global error handler for API routes
 * This will be used by Next.js for unhandled errors in API routes
 * 
 * @param error The error object
 * @param request The Next.js request object
 */
export function handleApiError(
  error: Error, 
  request: NextRequest
): NextResponse<ApiErrorResponse> {
  const logger = getLogger();
  const requestId = request.headers.get('x-request-id') || 
                    `err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  // Log error details
  logger.error('Unhandled API error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    },
    requestId
  });
  
  // Determine error code and HTTP status
  let statusCode = 500;
  let errorCode = 'internal_server_error';
  
  if (error instanceof TypeError) {
    statusCode = 400;
    errorCode = 'type_error';
  } else if (error.name === 'ValidationError') {
    statusCode = 422;
    errorCode = 'validation_error';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    errorCode = 'not_found';
  } else if (error.name === 'AuthorizationError') {
    statusCode = 403;
    errorCode = 'forbidden';
  } else if (error.name === 'AuthenticationError') {
    statusCode = 401;
    errorCode = 'unauthorized';
  }
  
  // Create standardized error response
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: error.message,
      type: error.name,
      path: request.nextUrl.pathname,
      requestId
    },
    timestamp: new Date().toISOString()
  };
  
  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    (errorResponse.error as any).stack = error.stack;
  }
  
  return NextResponse.json(errorResponse, { 
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Error-Code': errorCode,
      'X-Request-Id': requestId
    }
  });
}

export default handleApiError;