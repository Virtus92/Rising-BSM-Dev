/**
 * API Route Handler - CLIENT-SAFE VERSION
 * 
 * Provides utility functions for API route handlers with error handling and logging
 * This version is safe to import in client components
 */
import { formatResponse } from '../errors';
import { getLogger } from '../logging';

/**
 * Route handler options
 */
export interface RouteHandlerOptions {
  requiresAuth?: boolean;
  requiresRole?: string[];
}

/**
 * Client-safe exports that don't include server-only functionality
 * This is a stripped-down version that's safe to import in client components
 */

// Export the interface for client-side typings
export interface ClientRouteHandlerOptions {
  requiresAuth?: boolean;
  requiresRole?: string[];
}

// No implementation exposed - just dummy types for client-side usage
export const routeHandler = null;

export default {
  // Empty implementation for client components
};