'use client';

// IMPORTANT: For client components, always import CustomerService directly from CustomerService.client:
// import { CustomerService } from '@/features/customers/lib/services/CustomerService.client';
//
// DO NOT import CustomerService from this index file in client components to avoid
// accidental server-side imports.

// Export client service for client-side pages
export { CustomerService } from './CustomerService.client';

// Export server service for server-side operations only in server context
// We use dynamic imports to prevent client-side code from importing server-only modules
export const getCustomerServiceServer = () => {
  if (typeof window === 'undefined') {
    // Server-side: dynamically import the server service
    return import('./CustomerService.server').then(module => module.CustomerService);
  } else {
    // Client-side: return an error or null
    throw new Error('Cannot use server-only CustomerService in client components');
  }
};

// Re-export default for backward compatibility
import { CustomerService as DefaultCustomerService } from './CustomerService';
export default DefaultCustomerService;
