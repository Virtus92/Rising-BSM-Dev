// Export server-side implementation for server contexts
export { RequestService as RequestServiceServer } from './RequestService';
export * from './RequestDataService';

// Export client-side implementation as the default RequestService for client components
export { default as RequestService } from './RequestService.client';

// Also export client-side implementation with explicit name for clarity when needed
export { RequestService as RequestServiceClient } from './RequestService.client';

// Export additional client tools
export * from '../clients/RequestClient';
