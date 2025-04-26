/**
 * API Route Handler - SERVER VERSION
 * 
 * Provides utility functions for API route handlers with error handling and logging
 * This version is for server-side use only and includes next/headers imports
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '../../errors';
import { getLogger } from '../../logging';
import { cookies } from 'next/headers';
import { getAuthService } from '@/core/factories/serviceFactory';
import { ServiceOptions } from '@/domain/services/IBaseService';

/**
 * Route handler options
 */
export interface RouteHandlerOptions {
  requiresAuth?: boolean;
  requiresRole?: string[];
}

/**
 * Simple route handler function for API routes
 * Used to wrap handlers with try/catch and error handling
 */
export function routeHandler(
  handler: (request: NextRequest) => Promise<NextResponse>, 
  options?: RouteHandlerOptions
): (request: NextRequest) => Promise<NextResponse> {
  const logger = getLogger();
  
  return async (request: NextRequest) => {
    try {
      // Authentication verification if required
      if (options?.requiresAuth) {
        // Get auth token from cookies or authorization header
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token')?.value || 
                          request.headers.get('authorization')?.replace('Bearer ', '') || '';
        
        if (!authToken) {
          logger.warn('Authentication required but no token provided');
          return NextResponse.json(
            {
              success: false,
              message: 'Authentication required',
              timestamp: new Date().toISOString()
            },
            { status: 401 }
          );
        }
        
        // Verify the token
        try {
          const authService = getAuthService();
          const verificationResult = await authService.verifyToken(authToken);
          
          if (!verificationResult.valid || !verificationResult.userId) {
            logger.warn('Invalid authentication token');
            return NextResponse.json(
              {
                success: false,
                message: 'Invalid or expired authentication token',
                timestamp: new Date().toISOString()
              },
              { status: 401 }
            );
          }
          
          // Role verification if required
          if (options?.requiresRole && options.requiresRole.length > 0) {
            const userId = verificationResult.userId;
            const serviceOptions: ServiceOptions = { 
              context: { 
                requestUrl: request.url 
              } 
            };
            
            // Check if user has any of the required roles
            let hasRequiredRole = false;
            for (const role of options.requiresRole) {
              const roleCheckResult = await authService.hasRole(userId, role, serviceOptions);
              if (roleCheckResult) {
                hasRequiredRole = true;
                break;
              }
            }
            
            if (!hasRequiredRole) {
              logger.warn(`User ${userId} does not have required roles [${options.requiresRole.join(', ')}]`);
              return NextResponse.json(
                {
                  success: false,
                  message: 'Insufficient permissions',
                  timestamp: new Date().toISOString()
                },
                { status: 403 }
              );
            }
          }
          
          // Attach the userId to the request for use in the handler
          (request as any).userId = verificationResult.userId;
        } catch (authError) {
          logger.error('Error during authentication verification:', authError as Error);
          return NextResponse.json(
            {
              success: false,
              message: 'Authentication error',
              timestamp: new Date().toISOString()
            },
            { status: 401 }
          );
        }
      }
      
      return await handler(request);
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
        errorDetails = { serializationError: String(loggingError), originalError: String(error || 'Unknown error') };
      }
      
      logger.error('API route error:', errorDetails);
      
      return NextResponse.json(
        {
          success: false,
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  };
}

export default {
  routeHandler
};