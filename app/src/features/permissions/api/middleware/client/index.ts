'use client';

/**
 * Client-side exports for Permission Middleware
 * THIS FILE SHOULD NOT IMPORT SERVER-ONLY MODULES
 */

import { API_PERMISSIONS } from './permissionMiddleware';

// Re-export API_PERMISSIONS which is the only part needed on the client
export { API_PERMISSIONS };

// Export typed middleware object with constants
export const permissionMiddleware = {
  API_PERMISSIONS,
};

// Default export for compatibility
export default permissionMiddleware;
