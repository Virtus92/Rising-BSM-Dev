/**
 * Permissions Middleware exports
 * This file conditionally exports the server or client implementation based on context
 */
import { API_PERMISSIONS } from './client';

// Export the API permissions constants directly from client module
// This ensures they're always available in both client and server contexts
export { API_PERMISSIONS };

// Conditional exports for server vs client
// By checking for process.env.__NEXT_PRIVATE_PREBUNDLED_REACT, we can determine if we're in a server context
// This is a Next.js internal environment variable that's present in server contexts
let permissionMiddleware: any; 

if (typeof window === 'undefined') {
  // Server context - import server implementation
  permissionMiddleware = require('./permissionMiddleware').permissionMiddleware;
} else {
  // Client context - use client-safe implementation
  permissionMiddleware = require('./client').permissionMiddleware;
}

// Export the appropriate middleware implementation
export { permissionMiddleware };
export default permissionMiddleware;

// Types
export type { PermissionCheckResult } from './client';
