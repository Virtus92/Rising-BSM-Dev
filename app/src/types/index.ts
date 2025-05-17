/**
 * Type definitions index file
 * This file imports and re-exports all key types used throughout the application.
 */

// Import core Next.js types
import type { NextRequest, NextResponse } from 'next/server';

// Import JWT types
import type { JwtPayload } from 'jsonwebtoken';

// Re-export all types for easier access
export type { AuthInfo, ExtendedRequest, AuthError, ApiErrorResponse } from './types/auth';

// Export AuthErrorType enum directly
export { AuthErrorType } from './types/auth';

// Type augmentation for Next.js Request
declare global {
  interface Request {
    auth?: import('./types/auth').AuthInfo;
  }
}

// Extend JWT payload to include our custom properties
declare module 'jsonwebtoken' {
  interface JwtPayload {
    id?: number;
    userId?: number;
    email?: string;
    role?: string;
    permissions?: string[];
    sub?: string;
  }
}

// Export default to make this a proper module
export default {};
