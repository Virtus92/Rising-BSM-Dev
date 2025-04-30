/**
 * Route Handler
 * 
 * Provides a wrapper for Next.js API route handlers
 * that ensures consistent response types and error handling
 */
import { NextRequest, NextResponse } from 'next/server';
import { 
  ErrorResponse, 
  SuccessResponse 
} from '@/core/errors/types/ApiTypes';
import { getLogger } from '@/core/logging';
import jwt from 'jsonwebtoken';

// Logger for debugging auth issues
const logger = getLogger();

/**
 * Options for route handlers
 */
export interface RouteHandlerOptions {
  /**
   * Whether the route requires authentication
   */
  requiresAuth?: boolean;
  
  /**
   * Required roles for accessing this route
   */
  requiredRoles?: string[];
  
  /**
   * Whether to skip the default error handler
   */
  skipErrorHandler?: boolean;

  detailedErrors?: boolean;
}

/**
 * Use auth information interface from route-handler.ts to avoid duplication
 */
import { AuthInfo } from '../route-handler';
export type { AuthInfo };

/**
 * Route handler type
 * Ensures consistent response types
 * Must match the type definition in the main route-handler.ts
 */
export type RouteHandler<T = any> = (request: NextRequest, ...args: any[]) => Promise<NextResponse>;

// Import the RouteHandler type from the main route-handler.ts to ensure compatibility
import { RouteHandler as BaseRouteHandler } from '../route-handler';
// Ensure our RouteHandler type is compatible with the base RouteHandler type
type _EnsureTypeCompatibility<T> = RouteHandler<T> extends BaseRouteHandler<T> ? true : false;

/**
 * Helper function to extract auth information from a request
 * Parses the token from authorization headers and attaches user info to the request
 * 
 * @param request NextRequest object
 * @returns The request with auth information attached
 */
function extractAuthFromRequest(request: NextRequest): NextRequest {
  try {
    // Check if auth is already attached - don't process twice
    if ((request as any).auth) {
      return request;
    }
    
    // Get token from authorization header or X-Auth-Token header
    let token: string | null = null;
    
    // Check Authorization header first (Bearer token)
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no token in Authorization header, check X-Auth-Token
    if (!token) {
      token = request.headers.get('X-Auth-Token');
    }
    
    // If no token in headers, check cookies
    if (!token) {
      const authCookie = request.cookies.get('auth_token');
      if (authCookie) {
        token = authCookie.value;
      }
    }
    
    // If no token found, return request as is
    if (!token) {
      return request;
    }
    
    // Decode the token without verification (verification was done by middleware)
    const decoded = jwt.decode(token) as any;
    
    // If token is invalid or has no subject, return request as is
    if (!decoded || !decoded.sub) {
      return request;
    }
    
    // Create auth information
    const auth: AuthInfo = {
      userId: parseInt(decoded.sub, 10),
      role: decoded.role,
      name: decoded.name,
      email: decoded.email
    };
    
    // Attach auth to request
    (request as any).auth = auth;
    
    // Return the modified request
    return request;
  } catch (error) {
    // Log error but don't break the request
    logger.error('Error extracting auth from request:', error as Error);
    return request;
  }
}

/**
 * Create a route handler with error handling
 * 
 * @param handler Handler function
 * @param options Route handler options
 * @returns Wrapped handler with error handling
 */
export function routeHandler<T>(
  handler: RouteHandler<T>,
  options: RouteHandlerOptions = {}
): RouteHandler<T> {
  // Check if the handler is a function
  if (typeof handler !== 'function') {
    throw new Error('Handler must be a function');
  }
  // Check if the handler is compatible with the RouteHandler type
  if (typeof handler !== 'function' || handler.length < 1) {
    throw new Error('Handler must be a function with at least one argument');
  }
  // Check if the options are valid
  if (options && typeof options !== 'object') {
    throw new Error('Options must be an object');
  }
  
  // Create an auth-enhanced handler that injects the auth info and includes error handling
  const authEnhancedHandler: RouteHandler<T> = async (request: NextRequest, ...args: any[]) => {
    try {
      // Extract auth from request
      const enhancedRequest = extractAuthFromRequest(request);
      
      // Check if authentication is required and not present
      if (options.requiresAuth && !(enhancedRequest as any).auth?.userId) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            message: 'Authentication required',
            statusCode: 401,
          }),
          { 
            status: 401, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Check if role requirements are met
      if (options.requiredRoles && options.requiredRoles.length > 0 && (enhancedRequest as any).auth) {
        const userRole = (enhancedRequest as any).auth.role;
        if (!userRole || !options.requiredRoles.includes(userRole)) {
          return new NextResponse(
            JSON.stringify({
              success: false,
              message: 'Insufficient permissions',
              statusCode: 403,
            }),
            { 
              status: 403, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }
      }
      
      // Forward to the original handler with the enhanced request
      return await handler(enhancedRequest, ...args);
    } catch (error) {
      // Log the error
      logger.error('Error in route handler:', error as Error);
      
      // Return a formatted error response
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: error instanceof Error ? error.message : 'An unknown error occurred',
          statusCode: 500,
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  };
  
  // Return the enhanced handler directly without using errorHandler
  return authEnhancedHandler;
}
