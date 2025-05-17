/**
 * Server-only API utilities
 * This file is exclusively for server contexts and should not be imported by client components
 */

// Mark this file as server-only
import 'server-only';

// Re-export all route handler utilities
export * from './route-handler';

// Type definitions from route-handler
import { 
  RouteHandler, 
  RouteHandlerOptions,
  AuthInfo
} from './route-handler';

// Re-export types for use in server components
export type { 
  RouteHandler,
  RouteHandlerOptions,
  AuthInfo
};