/**
 * Type definitions for API components
 * This file contains only type definitions which are safe to import in both client and server contexts
 */

import { NextRequest, NextResponse } from 'next/server';
import { ErrorResponse, SuccessResponse } from '@/core/errors/types/ApiTypes';

/**
 * Auth information added to request by middleware
 */
export interface AuthInfo {
  /**
   * User ID
   */
  userId: number;
  
  /**
   * User role
   */
  role?: string;
  
  /**
   * User name
   */
  name?: string;
  
  /**
   * User email
   */
  email?: string;
  
  /**
   * Token expiration timestamp
   */
  exp?: number;
}

/**
 * Route handler options
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
   * Legacy alias for requiredRoles (for backward compatibility)
   */
  requiresRole?: string[];
  
  /**
   * Whether to skip the default error handler
   */
  skipErrorHandler?: boolean;
  
  /** Required permission */
  requiredPermission?: string | string[];
  
  /**
   * Whether to include detailed error information
   */
  detailedErrors?: boolean;
}

/**
 * Route handler type
 * Ensures consistent response types
 */
export type RouteHandler<T = any> = (request: NextRequest, ...args: any[]) => Promise<NextResponse<ErrorResponse | SuccessResponse<T>>>;