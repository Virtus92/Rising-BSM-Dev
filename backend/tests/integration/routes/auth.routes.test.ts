// Import must come after mocking setup
jest.mock('express', () => {
  const mockRouter = {
    get: jest.fn().mockReturnThis(),
    post: jest.fn().mockReturnThis(),
    put: jest.fn().mockReturnThis(),
    patch: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis()
  };
  
  return {
    Router: jest.fn(() => mockRouter)
  };
});

// Now import the modules
import '../../../routes/auth.routes';
import { Router } from 'express';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Create a strongly typed mock router
const mockRouter = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn()
};

// Mock middleware
jest.mock('../../../middleware/auth.middleware', () => ({
  authenticate: jest.fn()
}));

// Mock auth controller
jest.mock('../../../controllers/auth.controller', () => ({
  login: jest.fn(),
  refreshToken: jest.fn(),
  forgotPassword: jest.fn(),
  validateResetToken: jest.fn(),
  resetPassword: jest.fn(),
  logout: jest.fn()
}));

// Import directly for testing - don't call require yet
import * as authController from '../../../controllers/auth.controller';
import { authenticate } from '../../../middleware/auth.middleware';

// Set up routes for the first time
require('../../../routes/auth.routes');

describe('Auth Routes', () => {
  beforeEach(() => {
    // Clear all mock calls
    jest.clearAllMocks();
    
    // Execute the routes file again to register the routes
    const routesModule = require('../../../routes/auth.routes');
    if (typeof routesModule.default === 'function') {
      routesModule.default();
    }
  });

  test('should be an Express router', () => {
    expect(Router).toHaveBeenCalled();
  });
  
  test('should register login route without authentication', () => {
    expect(mockRouter.post).toHaveBeenCalledWith('/login', authController.login);
  });
  
  test('should register refresh token route without authentication', () => {
    expect(mockRouter.post).toHaveBeenCalledWith('/refresh-token', authController.refreshToken);
  });
  
  test('should register password reset routes without authentication', () => {
    expect(mockRouter.post).toHaveBeenCalledWith('/forgot-password', authController.forgotPassword);
    expect(mockRouter.get).toHaveBeenCalledWith('/reset-token/:token', authController.validateResetToken);
    expect(mockRouter.post).toHaveBeenCalledWith('/reset-password/:token', authController.resetPassword);
  });
  
  test('should register logout route with authentication', () => {
    expect(mockRouter.post).toHaveBeenCalledWith('/logout', authenticate, authController.logout);
  });
});