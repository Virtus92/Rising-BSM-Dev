import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { Router } from 'express';

// First, clear the module cache to ensure our mocks will be used
jest.resetModules();

// Create mock router instance
const mockRouterInstance = {  
  get: jest.fn().mockReturnThis(),
  post: jest.fn().mockReturnThis(),
  put: jest.fn().mockReturnThis(),
  patch: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis()
};

// Create a mock router function that returns the mock instance
const mockRouter = jest.fn().mockImplementation(() => mockRouterInstance);

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
const mockUpdateCustomer = jest.fn();
const mockUpdateCustomerStatus = jest.fn();
const mockAddCustomerNote = jest.fn();
const mockDeleteCustomer = jest.fn();
const mockGetSystemSettings = jest.fn();
const mockUpdateSystemSettings = jest.fn();
const mockGetBackupSettings = jest.fn();
const mockUpdateBackupSettings = jest.fn();
const mockTriggerManualBackup = jest.fn();
const mockGetUserSettings = jest.fn();
const mockUpdateUserSettings = jest.fn();

// Mock all necessary controllers to prevent errors
jest.mock('../../../controllers/customer.controller', () => ({
  getAllCustomers: mockGetAllCustomers,
  getCustomerById: mockGetCustomerById,
  createCustomer: mockCreateCustomer,
  updateCustomer: mockUpdateCustomer,
  updateCustomerStatus: mockUpdateCustomerStatus,
  addCustomerNote: mockAddCustomerNote,
  deleteCustomer: mockDeleteCustomer
}));

jest.mock('../../../controllers/settings.controller', () => ({
  getSystemSettings: mockGetSystemSettings,
  updateSystemSettings: mockUpdateSystemSettings,
  getBackupSettings: mockGetBackupSettings,
  updateBackupSettings: mockUpdateBackupSettings,
  triggerManualBackup: mockTriggerManualBackup,
  getUserSettings: mockGetUserSettings,
  updateUserSettings: mockUpdateUserSettings
}));

// Mock all other controllers with empty objects to prevent errors
jest.mock('../../../controllers/project.controller', () => ({}));
jest.mock('../../../controllers/appointment.controller', () => ({}));
jest.mock('../../../controllers/service.controller', () => ({}));
jest.mock('../../../controllers/request.controller', () => ({}));
jest.mock('../../../controllers/profile.controller', () => ({}));
jest.mock('../../../controllers/dashboard.controller', () => ({}));

// Import the module under test AFTER setting up all mocks
let apiRoutes: Router;

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Import the routes within each test to ensure mocks are applied
    apiRoutes = require('../../../routes/api.routes').default;
  });

  test('should be an Express router', () => {
    // Verify Router was called when the module was imported
    expect(mockRouter).toHaveBeenCalled();
    expect(apiRoutes).toBe(mockRouterInstance);
  });
  
  test('should register customer routes with authentication', () => {
    // Find the calls to mockRouterInstance.get with '/customers'
    const customersRoute = mockRouterInstance.get.mock.calls.find(
      call => call[0] === '/customers'
    );
    
    // Verify the route was registered with authentication
    expect(customersRoute).toBeDefined();
    if (customersRoute) {
      expect(customersRoute[1]).toBe(mockAuthenticate);
      expect(customersRoute[2]).toBe(mockGetAllCustomers);
    }
    
    // Find the call to mockRouterInstance.get with '/customers/:id'
    const customerByIdRoute = mockRouterInstance.get.mock.calls.find(
      call => call[0] === '/customers/:id'
    );
    
    // Verify the route was registered with authentication
    expect(customerByIdRoute).toBeDefined();
    if (customerByIdRoute) {
      expect(customerByIdRoute[1]).toBe(mockAuthenticate);
      expect(customerByIdRoute[2]).toBe(mockGetCustomerById);
    }
  });
  
  test('should register admin-only routes with isAdmin middleware', () => {
    // Find the calls to routes with admin middleware
    const adminRoute = mockRouterInstance.get.mock.calls.find(
      call => call[0] === '/settings/system'
    );
    
    // Verify the route was registered with admin middleware
    expect(adminRoute).toBeDefined();
    if (adminRoute) {
      expect(adminRoute[1]).toBe(mockAuthenticate);
      expect(adminRoute[2]).toBe(mockIsAdmin);
      expect(adminRoute[3]).toBe(mockGetSystemSettings);
    }
  });
});