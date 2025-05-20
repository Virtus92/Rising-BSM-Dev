/**
 * Type definitions for API components
 * This file contains only type definitions which are safe to import in both client and server contexts
 */

import { NextRequest, NextResponse } from 'next/server';
import { MiddlewareFunction } from './server/route-handler';
import { UserRole } from '@/domain/entities/User';

/**
 * Standardized API response structure
 */
export interface ApiResponse<T = any> {
  /**
   * Whether the request was successful
   */
  success: boolean;
  
  /**
   * Response data (only present on success)
   */
  data: T | null;
  
  /**
   * Error information (only present on failure)
   */
  error: string | null;
  
  /**
   * Optional status code
   */
  statusCode?: number;
  
  /**
   * @deprecated Use error property instead
   */
  message?: string;

  /**
   * Metadata for the response (pagination, etc.)
   */
  meta?: Record<string, any>;
}

/**
 * Auth information added to request by middleware
 */
export interface AuthInfo {
  /**
   * User object
   */
  user: {
    /**
     * User ID
     */
    id: number;
    
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
    email: string;
  };
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
   * Required role for accessing this route (single role)
   */
  requiredRole?: UserRole | UserRole[];
  
  /**
   * Required permissions for accessing this route
   */
  requiredPermission?: string | string[];
  
  /**
   * Whether to skip the default error handler
   */
  skipErrorHandler?: boolean;
  
  /**
   * Custom middleware to apply to the route
   */
  middleware?: MiddlewareFunction[];
}

/**
 * Route handler type
 * Ensures consistent response types
 */
export type RouteHandler<T = any> = (request: NextRequest, ...args: any[]) => Promise<NextResponse<ApiResponse<T>>>;

/**
 * API request error class for standardized error handling
 */
export class ApiRequestError extends Error {
  public statusCode: number;
  public data: any;
  
  constructor(message: string, statusCode: number = 500, data: any = null) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.data = data;
  }
}
