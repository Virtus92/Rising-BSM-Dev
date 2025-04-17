/**
 * Auth middleware for API routes
 * Uses the standardized apiRouteHandler for consistency
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';

export interface AuthOptions {
  requiresRoles?: string[];
  throwOnFail?: boolean;
}

/**
 * Wrapper for apiRouteHandler with auth options
 * Use this for backward compatibility with existing code
 */
export function withAuth(handler: Function, options: AuthOptions = {}) {
  return apiRouteHandler(async (req: NextRequest, params?: any) => {
    return await handler(req, { user: req.auth });
  }, {
    requiresAuth: true,
    requiresRole: options.requiresRoles
  });
}

export async function getServerSession(req: NextRequest) {
  // Use auth from the request which was already processed by middleware
  if (req.auth) {
    return {
      user: {
        id: req.auth.userId,
        name: req.auth.name,
        email: req.auth.email,
        role: req.auth.role
      }
    };
  }
  
  return null;
}

export async function auth(req: Request, options: AuthOptions = {}) {
  // Compatibility layer for old auth function
  // Return format matches old format for compatibility
  return {
    success: true,
    user: {
      id: (req as any).auth?.userId,
      name: (req as any).auth?.name,
      email: (req as any).auth?.email,
      role: (req as any).auth?.role
    }
  };
}

export async function authMiddleware(req: NextRequest) {
  return getServerSession(req);
}

export function withApiAuth(handler: Function, options: AuthOptions = {}) {
  return apiRouteHandler(async (req: NextRequest, params?: any) => {
    return await handler(req, { user: req.auth }, params);
  }, {
    requiresAuth: true,
    requiresRole: options.requiresRoles
  });
}

export default {
  getServerSession,
  withAuth,
  auth,
  authMiddleware,
  withApiAuth
};
