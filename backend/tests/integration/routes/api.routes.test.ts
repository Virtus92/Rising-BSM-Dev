import apiRoutes from '../../../routes/api.routes';
import { Router } from 'express';
import { authenticate, isAdmin } from '../../../middleware/auth.middleware';
import { describe, test, expect, jest } from '@jest/globals';

// Create a strongly typed mock router
const mockRouter = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn()
};

// Mock Express Router
jest.mock('express', () => ({
  Router: jest.fn(() => mockRouter)
}));

// Mock middleware
jest.mock('../../../middleware/auth.middleware', () => ({
  authenticate: jest.fn(),
  isAdmin: jest.fn()
}));

// Mock controllers
jest.mock('../../../controllers/customer.controller', () => ({
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
    expect(mockRouter.get).toHaveBeenCalledWith('/customers', authenticate, expect.any(Function));
    expect(mockRouter.get).toHaveBeenCalledWith('/customers/:id', authenticate, expect.any(Function));
    expect(mockRouter.post).toHaveBeenCalledWith('/customers', authenticate, expect.any(Function));
    expect(mockRouter.put).toHaveBeenCalledWith('/customers/:id', authenticate, expect.any(Function));
    expect(mockRouter.patch).toHaveBeenCalledWith('/customers/status', authenticate, expect.any(Function));
    expect(mockRouter.post).toHaveBeenCalledWith('/customers/:id/notes', authenticate, expect.any(Function));
    expect(mockRouter.delete).toHaveBeenCalledWith('/customers/:id', authenticate, expect.any(Function));
  });
  
  test('should register admin-only routes with isAdmin middleware', () => {
    // Find admin routes by checking if they include isAdmin middleware
    const adminRoutes = mockRouter.get.mock.calls.filter(
      call => call.includes(isAdmin)
    );
    
    expect(adminRoutes.length).toBeGreaterThan(0);
  });
});