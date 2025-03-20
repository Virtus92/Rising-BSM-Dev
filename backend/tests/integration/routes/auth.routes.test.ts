import authRoutes from '../../../routes/auth.routes';
import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import * as authController from '../../../controllers/auth.controller';
import { describe, test, expect, jest } from '@jest/globals';

// Mock Express Router
jest.mock('express', () => ({
  Router: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn()
  }))
}));

// Mock middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticate: jest.fn()
}));

// Mock auth controller
jest.mock('../../controllers/auth.controller', () => ({
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
    const router = (Router as unknown as jest.Mock)();
    
    expect(router.post).toHaveBeenCalledWith('/login', authController.login);
  });
  
  test('should register refresh token route without authentication', () => {
    const router = (Router as unknown as jest.Mock)();
    
    expect(router.post).toHaveBeenCalledWith('/refresh-token', authController.refreshToken);
  });
  
  test('should register password reset routes without authentication', () => {
    const router = (Router as unknown as jest.Mock)();
    
    expect(router.post).toHaveBeenCalledWith('/forgot-password', authController.forgotPassword);
    expect(router.get).toHaveBeenCalledWith('/reset-token/:token', authController.validateResetToken);
    expect(router.post).toHaveBeenCalledWith('/reset-password/:token', authController.resetPassword);
  });
  
  test('should register logout route with authentication', () => {
    const router = (Router as unknown as jest.Mock)();
    
    expect(router.post).toHaveBeenCalledWith('/logout', authenticate, authController.logout);
  });
});