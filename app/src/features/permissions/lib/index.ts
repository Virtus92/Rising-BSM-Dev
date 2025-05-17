/**
 * Permissions Library Exports
 */

// Export domain entities, services, and repositories
export * from './entities';
export * from './repositories';

// Note: Do not directly import PermissionService.ts here as it's server-only
// Client code should use the factory to get the right implementation

// Safe client exports
import { permissionService as permissionServiceClient } from './services/PermissionService.client';
export { permissionServiceClient };

// Export clients for direct API access
export * from './clients';

