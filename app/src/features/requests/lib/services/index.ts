// Export server-side implementation for server contexts
export * from './RequestService';
export * from './RequestDataService';

// Export client-side implementations for client components
// The RequestService.client.ts exports a properly typed version with all required static methods
export { RequestService } from './RequestService.client';
export * from './RequestClient';
