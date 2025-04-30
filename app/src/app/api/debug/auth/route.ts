import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { getLogger } from '@/core/logging';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

const logger = getLogger();

/**
 * API handler for auth and permission diagnostics
 * This endpoint provides detailed information about the current auth state and permissions
 * Only available to administrators for security reasons
 * 
 * @param request NextRequest with auth information
 * @returns Diagnostic information in a structured format
 */
export async function GET(request: NextRequest) {
  try {
    // Extract userId from auth
    const userId = request.auth?.userId;
    
    // If no userId, return unauthorized
    if (!userId) {
      return formatResponse.unauthorized('Authentication required for auth diagnostics');
    }
    
    // Check if user has admin permission
    const permissionCheck = await permissionMiddleware.checkPermission(
      request, 
      SystemPermission.SYSTEM_ADMIN
    );
    
    if (!permissionCheck.success) {
      return formatResponse.forbidden(
        'Admin permission required to access authentication diagnostics', 
        { permissionCheck }.toString()
      );
    }
    
    // Get service factory and services
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    const permissionService = serviceFactory.createPermissionService();
    const authService = serviceFactory.createAuthService();
    
    // Check if services are available
    if (!userService || !permissionService) {
      return formatResponse.error(
        'Required services not available', 
        500, 
        { 
          availableServices: {
            userService: !!userService,
            permissionService: !!permissionService,
            authService: !!authService
          }
        }.toString()
      );
    }
    
    // Collect user information
    const user = await userService.getById(userId);
    if (!user) {
      return formatResponse.error(
        'User not found despite valid authentication', 
        500, 
        { userId }.toString()
      );
    }
    
    // Get user permissions (without caching)
    const permissions = await permissionService.getUserPermissions(userId);
    
    // Extract auth info from headers
    const authHeaders = {
      authorization: request.headers.get('authorization'),
      cookie: request.headers.get('cookie'),
      xAuthToken: request.headers.get('x-auth-token')
    };
    
    // Get auth token from cookie (if any)
    const getCookieValue = (cookieString: string | null, name: string): string | null => {
      if (!cookieString) return null;
      const matches = cookieString.match(new RegExp(`${name}=([^;]+)`));
      return matches ? decodeURIComponent(matches[1]) : null;
    };
    
    const cookieString = request.headers.get('cookie');
    const authTokenFromCookie = getCookieValue(cookieString, 'auth_token');
    const refreshTokenFromCookie = getCookieValue(cookieString, 'refresh_token');
    
    // Check x-auth-token header
    const xAuthToken = request.headers.get('x-auth-token');
    
    // Check both token sources
    const tokenStatus = {
      hasCookieToken: !!authTokenFromCookie,
      hasRefreshToken: !!refreshTokenFromCookie,
      hasXAuthToken: !!xAuthToken,
      tokenMatch: authTokenFromCookie === xAuthToken
    };
    
    // Get all cookies for debugging
    const cookies = cookieString ? 
      Object.fromEntries(
        cookieString.split(';')
          .map(cookie => cookie.trim().split('='))
          .map(([key, value]) => [key, decodeURIComponent(value)])
      ) : {};
    
    // Collect diagnostic information
    const diagnosticInfo = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status
      },
      permissions: permissions,
      auth: {
        headers: authHeaders,
        tokenStatus,
        cookies: Object.keys(cookies)
      },
      services: {
        userService: !!userService,
        permissionService: !!permissionService,
        authService: !!authService
      },
      systemInfo: {
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    };
    
    // Return diagnostic information
    return formatResponse.success(
      diagnosticInfo, 
      'Authentication and permission diagnostic information'
    );
  } catch (error) {
    // Log error and return error response
    logger.error('Error in auth diagnostics endpoint', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined 
    });
    
    return formatResponse.error(
      `Error getting authentication diagnostics: ${error instanceof Error ? error.message : String(error)}`, 
      500
    );
  }
}

/**
 * Options handler for CORS
 */
export function OPTIONS() {
  return formatResponse.success(null, 'OK');
}