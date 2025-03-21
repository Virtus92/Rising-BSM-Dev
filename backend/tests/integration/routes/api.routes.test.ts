import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Create mock router instance
const mockRouterInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn()
};

// Create a mock router function that returns the mock instance
const mockRouter = jest.fn().mockReturnValue(mockRouterInstance);

// Mock Express FIRST - before any imports that would use it
jest.mock('express', () => ({
  Router: mockRouter
}));

// Mock middleware
const mockAuthenticate = jest.fn();
const mockIsAdmin = jest.fn();

jest.mock('../../../middleware/auth.middleware', () => ({
  authenticate: mockAuthenticate,
  isAdmin: mockIsAdmin
}));

// Mock controller functions
const mockGetAllCustomers = jest.fn();
const mockGetCustomerById = jest.fn();
const mockCreateCustomer = jest.fn();
const mockGetSystemSettings = jest.fn();

// Mock controllers
jest.mock('../../../controllers/customer.controller', () => ({
  getAllCustomers: mockGetAllCustomers,
  getCustomerById: mockGetCustomerById,
  createCustomer: mockCreateCustomer
}));

jest.mock('../../../controllers/settings.controller', () => ({
  getSystemSettings: mockGetSystemSettings
}));

// Import the module under test AFTER setting up all mocks
import '../../../routes/api.routes';

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should be an Express router', () => {
    // Verify Router was called when the module was imported
    expect(mockRouter).toHaveBeenCalled();
  });
  
  test('should register customer routes with authentication', () => {
    // Find the calls to mockRouterInstance.get with '/customers'
    const customersRoute = mockRouterInstance.get.mock.calls.find(
      call => call[0] === '/customers'
    );
    
    // Verify the route was registered with authentication
    expect(customersRoute).toBeDefined();
    expect(customersRoute![1]).toBe(mockAuthenticate);
    expect(customersRoute![2]).toBe(mockGetAllCustomers);
    
    // Find the call to mockRouterInstance.get with '/customers/:id'
    const customerByIdRoute = mockRouterInstance.get.mock.calls.find(
      call => call[0] === '/customers/:id'
    );
    
    // Verify the route was registered with authentication
    expect(customerByIdRoute).toBeDefined();
    expect(customerByIdRoute![1]).toBe(mockAuthenticate);
    expect(customerByIdRoute![2]).toBe(mockGetCustomerById);
  });
  
  test('should register admin-only routes with isAdmin middleware', () => {
    // Find the calls to routes with admin middleware
    const adminRoute = mockRouterInstance.get.mock.calls.find(
      call => call[0] === '/settings/system'
    );
    
    // Verify the route was registered with admin middleware
    expect(adminRoute).toBeDefined();
    expect(adminRoute![1]).toBe(mockAuthenticate);
    expect(adminRoute![2]).toBe(mockIsAdmin);
    expect(adminRoute![3]).toBe(mockGetSystemSettings);
  });
});