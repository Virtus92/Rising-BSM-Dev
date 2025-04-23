import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from './response-formatter';
import { getLogger } from '../common/logging';
import { getErrorHandler } from '../common/bootstrap';
import jwt from 'jsonwebtoken';
import { securityConfig } from '../common/config/SecurityConfig';
import { tokenBlacklist } from '@/infrastructure/auth/TokenBlacklist';
import { db } from '@/infrastructure/db';

/**
 * API-Route-Handler-Typ
 */
type ApiRouteHandler = (
  req: NextRequest,
  params?: { [key: string]: string } | any
) => Promise<NextResponse>;

/**
 * Optionen für den API-Route-Handler
 */
interface ApiRouteHandlerOptions {
  requiresAuth?: boolean;
  requiresRole?: string[];
  rateLimit?: {
    max: number;
    windowMs: number;
  };
}

// Type extension for NextRequest to include auth information
declare module 'next/server' {
  interface NextRequest {
    auth?: {
      userId: number;
      name?: string;
      email?: string;
      role?: string;
    };
  }
}

/**
 * Wraps einen API-Route-Handler mit Fehlerbehandlung und Validierung
 * 
 * @param handler - API-Route-Handler
 * @param options - Optionen
 * @returns Gewrappter Handler
 */
export function apiRouteHandler(
  handler: ApiRouteHandler,
  options: ApiRouteHandlerOptions = {}
): ApiRouteHandler {
  return async (req: NextRequest, routeParams?: any) => {
    const logger = getLogger();
    const errorHandler = getErrorHandler();
    const startTime = Date.now();
    
    try {
      // Log request
      logger.info(`API Request: ${req.method} ${req.nextUrl.pathname}`, {
        method: req.method,
        url: req.url,
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      });
      
      // Check authentication, if required
      if (options.requiresAuth) {
        // First check if auth data was already added by middleware
        // This data could come from multiple sources, check them all
        let userId: number | null = null;
        let role: string | null = null;
        let email: string | null = null;
        let name: string | null = null;
        
        // 1. Check the X-Auth-Data header (most reliable, contains all user data)
        const authDataHeader = req.headers.get('X-Auth-Data');
        if (authDataHeader) {
          try {
            const authDataJson = Buffer.from(authDataHeader, 'base64').toString('utf-8');
            const authData = JSON.parse(authDataJson);
            if (authData && typeof authData === 'object') {
              userId = authData.userId || null;
              role = authData.role || null;
              email = authData.email || null;
              name = authData.name || null;
              
              logger.debug('Auth data extracted from X-Auth-Data header');
            }
          } catch (e) {
            logger.warn('Failed to parse X-Auth-Data header:', {
              error: e instanceof Error ? e.message : String(e)
            });
          }
        }
        
        // 2. Check individual headers if complete data wasn't found
        if (userId === null) {
          const userIdHeader = req.headers.get('X-Auth-User-Id');
          if (userIdHeader) {
            userId = parseInt(userIdHeader, 10);
            logger.debug('User ID extracted from X-Auth-User-Id header');
          }
        }
        
        if (role === null) {
          role = req.headers.get('X-Auth-User-Role');
          if (role) {
            logger.debug('User role extracted from X-Auth-User-Role header');
          }
        }
        
        // 3. If auth data wasn't found in headers, try extracting from token
        if (userId === null) {
          // Check multiple token sources
          let token = null;
          
          // First check the X-Auth-Token header
          token = req.headers.get('X-Auth-Token');
          
          // If not found, check authorization header
          if (!token) {
            const authHeader = req.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
              token = authHeader.substring(7);
            }
          }
          
          // If not found, check cookies
          if (!token) {
            const cookieHeader = req.headers.get('cookie');
            if (cookieHeader) {
              const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
              const authCookie = cookies.find(cookie => cookie.startsWith('auth_token='));
              
              if (authCookie) {
                token = authCookie.split('=')[1];
                // Handle URL-encoded values
                if (token?.startsWith('%22') && token?.endsWith('%22')) {
                  token = decodeURIComponent(token);
                }
                // Remove surrounding quotes if present
                if (token?.startsWith('"') && token?.endsWith('"')) {
                  token = token.slice(1, -1);
                }
              }
            }
          }
          
          // If token was found, decode it
          if (token) {
            try {
              // Get JWT secret from security config or environment
              const jwtSecret = securityConfig.getJwtSecret() || 
                              process.env.JWT_SECRET || 
                              'default-secret-change-me';
              
              // JWT-Token validate and decode
              const decoded = jwt.verify(token, jwtSecret) as any;
              
              if (decoded && decoded.sub) {
                userId = Number(decoded.sub);
                role = decoded.role || null;
                email = decoded.email || null;
                name = decoded.name || null;
                
                logger.debug('Auth data extracted from JWT token');
              }
            } catch (tokenError) {
              logger.error('Token validation error', { 
                error: tokenError instanceof Error ? tokenError.message : String(tokenError),
                path: req.nextUrl.pathname
              });
              return formatResponse.error(
                errorHandler.createUnauthorizedError('Invalid token'),
                401
              );
            }
          }
        }
        
        // 4. If still no userId found, return unauthorized error
        if (userId === null) {
          logger.warn('No auth data found for protected route', { path: req.nextUrl.pathname });
          return formatResponse.error(
            errorHandler.createUnauthorizedError('Authentication required'),
            401
          );
        }
        
        // Verify user exists and is active
        try {
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, status: true, role: true, email: true, name: true }
          });

          if (!user) {
            logger.warn(`User not found in database for ID: ${userId}`, { path: req.nextUrl.pathname });
            return formatResponse.error(
              errorHandler.createUnauthorizedError('User not found'),
              401
            );
          }

          if (user.status !== 'active') {
            logger.warn(`User account is not active: ${userId}, status: ${user.status}`, { path: req.nextUrl.pathname });
            return formatResponse.error(
              errorHandler.createUnauthorizedError('User account is not active'),
              403
            );
          }

          // Use data from database for better security
          role = user.role;
          email = user.email;
          name = user.name;
        } catch (dbError) {
          logger.error('Database error checking user existence:', { 
            error: dbError instanceof Error ? {
              message: dbError.message,
              stack: dbError.stack
            } : String(dbError),
            path: req.nextUrl.pathname
          });
          
          // Don't proceed on database errors - security first
          return formatResponse.error(
            errorHandler.createValidationError('Error validating user'),
            500
          );
        }
        
        logger.debug('Authentication successful', { 
          userId,
          role
        });
        
        // Attach auth data to the request
        req.auth = {
          userId,
          role,
          email,
          name
        };
        
        // Check role permissions if required
        if (options.requiresRole && options.requiresRole.length > 0) {
          const userRole = role;
          // Allow role checking to be bypassed in development mode
          const bypassRoleCheck = process.env.NODE_ENV !== 'production' && 
                                 (req.headers.get('x-bypass-role-check') === 'true' ||
                                  process.env.BYPASS_ROLE_CHECK === 'true');
          
          // First check if case-insensitive match (more lenient)
          const caseInsensitiveMatch = options.requiresRole.some(role => 
            role.toLowerCase() === userRole.toLowerCase());
          
          const hasRequiredRole = options.requiresRole.includes(userRole) || caseInsensitiveMatch;
          
          if (!hasRequiredRole && !bypassRoleCheck) {
            logger.warn(`Insufficient permissions: User role '${userRole}' doesn't match required roles: ${options.requiresRole.join(', ')}`);
            return formatResponse.error(
              errorHandler.createForbiddenError('Insufficient permissions'),
              403
            );
          } else if (bypassRoleCheck) {
            logger.warn(`Role check bypassed for user ${userId} with role ${userRole}`);
          }
        }
      }
      
      // Execute the actual handler
      const response = await handler(req, routeParams);
      
      // Log response time
      const responseTime = Date.now() - startTime;
      logger.info(`API Response: ${req.method} ${req.nextUrl.pathname}`, {
        method: req.method,
        url: req.url,
        responseTime: `${responseTime}ms`,
        statusCode: response.status
      });
      
      return response;
    } catch (error) {
      // Improved error logging with better serialization
      let errorDetails = {};
      
      try {
        if (error instanceof Error) {
          errorDetails = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            code: (error as any).code
          };
        } else if (error !== null && typeof error === 'object') {
          errorDetails = Object.getOwnPropertyNames(error).reduce((acc, key) => {
            try {
              acc[key] = (error as any)[key];
            } catch (e) {
              acc[key] = 'Error accessing property';
            }
            return acc;
          }, {} as Record<string, any>);
        } else {
          errorDetails = { rawError: String(error) };
        }
      } catch (loggingError) {
        errorDetails = { serializationError: String(loggingError), originalError: String(error) };
      }
      
      logger.error(`API Error: ${req.method} ${req.nextUrl.pathname}`, {
        errorDetails,
        method: req.method,
        url: req.url,
        responseTime: `${Date.now() - startTime}ms`
      });
      
      // Use errorHandler to format errors
      const appError = errorHandler.mapError(error);
      return formatResponse.error(appError);
    }
  };
}

/**
 * Simple route handler function for API routes
 * Used to wrap handlers with try/catch and error handling
 */
export async function routeHandler(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  const logger = getLogger();
  
  try {
    return await handler();
  } catch (error) {
    // Improved error logging with better serialization
    let errorDetails = {};
    
    try {
      if (error instanceof Error) {
        errorDetails = {
          message: error.message,
          name: error.name,
          stack: error.stack,
          code: (error as any).code
        };
      } else if (error !== null && typeof error === 'object') {
        errorDetails = Object.getOwnPropertyNames(error).reduce((acc, key) => {
          try {
            acc[key] = (error as any)[key];
          } catch (e) {
            acc[key] = 'Error accessing property';
          }
          return acc;
        }, {} as Record<string, any>);
      } else {
        errorDetails = { rawError: String(error) };
      }
    } catch (loggingError) {
      errorDetails = { serializationError: String(loggingError), originalError: String(error) };
    }
    
    logger.error('API route error:', { errorDetails });
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Re-export formatResponse to make it available to routes
export { formatResponse };
