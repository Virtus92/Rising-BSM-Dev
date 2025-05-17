/**
 * Type definitions for JWT and Auth related types
 * This file extends library types with application-specific properties
 */

import { JwtPayload as OriginalJwtPayload } from 'jsonwebtoken';

declare module 'jsonwebtoken' {
  interface JwtPayload extends OriginalJwtPayload {
    // Standard claims
    iss?: string;
    sub?: string;
    aud?: string[] | string;
    exp?: number;
    nbf?: number;
    iat?: number;
    jti?: string;
    
    // Application-specific claims
    userId?: number;
    role?: string;
    email?: string;
    permissions?: string[];
  }
}

// Auth info type
export interface AuthInfo {
  id: number;
  userId: number;
  email?: string;
  role?: string;
  permissions?: string[];
  issuedAt?: number;
  expiresAt?: number;
}
