import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Create mock router first
const mockRouter = {
  get: jest.fn().mockReturnThis(),
  post: jest.fn().mockReturnThis(),
  put: jest.fn().mockReturnThis(),
  patch: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis()
};

// Mock Express FIRST
jest.mock('express', () => {
  return {
    Router: jest.fn().mockImplementation(() => mockRouter)
  };
});

// Mock auth middleware
jest.mock('../../../middleware/auth.middleware', () => ({
  authenticate: jest.fn().mockImplementation(() => 'mock-authenticate')
}));

// Mock controller functions
const mockLogin = jest.fn().mockImplementation(() => 'mock-login');
const mockRefreshToken = jest.fn().mockImplementation(() => 'mock-refreshToken');
const mockForgotPassword = jest.fn().mockImplementation(() => 'mock-forgotPassword');
const mockValidateResetToken = jest.fn().mockImplementation(() => 'mock-validateResetToken');
const mockResetPassword = jest.fn().mockImplementation(() => 'mock-resetPassword');
const mockLogout = jest.fn().mockImplementation(() => 'mock-logout');

// Mock auth controller
jest.mock('../../../controllers/auth.controller', () => ({
  login: mockLogin,
  refreshToken: mockRefreshToken,
  forgotPassword: mockForgotPassword,
  validateResetToken: mockValidateResetToken,
  resetPassword: mockResetPassword,
  logout: mockLogout
}));

// Import all mocks
import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should register all routes correctly', () => {
    // Import the routes to trigger route registration
    require('../../../routes/auth.routes');
    
    // Check if the router methods were called with the correct paths and handlers
    expect(mockRouter.post).toHaveBeenCalledWith('/login', mockLogin);
    expect(mockRouter.post).toHaveBeenCalledWith('/refresh-token', mockRefreshToken);
    expect(mockRouter.post).toHaveBeenCalledWith('/forgot-password', mockForgotPassword);
    expect(mockRouter.get).toHaveBeenCalledWith('/reset-token/:token', mockValidateResetToken);
    expect(mockRouter.post).toHaveBeenCalledWith('/reset-password/:token', mockResetPassword);
    
    // For the logout route, Express receives the actual middleware function, not its return value
    expect(mockRouter.post).toHaveBeenCalledWith('/logout', authenticate, mockLogout);
  });
});