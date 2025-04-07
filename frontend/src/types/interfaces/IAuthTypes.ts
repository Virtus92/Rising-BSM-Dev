import { NextRequest } from 'next/server';

/**
 * Enhanced Next.js Request with Authentication Context
 * Extends standard NextRequest with optional authenticated user information
 */
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: number;
    role: string;
    email: string;
    name?: string;
    permissions?: string[];
    [key: string]: any;
  };
}

/**
 * Extended JWT Payload with Comprehensive User Details
 * Includes standard claims and additional user information
 */
export interface JwtPayload {
  /**
   * Subject (user identifier)
   */
  sub?: string;

  /**
   * User ID
   */
  userId: number;

  /**
   * User email
   */
  email: string;

  /**
   * User display name
   */
  name: string;

  /**
   * User role
   */
  role: string;

  /**
   * Optional user permissions
   */
  permissions?: string[];

  /**
   * Issued at timestamp
   */
  iat: number;

  /**
   * Expiration timestamp
   */
  exp: number;

  /**
   * Token type (access/refresh)
   */
  type?: 'access' | 'refresh';
}

/**
 * Comprehensive Authentication Context
 * Provides detailed information about the authenticated user
 */
export interface AuthContext {
  /**
   * Unique user identifier
   */
  userId: number;

  /**
   * User's role
   */
  role: string;

  /**
   * User's email address
   */
  email: string;

  /**
   * User's display name
   */
  name: string;

  /**
   * User's specific permissions
   */
  permissions?: string[];

  /**
   * Authentication token
   */
  token?: string;
}
