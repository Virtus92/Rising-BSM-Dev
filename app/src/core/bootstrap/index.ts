/**
 * Bootstrap module exports
 * This file exports all bootstrap-related functionality
 */

// Export main bootstrap function and utilities
export { 
  bootstrap, 
  resetServices, 
  getErrorHandler, 
  getValidationService 
} from './bootstrap';

// Export client bootstrap (only in client environments)
if (typeof window !== 'undefined') {
  const { bootstrapClient, resetClientServices } = require('./bootstrap.client');
  exports.bootstrapClient = bootstrapClient;
  exports.resetClientServices = resetClientServices;
}

// Export server bootstrap (only in server environments)
if (typeof window === 'undefined' && !process.env.NEXT_RUNTIME) {
  const { bootstrapServer, resetServices: resetServerServices } = require('./bootstrap.server');
  exports.bootstrapServer = bootstrapServer;
  exports.resetServerServices = resetServerServices;
}
