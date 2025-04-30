/**
 * Authentication Helpers
 * 
 * Helper functions for working with authentication in route handlers
 */
import { NextRequest } from 'next/server';
import { getLogger } from '@/core/logging';

/**
 * Gets user ID from either session or request.auth
 * Support both new and legacy authentication patterns
 * 
 * @param request - The Next.js request 
 * @param session - The session object (optional if using req.auth)
 * @returns User ID from session or request.auth
 */
export function getUserId(request: NextRequest, session?: any): number | undefined {
  try {
    // Check request.auth first (compatibility layer)
    if ((request as any).auth?.userId) {
      return (request as any).auth.userId;
    }
    
    // Then check session if provided
    if (session?.user?.id) {
      return session.user.id;
    }
    
    // No valid user ID found
    return undefined;
  } catch (error) {
    getLogger().error('Error getting user ID:', { error });
    return undefined;
  }
}

/**
 * Gets user role from either session or request.auth
 * Support both new and legacy authentication patterns
 * 
 * @param request - The Next.js request
 * @param session - The session object (optional if using req.auth)
 * @param defaultRole - Default role to return if none found
 * @returns User role from session or request.auth or the default role
 */
export function getUserRole(request: Request, session?: any, defaultRole: string = 'user'): string {
  try {
    // Check request.auth first (compatibility layer)
    if ((request as any).auth?.role) {
      return (request as any).auth.role;
    }
    
    // Then check session if provided
    if (session?.user?.role) {
      return session.user.role;
    }
    
    // No valid role found, return default
    return defaultRole;
  } catch (error) {
    getLogger().error('Error getting user role:', { error });
    return defaultRole;
  }
}

/**
 * Gets complete user data from either session or request.auth
 * Support both new and legacy authentication patterns
 * 
 * @param request - The Next.js request
 * @param session - The session object (optional if using req.auth)
 * @returns User data object or undefined if none found
 */
export function getUserData(request: Request, session?: any): any | undefined {
  try {
    // Check request.auth first (compatibility layer)
    if ((request as any).auth?.user) {
      return (request as any).auth.user;
    }
    
    // Then check request.auth directly
    if ((request as any).auth?.userId || (request as any).auth?.email) {
      return (request as any).auth;
    }
    
    // Then check session if provided
    if (session?.user) {
      return session.user;
    }
    
    // No valid user data found
    return undefined;
  } catch (error) {
    getLogger().error('Error getting user data:', { error });
    return undefined;
  }
}

/**
 * Gets authentication status from either session or request.auth
 * 
 * @param request - The Next.js request
 * @param session - The session object (optional if using req.auth)
 * @returns Boolean indicating whether user is authenticated
 */
export function isAuthenticated(request: Request, session?: any): boolean {
  try {
    // Check request.auth first (compatibility layer)
    if ((request as any).auth?.authenticated === true) {
      return true;
    }
    
    // Then check for user ID in request.auth
    if ((request as any).auth?.userId) {
      return true;
    }
    
    // Then check session if provided
    if (session?.user?.id) {
      return true;
    }
    
    // No valid authentication found
    return false;
  } catch (error) {
    getLogger().error('Error checking authentication status:', { error });
    return false;
  }
}

// Export as a named object for easier importing
export const authHelpers = {
  getUserId,
  getUserRole,
  getUserData,
  isAuthenticated
};

export default authHelpers;
