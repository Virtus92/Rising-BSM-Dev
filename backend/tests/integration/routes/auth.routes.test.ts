import authRoutes from '../../../routes/auth.routes';
import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import * as authController from '../../../controllers/auth.controller';
import { describe, test, expect, jest } from '@jest/globals';

// Create a strongly typed mock router
const mockRouter = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn()
};

// Mock Express Router
jest.mock('express', () => ({
  Router: jest.fn(() => mockRouter)
}));

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

describe('Auth Routes', () => {
  test('should be an Express router', () => {
    expect(Router).toHaveBeenCalled();
  });
  
  test('should register login route without authentication', () => {
    // Use the strongly typed mock
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