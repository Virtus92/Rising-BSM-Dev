import apiRoutes from '../../../routes/api.routes';
import { Router } from 'express';
import { authenticate, isAdmin } from '../../../middleware/auth.middleware';
import { describe, test, expect, jest } from '@jest/globals';

// Mock Express Router
jest.mock('express', () => ({
  Router: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }))
}));

// Mock middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticate: jest.fn(),
  isAdmin: jest.fn()
}));

// Mock controllers
jest.mock('../../controllers/customer.controller', () => ({
  getAllCustomers: jest.fn(),
  getCustomerById: jest.fn(),
  createCustomer: jest.fn(),
  updateCustomer: jest.fn(),
  updateCustomerStatus: jest.fn(),
  addCustomerNote: jest.fn(),
  deleteCustomer: jest.fn()
}));

describe('API Routes', () => {
  test('should be an Express router', () => {
    expect(Router).toHaveBeenCalled();
  });
  
  test('should register customer routes with authentication', () => {
    const router = (Router as unknown as jest.Mock)();
    
    expect(router.get).toHaveBeenCalledWith('/customers', authenticate, expect.any(Function));
    expect(router.get).toHaveBeenCalledWith('/customers/:id', authenticate, expect.any(Function));
    expect(router.post).toHaveBeenCalledWith('/customers', authenticate, expect.any(Function));
    expect(router.put).toHaveBeenCalledWith('/customers/:id', authenticate, expect.any(Function));
    expect(router.patch).toHaveBeenCalledWith('/customers/status', authenticate, expect.any(Function));
    expect(router.post).toHaveBeenCalledWith('/customers/:id/notes', authenticate, expect.any(Function));
    expect(router.delete).toHaveBeenCalledWith('/customers/:id', authenticate, expect.any(Function));
  });
  
  test('should register admin-only routes with isAdmin middleware', () => {
    const router = (Router as unknown as jest.Mock)();
    
    // Look for settings routes that require admin privileges
    const adminRouteCalls = (router.get as jest.Mock).mock.calls.filter(
      call => call[0].includes('/settings/system') && call.includes(isAdmin)
    );
    
    expect(adminRouteCalls.length).toBeGreaterThan(0);
  });
});