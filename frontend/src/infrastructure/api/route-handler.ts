import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from './response-formatter';
import { getLogger } from '../common/logging';
import { getErrorHandler } from '../common/bootstrap';
import jwt from 'jsonwebtoken';

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
        const authHeader = req.headers.get('authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return formatResponse.error(
            errorHandler.createUnauthorizedError('Authentication required'),
            401
          );
        }
        
        // Token aus dem Authorization-Header extrahieren
        const token = authHeader.replace('Bearer ', '');
        
        try {
          // JWT-Token validieren und dekodieren
          const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me';
          const decoded = jwt.verify(token, jwtSecret) as any;
          
          if (!decoded || !decoded.sub) {
            return formatResponse.error(
              errorHandler.createUnauthorizedError('Invalid authentication token'),
              401
            );
          }
          
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
          logger.error('Token validation error', { error: tokenError });
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
      // Protokolliere Fehler
      logger.error(`API Error: ${req.method} ${req.nextUrl.pathname}`, {
        error,
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
    logger.error('API route error:', { error });
    
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
