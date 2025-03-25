/**
 * Request Types
 * 
 * Type definitions for Express request extensions.
 */
import { Request } from 'express';

/**
 * Extension of Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  /**
   * Authenticated user
   */
  user?: {
    /**
     * User ID
     */
    id: number;
    
    /**
     * User name
     */
    name: string;
    
    /**
     * User email
     */
    email: string;
    
    /**
     * User role
     */
    role: string;
  };
  
  /**
   * Validated request body
   */
  validatedData?: any;
  
  /**
   * Validated query parameters
   */
  validatedQuery?: any;
  
  /**
   * Validated URL parameters
   */
  validatedParams?: any;
}

/**
 * Extension of Express Request with validation results
 */
export interface ValidatedRequest extends Request {
  /**
   * Validated request body
   */
  validatedData?: any;
  
  /**
   * Validated query parameters
   */
  validatedQuery?: any;
  
  /**
   * Validated URL parameters
   */
  validatedParams?: any;
}

/**
 * Type guard to check if a request is authenticated
 * 
 * @param req - Request to check
 * @returns Whether the request is authenticated
 */
export function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return 'user' in req && req.user !== undefined;
}

/**
 * Safely get user ID from request
 * 
 * @param req - Request to extract user ID from
 * @returns User ID or undefined
 */
export function getUserId(req: Request): number | undefined {
  return isAuthenticatedRequest(req) ? req.user?.id : undefined;
}

/**
 * Safely get user role from request
 * 
 * @param req - Request to extract user role from
 * @returns User role or undefined
 */
export function getUserRole(req: Request): string | undefined {
  return isAuthenticatedRequest(req) ? req.user?.role : undefined;
}