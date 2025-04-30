/**
 * Server-Side Token Manager Index
 * This file provides a proper way to access server-side token functionality
 * 
 * IMPORTANT: This file should only be imported in server-side code (API routes or RSC)
 * Never import this in client components!
 */

import { ServerTokenManager, serverTokenManager } from './TokenManager.server';

// Export the class 
export { ServerTokenManager };

// Export the singleton instance as the default export for convenience
export default serverTokenManager;

// Also export it as a named export for backward compatibility
export { serverTokenManager };
