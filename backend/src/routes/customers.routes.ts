import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { UserRole } from '../entities/User.js';

/**
 * Create customer routes with comprehensive access control
 * 
 * @param customerController - Customer management controller
 * @param authMiddleware - Authentication and authorization middleware
 * @returns Configured router for customer endpoints
 */
export function createCustomerRoutes(
  customerController: CustomerController, 
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Middleware configurations
  const managerAndAdminAccess = [
    authMiddleware.authenticate(),
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER])
  ];

  const adminOnlyAccess = [
    authMiddleware.authenticate(),
    authMiddleware.authorize([UserRole.ADMIN])
  ];

  // Public statistics (possibly with access control)
  router.get('/statistics', 
    ...managerAndAdminAccess, 
    customerController.getCustomerStatistics
  );

  // Comprehensive search with flexible access
  router.get('/search', 
    ...managerAndAdminAccess, 
    customerController.searchCustomers
  );

  // Export customers (admin-only)
  router.get('/export', 
    ...adminOnlyAccess, 
    customerController.exportCustomers
  );

  // Bulk operations (strict admin control)
  router.post('/bulk-update', 
    ...adminOnlyAccess, 
    customerController.bulkUpdateCustomers
  );

  // Standard CRUD routes with granular permissions
  router.get('/', 
    ...managerAndAdminAccess, 
    customerController.getAllCustomers
  );

  router.post('/', 
    ...managerAndAdminAccess, 
    customerController.createCustomer
  );

  router.get('/:id', 
    ...managerAndAdminAccess, 
    customerController.getCustomerById
  );

  router.put('/:id', 
    ...managerAndAdminAccess, 
    customerController.updateCustomer
  );

  router.delete('/:id', 
    ...adminOnlyAccess, 
    customerController.deleteCustomer
  );

  // Status management (manager and admin)
  router.patch('/:id/status', 
    ...managerAndAdminAccess, 
    customerController.updateCustomerStatus
  );

  // Additional insights and relationship routes
  router.get('/:id/insights', 
    ...managerAndAdminAccess, 
    customerController.getCustomerInsights
  );

  router.get('/:id/similar', 
    ...managerAndAdminAccess, 
    customerController.getSimilarCustomers
  );

  router.get('/:id/history', 
    ...managerAndAdminAccess, 
    customerController.getCustomerHistory
  );

  // Note management
  router.post('/:id/notes', 
    ...managerAndAdminAccess, 
    customerController.addCustomerNote
  );

  return router;
}