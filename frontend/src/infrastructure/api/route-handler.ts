import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from './response-formatter';
import { getLogger } from '../common/logging';
import { getErrorHandler } from '../common/bootstrap';
import jwt from 'jsonwebtoken';
import { securityConfig } from '../common/config/SecurityConfig';

/**
 * API-Route-Handler-Typ
 */
type ApiRouteHandler = (
  req: NextRequest,
  params?: { [key: string]: string }
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
  return async (req: NextRequest, params?: { [key: string]: string }) => {
    const logger = getLogger();
    const errorHandler = getErrorHandler();
    const startTime = Date.now();
    
    try {
      // Protokolliere Anfrage
      logger.info(`API Request: ${req.method} ${req.nextUrl.pathname}`, {
        method: req.method,
        url: req.url,
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      });
      
      // Authentifizierung prüfen, falls erforderlich
      if (options.requiresAuth) {
        // Check multiple token sources
        let token = null;
        let tokenSource = 'none';
        
        // 1. Check cookies
        const cookieHeader = req.headers.get('cookie');
        if (cookieHeader) {
          const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
          // Check multiple possible cookie names
          const authCookie = cookies.find(cookie => 
              cookie.startsWith('auth_token=') ||
              cookie.startsWith('token=') ||
              cookie.startsWith('authorization=') ||
              cookie.startsWith('auth='));
          
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
            tokenSource = 'cookie';
          }
        }
        
        // 2. If no token in cookies, check authorization header
        if (!token) {
          const authHeader = req.headers.get('authorization');
          if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.substring(7);
            tokenSource = 'authorization';
          }
        }
        
        // 3. Check X-Auth-Token header
        if (!token) {
          const xAuthToken = req.headers.get('x-auth-token');
          if (xAuthToken) {
            token = xAuthToken;
            tokenSource = 'x-auth-token';
          }
        }
        
        // 4. Check session-related headers
        if (!token) {
          const sessionToken = req.headers.get('session-token') || req.headers.get('session');
          if (sessionToken) {
            token = sessionToken;
            tokenSource = 'session-token';
          }
        }
        
        // If no token found in any location
        if (!token) {
          logger.warn('No token found for protected route', { path: req.nextUrl.pathname });
          return formatResponse.error(
            errorHandler.createUnauthorizedError('Authentication required'),
            401
          );
        }
        
        try {
          // Get JWT secret from security config or environment
          const jwtSecret = securityConfig.getJwtSecret() || 
                          process.env.JWT_SECRET || 
                          'default-secret-change-me';
          
          // JWT-Token validieren und dekodieren
          const decoded = jwt.verify(token, jwtSecret) as any;
          
          if (!decoded || !decoded.sub) {
            return formatResponse.error(
              errorHandler.createUnauthorizedError('Invalid authentication token'),
              401
            );
          }
          
          // For development only: Log token information
          logger.debug('Token validation successful', { 
            sub: decoded.sub,
            tokenSource,
            exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'none'
          });
          
          // Authentifizierungsdaten an die Request anhängen
          (req as any).auth = {
            userId: Number(decoded.sub),
            role: decoded.role,
            email: decoded.email,
            name: decoded.name
          };
          
          // Prüfe Rollenberechtigungen, falls erforderlich
          if (options.requiresRole && options.requiresRole.length > 0) {
            const userRole = decoded.role;
            const hasRequiredRole = options.requiresRole.includes(userRole);
            
            if (!hasRequiredRole) {
              return formatResponse.error(
                errorHandler.createForbiddenError('Insufficient permissions'),
                403
              );
            }
          }
        } catch (tokenError) {
          logger.error('Token validation error', { 
            error: tokenError instanceof Error ? tokenError.message : String(tokenError),
            tokenSource,
            path: req.nextUrl.pathname
          });
          return formatResponse.error(
            errorHandler.createUnauthorizedError('Invalid token'),
            401
          );
        }
      }
      
      // Führe den eigentlichen Handler aus
      const response = await handler(req, params);
      
      // Protokolliere Antwortzeit
      const responseTime = Date.now() - startTime;
      logger.info(`API Response: ${req.method} ${req.nextUrl.pathname}`, {
        method: req.method,
        url: req.url,
        responseTime: `${responseTime}ms`,
        statusCode: response.status
      });
      
      return response;
    } catch (error) {
      // Protokolliere Fehler mit verbesserter Fehlerserializierung
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
      
      // Verwende errorHandler, um Fehler zu formatieren
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
