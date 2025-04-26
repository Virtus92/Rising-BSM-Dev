/**
 * Auth Middleware Index
 * 
 * This file conditionally exports the server or client version of the auth middleware
 * to ensure client components don't import server-only APIs
 */

// Detect the environment - 'use client' directives are processed before any imports
// For client components, import the client-safe version
// For server components, import the full version with server-only APIs

// Export client-safe versions that can be imported by client components
export * from './client/authMiddleware';
export { default as authMiddleware } from './client/authMiddleware';
export { default as apiAuth } from './client/authMiddleware';

// NOTE: Server components should import directly from './authMiddleware'
// Example: import { getServerSession } from '@/features/auth/api/middleware/authMiddleware';